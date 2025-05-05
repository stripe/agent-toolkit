import {z, ZodRawShape} from 'zod';
import {ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import Stripe from 'stripe';
import {McpAgent} from 'agents/mcp';

type Env = any;

type StripeState = {
  paidToolCalls: string[];
  subscriptions: string[];
  customerId: string;
  paidToolsToCheckoutSession: Record<string, string | null>;
};

const INITIAL_STRIPE_STATE: StripeState = {
  customerId: '',
  paidToolCalls: [],
  subscriptions: [],
  paidToolsToCheckoutSession: {},
};

export type PaymentState = {
  stripe?: StripeState;
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
  stripe(): Stripe {
    // @ts-ignore
    return new Stripe(this.env.STRIPE_SECRET_KEY, {
      appInfo: {
        name: 'stripe-agent-toolkit-cloudflare',
        version: '0.7.6',
        url: 'https://github.com/stripe/agent-toolkit',
      },
    });
  }

  async getCurrentCustomerID() {
    if (this.state?.stripe?.customerId) {
      return this.state.stripe.customerId || '';
    }
    const {userEmail} = this.props;

    const customers = userEmail
      ? await this.stripe().customers.list({
          email: userEmail,
        })
      : {data: []};

    let customerId: null | string =
      customers.data.find((customer) => {
        return customer.email === userEmail;
      })?.id || null;
    if (!customerId) {
      const customer = await this.stripe().customers.create({
        email: userEmail,
      });

      customerId = customer.id;
    }

    return customerId;
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

    // eslint-disable-next-line complexity
    const callback = async (args: any, extra: any): Promise<CallToolResult> => {
      let customerId = state?.stripe?.customerId;
      if (!customerId) {
        customerId = (await this.getCurrentCustomerID()) || '';
      }

      const stripeState = state?.stripe || INITIAL_STRIPE_STATE;
      stripeState.customerId = customerId;

      let paidForTool = false;

      if (!paidForTool) {
        const checkoutSession =
          stripeState.paidToolsToCheckoutSession[toolName];

        if (checkoutSession) {
          const session = await this.stripe().checkout.sessions.retrieve(
            checkoutSession ?? ''
          );
          if (session.payment_status === 'paid') {
            paidForTool = true;

            // @ts-ignore
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
