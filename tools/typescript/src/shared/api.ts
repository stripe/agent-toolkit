import Stripe from 'stripe';

import type {Context} from './configuration';
import tools, {StripeToolDefinition} from './tools';

const TOOLKIT_HEADER = 'stripe-agent-toolkit-typescript';
const MCP_HEADER = 'stripe-mcp';

class StripeAPI {
  stripe: Stripe;

  context: Context;

  tools: StripeToolDefinition[];

  constructor(secretKey: string, context?: Context) {
    const stripeClient = new Stripe(secretKey, {
      appInfo: {
        name:
          context?.mode === 'modelcontextprotocol'
            ? MCP_HEADER
            : TOOLKIT_HEADER,
        version: '0.8.1',
        url: 'https://github.com/stripe/ai',
      },
    });
    this.stripe = stripeClient;
    this.context = context || {};
    this.tools = tools(this.context);
  }

  async createMeterEvent({
    event,
    customer,
    value,
  }: {
    event: string;
    customer: string;
    value: string;
  }) {
    await this.stripe.billing.meterEvents.create(
      {
        event_name: event,
        payload: {
          stripe_customer_id: customer,
          value: value,
        },
      },
      this.context.account ? {stripeAccount: this.context.account} : undefined
    );
  }

  async run(method: string, arg: any) {
    const tool = this.tools.find((t) => t.method === method);
    if (tool) {
      const output = JSON.stringify(
        await tool.execute(this.stripe, this.context, arg)
      );
      return output;
    } else {
      throw new Error('Invalid method ' + method);
    }
  }
}

export default StripeAPI;
