import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {
  PaymentState,
  experimental_PaidMcpAgent as PaidMcpAgent,
} from '@stripe/agent-toolkit/cloudflare';
import {generateImage} from './imageGenerator';
import {OAuthProvider} from '@cloudflare/workers-oauth-provider';
import app from './app';

type Bindings = Env;

type Props = {
  userEmail: string;
};

type State = PaymentState & {};

export class MyMCP extends PaidMcpAgent<Bindings, State, Props> {
  server = new McpServer({
    name: 'Demo',
    version: '1.0.0',
  });

  initialState: State = {};

  async init() {
    this.server.tool('add', {a: z.number(), b: z.number()}, ({a, b}) => {
      return {
        content: [{type: 'text', text: `Result: ${a + b}`}],
      };
    });

    // One-time payment, then the tool is usable forever
    this.paidTool(
      'buy_premium',
      'Buy a premium account',
      {},
      () => {
        return {
          content: [{type: 'text', text: `You now have a premium account!`}],
        };
      },
      {
        checkout: {
          success_url: 'http://localhost:4242/payment/success',
          line_items: [
            {
              price: process.env.STRIPE_PRICE_ID_ONE_TIME_PAYMENT,
              quantity: 1,
            },
          ],
          mode: 'payment',
        },
        paymentReason:
          'Open the checkout link in the browser to buy a premium account.',
      }
    );

    // Subscription, then the tool is usable as long as the subscription is active
    this.paidTool(
      'big_add',
      'Add two numbers together',
      {
        a: z.number(),
        b: z.number(),
      },
      ({a, b}) => {
        return {
          content: [{type: 'text', text: `Result: ${a + b}`}],
        };
      },
      {
        checkout: {
          success_url: 'http://localhost:4242/payment/success',
          line_items: [
            {
              price: process.env.STRIPE_PRICE_ID_SUBSCRIPTION,
              quantity: 1,
            },
          ],
          mode: 'subscription',
        },
        paymentReason:
          'You must pay a subscription to add two big numbers together.',
      }
    );

    // Usage-based metered payments (Each tool call requires a payment)
    this.paidTool(
      'generate_emoji',
      'Generate an emoji given a single word (the `object` parameter describing the emoji)',
      {
        object: z.string().describe('one word'),
      },
      ({object}) => {
        return {
          content: [{type: 'text', text: generateImage(object)}],
        };
      },
      {
        checkout: {
          success_url: 'http://localhost:4242/payment/success',
          line_items: [
            {
              price: process.env.STRIPE_PRICE_ID_USAGE_BASED_SUBSCRIPTION,
            },
          ],
          mode: 'subscription',
        },
        meterEvent: 'image_generation',
        paymentReason:
          'You get 3 free generations, then we charge 10 cents per generation.',
      }
    );
  }
}

// Export the OAuth handler as the default
export default new OAuthProvider({
  apiRoute: '/sse',
  apiHandlers: {
    // @ts-ignore
    '/sse': MyMCP.serveSSE('/sse'),
    // @ts-ignore
    '/mcp': MyMCP.serve('/mcp'),
  },
  // @ts-ignore
  defaultHandler: app,
  authorizeEndpoint: '/authorize',
  tokenEndpoint: '/token',
  clientRegistrationEndpoint: '/register',
});
