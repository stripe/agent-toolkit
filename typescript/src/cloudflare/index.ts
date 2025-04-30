import type {ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import {McpAgent} from 'agents/mcp';
import Stripe from 'stripe';
import {ZodRawShape} from 'zod';
// @ts-ignore
import {env} from 'cloudflare:workers';

type Env = any;

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  appInfo: {
    name: 'agent-toolkit/cloudflare',
    version: '0.0.1',
    url: 'https://github.com/stripe/agent-toolkit',
  },
});

export type PaymentState = {
  stripe: {
    paidToolCalls: string[];
    subscriptions: string[];
    customerId: string;
    paidToolsToCheckoutSession: Record<string, string | null>;
  };
};

export abstract class experimental_PaidMcpAgent<
  Bindings extends Env,
  State extends PaymentState,
  Props extends {userEmail: string},
> extends McpAgent<Bindings, State, Props> {
  INITIAL_STRIPE_STATE: PaymentState = {
    stripe: {
      customerId: '',
      paidToolCalls: [],
      subscriptions: [],
      paidToolsToCheckoutSession: {},
    },
  };

  // TODO: having both this.state.stripe and this.stripe is confusing
  stripe = stripe;

  async createCustomer() {
    if (this.state?.stripe?.customerId) {
      return;
    }

    console.log('Creating customer or loading', this.props.userEmail);

    const customers = await this.stripe.customers.list({
      email: this.props.userEmail,
    });

    let customerId: null | string = null;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await this.stripe.customers.create({
        email: this.props.userEmail,
      });

      customerId = customer.id;
    }

    this.setState({
      ...this.state,
      stripe: {
        ...this.INITIAL_STRIPE_STATE.stripe,
        ...this.state.stripe,
        customerId: customerId,
      },
    });

    return customerId;
  }

  async getRedirectUrl() {
    const redirectUrl = await this.env.OAUTH_KV.get(this.props.userEmail);
    if (!redirectUrl) {
      return 'https://example.com';
    }
    // return redirectUrl with no search params
    return redirectUrl.split('?')[0];
  }

  onStateUpdate(state: State) {
    console.log({stateUpdate: state});
  }

  paidTool<Args extends ZodRawShape>(
    toolName: string,
    paramsSchema: Args,
    paidCallback: ToolCallback<Args>,
    {
      priceId,
      paymentReason,
      meterEvent,
    }: // onPaymentRequired,
    // onPaymentSuccess,
    {
      priceId: string;
      paymentReason: string;
      meterEvent?: string;
      // onPaymentRequired: (checkoutUri: string) => CallToolResult;
      // onPaymentSuccess: ToolCallback<Args>;
    }
  ) {
    const mcpServer: McpServer = this.server as unknown as McpServer;

    // Why is state undefined sometimes??
    const state = this.state as undefined | typeof this.state;

    const callback = async (args: any, extra: any): Promise<CallToolResult> => {
      const redirectUrl = await this.getRedirectUrl();

      let customerId = state?.stripe?.customerId;
      if (!customerId) {
        console.log('No customer - creating or retrieving one');
        const customer = await this.createCustomer();
        if (customer) {
          customerId = customer;
        }
      }

      console.log(
        `in tool ${toolName} with customerId ${customerId}, paid tool calls ${state?.stripe?.paidToolCalls}`
      );

      let paidForTool = state?.stripe?.paidToolCalls?.includes(toolName);

      if (!paidForTool) {
        const checkoutSession =
          state?.stripe.paidToolsToCheckoutSession[toolName];

        if (checkoutSession) {
          const session = await this.stripe.checkout.sessions.retrieve(
            checkoutSession ?? ''
          );
          if (session.payment_status === 'paid') {
            paidForTool = true;

            // why does state restart every time the server is restarted?

            this.setState({
              ...state,
              stripe: {
                ...(state?.stripe || {}),
                paidToolCalls: [
                  ...(state?.stripe?.paidToolCalls || []),
                  toolName,
                ],
              },
            });
          }
        } else {
          const subs = await this.stripe.subscriptions.list({
            customer: customerId || '',
            status: 'active',
          });
          const activeSub = subs.data.find((sub) =>
            sub.items.data.find((item) => item.price.id === priceId)
          );
          if (activeSub) {
            console.log(
              'User has active subscription for this tool already, considering it paid.'
            );
            paidForTool = true;
          }
        }
      }

      const paymentType = meterEvent ? 'usageBased' : 'oneTimeSubscription';

      if (!paidForTool) {
        if (paymentType === 'oneTimeSubscription') {
          try {
            const session = await stripe.checkout.sessions.create({
              success_url: redirectUrl,
              line_items: [
                {
                  price: priceId,
                  quantity: 1,
                },
              ],
              mode: 'subscription',
              customer: customerId || undefined,
            });
            console.log('Created stripe checkout session', session);

            const newState: State = {
              ...((state || {}) as State),
              stripe: {
                ...this.INITIAL_STRIPE_STATE.stripe,
                ...(state?.stripe || {}),
                paidToolsToCheckoutSession: {
                  ...(state?.stripe?.paidToolsToCheckoutSession || {}),
                  [toolName]: session.id,
                },
              },
            };

            this.setState(newState);

            return {
              content: [
                {
                  type: 'text',
                  text:
                    'Payment required! ' + paymentReason + ': ' + session.url,
                },
              ],
            };
          } catch (error: any) {
            console.error(
              'Error creating stripe checkout session',
              error.raw.message
            );
            return {
              content: [
                {
                  type: 'text',
                  text: 'There was an error creating the checkout.',
                },
              ],
            };
          }
        }

        if (paymentType === 'usageBased') {
          // todo - obviously can clean up code
          const session = await stripe.checkout.sessions.create({
            success_url: redirectUrl,
            line_items: [
              {
                price: priceId,
              },
            ],
            mode: 'subscription',
            customer: customerId || undefined,
          });
          console.log('Created stripe checkout session', session);

          const newState: State = {
            ...((state || {}) as State),
            stripe: {
              ...this.INITIAL_STRIPE_STATE.stripe,
              ...(state?.stripe || {}),
              paidToolsToCheckoutSession: {
                ...(state?.stripe?.paidToolsToCheckoutSession || {}),
                [toolName]: session.id,
              },
            },
          };

          this.setState(newState);

          return {
            content: [
              {
                type: 'text',
                text: 'Payment required! ' + paymentReason + ': ' + session.url,
              },
            ],
          };
        }
      }

      if (paymentType === 'usageBased') {
        const evt = await stripe.billing.meterEvents.create({
          event_name: meterEvent!,
          payload: {
            // TODO: be more strict about customer id
            stripe_customer_id: customerId!,
            value: '1',
          },
        });
      }

      return paidCallback(args, extra);
    };

    mcpServer.tool(toolName, paramsSchema, callback as ToolCallback<Args>);
  }
}
