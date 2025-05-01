import {z, ZodRawShape} from 'zod';
import {ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import Stripe from 'stripe';

const {McpAgent} = require('agents/mcp');

type Env = any;

export type PaymentState = {
  stripe?: {
    paidToolCalls: string[];
    subscriptions: string[];
    customerId: string;
    paidToolsToCheckoutSession: Record<string, string | null>;
  };
};

export type PaymentProps = {
  userEmail: string;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export abstract class experimental_PaidMcpAgent<
  Bindings extends Env,
  State extends PaymentState,
  Props extends PaymentProps,
> extends McpAgent<Bindings, State, Props> {
  INITIAL_STRIPE_STATE: PaymentState = {
    stripe: {
      customerId: '',
      paidToolCalls: [],
      subscriptions: [],
      paidToolsToCheckoutSession: {},
    },
  };

  stripe(): Stripe {
    return new Stripe(this.env.STRIPE_SECRET_KEY, {
      appInfo: {
        name: 'agent-toolkit/cloudflare',
        version: '0.7.0',
        url: 'https://github.com/stripe/agent-toolkit',
      },
    });
  }

  async getCurrentCustomerID() {
    if (this.state?.stripe?.customerId) {
      return;
    }

    console.log('Creating customer or loading', this.props.userEmail);

    const customers = await this.stripe().customers.list({
      email: this.props.userEmail,
    });

    let customerId: null | string = null;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await this.stripe().customers.create({
        email: this.props.userEmail,
      });

      customerId = customer.id;
    }

    return customerId;
  }

  onStateUpdate(state: State) {
    console.log({stateUpdate: state});
  }

  paidTool<Args extends ZodRawShape>(
    toolName: string,
    paramsSchema: Args,
    // @ts-ignore
    paidCallback: ToolCallback<Args>,
    {
      priceId,
      paymentReason,
      successUrl,
      meterEvent,
    }: {
      priceId: string;
      paymentReason: string;
      successUrl: string;
      meterEvent?: string;
    }
  ) {
    const mcpServer: McpServer = this.server as unknown as McpServer;

    // Why is state undefined sometimes??
    const state = this.state as undefined | typeof this.state;

    let redirectUrl = this.successUrl;
    if (redirectUrl.startsWith('/')) {
      // Figure out how to actual get the base url of the mcpServer somehow instead
      // of hardcoding it:
      const baseUrl = 'http://localhost:4242';
      redirectUrl = `${baseUrl}${this.successUrl}`;
    }

    // eslint-disable-next-line complexity
    const callback = async (args: any, extra: any): Promise<CallToolResult> => {
      let customerId = state?.stripe?.customerId;
      if (!customerId) {
        console.log('No customer - creating or retrieving one');
        const customer = await this.getCurrentCustomerID();
        if (customer) {
          customerId = customer;
        }
      }

      console.log(
        `In tool ${toolName} with customerId ${customerId}, paid tool calls ${state?.stripe?.paidToolCalls}`
      );

      const stripeState = state?.stripe || this.INITIAL_STRIPE_STATE.stripe;
      stripeState.customerId = customerId;

      let paidForTool = stripeState.paidToolCalls?.includes(toolName);

      if (!paidForTool) {
        const checkoutSession =
          stripeState.paidToolsToCheckoutSession[toolName];

        if (checkoutSession) {
          const session = await this.stripe().checkout.sessions.retrieve(
            checkoutSession ?? ''
          );
          if (session.payment_status === 'paid') {
            paidForTool = true;

            // why does state restart every time the server is restarted?

            this.setState({
              ...state,
              stripe: {
                ...stripeState,
                paidToolCalls: [...(stripeState.paidToolCalls || []), toolName],
              },
            });
          }
        } else {
          const subs = await this.stripe().subscriptions.list({
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
            const session = await this.stripe().checkout.sessions.create({
              success_url: successUrl,
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
                ...stripeState,
                customerId: customerId,
                paidToolsToCheckoutSession: {
                  ...(stripeState.paidToolsToCheckoutSession || {}),
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
          const session = await this.stripe().checkout.sessions.create({
            success_url: successUrl,
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
              ...stripeState,
              paidToolsToCheckoutSession: {
                ...(stripeState.paidToolsToCheckoutSession || {}),
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
        await this.stripe().billing.meterEvents.create({
          event_name: meterEvent!,
          payload: {
            stripe_customer_id: customerId!,
            value: '1',
          },
        });
      }

      // @ts-ignore: This is causing an infinite typescript recursion error. We will fix this.
      return paidCallback(args, extra);
    };

    mcpServer.tool(toolName, paramsSchema, callback as ToolCallback<Args>);
  }
}
