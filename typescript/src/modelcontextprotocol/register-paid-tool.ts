import {z, ZodRawShape} from 'zod';
import {ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import Stripe from 'stripe';

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

export type PaidToolOptions = {
  priceId: string;
  paymentReason: string;
  successUrl: string;
  meterEvent?: string;
  stripeSecretKey: string;
  state: PaymentState;
  setState: (state: PaymentState) => void;
  userEmail: string;
};

export async function registerPaidTool<Args extends ZodRawShape>(
  mcpServer: McpServer,
  toolName: string,
  toolDescription: string,
  paramsSchema: Args,
  // eslint-disable-next-line complexity
  paidCallback: ToolCallback<Args>,
  options: PaidToolOptions
) {
  const stripe = new Stripe(options.stripeSecretKey, {
    appInfo: {
      name: 'stripe-agent-toolkit-mcp-payments',
      version: '0.7.5',
      url: 'https://github.com/stripe/agent-toolkit',
    },
  });

  const getCurrentCustomerID = async () => {
    if (options.state?.stripe?.customerId) {
      return options.state.stripe.customerId || '';
    }

    const customers = await stripe.customers.list({
      email: options.userEmail,
    });

    let customerId: null | string = null;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: options.userEmail,
      });

      customerId = customer.id;
    }

    return customerId;
  };

  const isToolPaidFor = async (
    stripeState: StripeState,
    toolName: string,
    customerId: string
  ) => {
    const checkoutSession = stripeState.paidToolsToCheckoutSession[toolName];
    if (checkoutSession) {
      const session = await stripe.checkout.sessions.retrieve(
        checkoutSession ?? ''
      );
      if (session.payment_status === 'paid') {
        options.setState({
          ...options.state,
          stripe: {
            ...stripeState,
            paidToolCalls: [...(stripeState.paidToolCalls || []), toolName],
          },
        });
        return true;
      }
    } else {
      const subs = await stripe.subscriptions.list({
        customer: customerId || '',
        status: 'active',
      });
      const activeSub = subs.data.find((sub) =>
        sub.items.data.find((item) => item.price.id === options.priceId)
      );
      if (activeSub) {
        return true;
      }
    }
    return false;
  };

  const createCheckoutSession = async (
    paymentType: string,
    customerId: string,
    stripeState: StripeState
  ): Promise<CallToolResult | null> => {
    if (paymentType === 'oneTimeSubscription') {
      try {
        const session = await stripe.checkout.sessions.create({
          success_url: options.successUrl,
          line_items: [
            {
              price: options.priceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          customer: customerId || undefined,
        });
        const newState: PaymentState = {
          ...options.state,
          stripe: {
            ...stripeState,
            customerId: customerId,
            paidToolsToCheckoutSession: {
              ...(stripeState.paidToolsToCheckoutSession || {}),
              [toolName]: session.id,
            },
          },
        };
        options.setState(newState);
        return {
          content: [
            {
              type: 'text',
              text:
                'Payment required! ' +
                options.paymentReason +
                ': ' +
                session.url,
            } as {type: 'text'; text: string},
          ],
        };
      } catch (error: any) {
        console.error(
          'Error creating stripe checkout session',
          error.raw?.message || error.message
        );
        return {
          content: [
            {
              type: 'text',
              text: 'There was an error creating the checkout.',
            } as {type: 'text'; text: string},
          ],
          isError: true,
        };
      }
    }
    if (paymentType === 'usageBased') {
      const session = await stripe.checkout.sessions.create({
        success_url: options.successUrl,
        line_items: [
          {
            price: options.priceId,
          },
        ],
        mode: 'subscription',
        customer: customerId || undefined,
      });
      const newState: PaymentState = {
        ...options.state,
        stripe: {
          ...stripeState,
          paidToolsToCheckoutSession: {
            ...(stripeState.paidToolsToCheckoutSession || {}),
            [toolName]: session.id,
          },
        },
      };
      options.setState(newState);
      return {
        content: [
          {
            type: 'text',
            text:
              'Payment required! ' + options.paymentReason + ': ' + session.url,
          } as {type: 'text'; text: string},
        ],
      };
    }
    return null;
  };

  const recordUsage = async (customerId: string) => {
    await stripe.billing.meterEvents.create({
      event_name: options.meterEvent!,
      payload: {
        stripe_customer_id: customerId!,
        value: '1',
      },
    });
  };

  const callback = async (args: any, extra: any): Promise<CallToolResult> => {
    let customerId = options.state?.stripe?.customerId;
    if (!customerId) {
      customerId = (await getCurrentCustomerID()) || '';
    }
    const stripeState = options.state?.stripe || INITIAL_STRIPE_STATE;
    stripeState.customerId = customerId;
    const paidForTool = await isToolPaidFor(stripeState, toolName, customerId);
    const paymentType = options.meterEvent
      ? 'usageBased'
      : 'oneTimeSubscription';
    if (!paidForTool) {
      const checkoutResult = await createCheckoutSession(
        paymentType,
        customerId,
        stripeState
      );
      if (checkoutResult) return checkoutResult;
    }
    if (paymentType === 'usageBased') {
      await recordUsage(customerId);
    }
    return paidCallback(args, extra);
  };

  mcpServer.tool(
    toolName,
    toolDescription,
    paramsSchema,
    callback as ToolCallback<Args>
  );

  await Promise.resolve();
}
