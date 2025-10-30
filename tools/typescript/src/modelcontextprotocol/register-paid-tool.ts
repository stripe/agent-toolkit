import {z, type ZodRawShape} from 'zod/v3';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {ToolCallback} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import Stripe from 'stripe';

/*
 * This supports one-time payment, subscription, usage-based metered payment.
 * For usage-based, set a `meterEvent`
 */
export type PaidToolOptions = {
  paymentReason: string;
  meterEvent?: string;
  stripeSecretKey: string;
  userEmail: string;
  checkout: Stripe.Checkout.SessionCreateParams;
};

export async function registerPaidTool<Args extends ZodRawShape>(
  mcpServer: McpServer,
  toolName: string,
  toolDescription: string,
  paramsSchema: Args,
  // @ts-ignore: The typescript compiler complains this is an infinitely deep type
  paidCallback: ToolCallback<Args>,
  options: PaidToolOptions
) {
  const priceId = options.checkout.line_items?.find((li) => li.price)?.price;

  if (!priceId) {
    throw new Error(
      'Price ID is required for a paid MCP tool. Learn more about prices: https://docs.stripe.com/products-prices/how-products-and-prices-work'
    );
  }

  const stripe = new Stripe(options.stripeSecretKey, {
    appInfo: {
      name: 'stripe-agent-toolkit-mcp-payments',
      version: '0.8.0',
      url: 'https://github.com/stripe/agent-toolkit',
    },
  });

  const getCurrentCustomerID = async () => {
    const customers = await stripe.customers.list({
      email: options.userEmail,
    });
    let customerId: null | string = null;
    if (customers.data.length > 0) {
      customerId =
        customers.data.find((customer) => {
          return customer.email === options.userEmail;
        })?.id || null;
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: options.userEmail,
      });
      customerId = customer.id;
    }

    return customerId;
  };

  const isToolPaidFor = async (toolName: string, customerId: string) => {
    // Check for paid checkout session for this tool (by metadata)
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 100,
    });
    const paidSession = sessions.data.find(
      (session) =>
        session.metadata?.toolName === toolName &&
        session.payment_status === 'paid'
    );

    if (paidSession?.subscription) {
      // Check for active subscription for the priceId
      const subs = await stripe.subscriptions.list({
        customer: customerId || '',
        status: 'active',
      });
      const activeSub = subs.data.find((sub) =>
        sub.items.data.find((item) => item.price.id === priceId)
      );
      if (activeSub) {
        return true;
      }
    }

    if (paidSession) {
      return true;
    }
    return false;
  };

  const createCheckoutSession = async (
    paymentType: string,
    customerId: string
  ): Promise<CallToolResult | null> => {
    try {
      const session = await stripe.checkout.sessions.create({
        ...options.checkout,
        metadata: {
          ...options.checkout.metadata,
          toolName,
        },
        customer: customerId || undefined,
      });
      const result = {
        status: 'payment_required',
        data: {
          paymentType,
          checkoutUrl: session.url,
          paymentReason: options.paymentReason,
        },
      };
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          } as {type: 'text'; text: string},
        ],
      };
    } catch (error: unknown) {
      let errMsg = 'Unknown error';
      if (typeof error === 'object' && error !== null) {
        if (
          'raw' in error &&
          typeof (error as {raw?: {message?: string}}).raw?.message === 'string'
        ) {
          errMsg = (error as {raw: {message: string}}).raw.message;
        } else if (
          'message' in error &&
          typeof (error as {message?: string}).message === 'string'
        ) {
          errMsg = (error as {message: string}).message;
        }
      }
      console.error('Error creating stripe checkout session', errMsg);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              error: errMsg,
            }),
          } as {type: 'text'; text: string},
        ],
        isError: true,
      };
    }
  };

  const recordUsage = async (customerId: string) => {
    if (!options.meterEvent) return;
    await stripe.billing.meterEvents.create({
      event_name: options.meterEvent,
      payload: {
        stripe_customer_id: customerId,
        value: '1',
      },
    });
  };

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const callback = async (args: any, extra: any): Promise<CallToolResult> => {
    const customerId = await getCurrentCustomerID();
    const paidForTool = await isToolPaidFor(toolName, customerId);
    const paymentType = options.meterEvent
      ? 'usageBased'
      : 'oneTimeSubscription';
    if (!paidForTool) {
      const checkoutResult = await createCheckoutSession(
        paymentType,
        customerId
      );
      if (checkoutResult) return checkoutResult;
    }
    if (paymentType === 'usageBased') {
      await recordUsage(customerId);
    }
    // @ts-ignore: The typescript compiler complains this is an infinitely deep type
    return paidCallback(args, extra);
  };

  // @ts-ignore: The typescript compiler complains this is an infinitely deep type
  mcpServer.tool(toolName, toolDescription, paramsSchema, callback as any);

  await Promise.resolve();
}
