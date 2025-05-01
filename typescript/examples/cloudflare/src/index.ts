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

  paymentSuccessRedirectEndpoint = '/payment/success';

  async init() {
    this.server.tool('add', {a: z.number(), b: z.number()}, ({a, b}) => {
      return {
        content: [{type: 'text', text: `Result: ${a + b}`}],
      };
    });

    this.paidTool(
      'big_add',
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
        priceId: 'price_1RJJwjR1bGyW9S0UCIDTSU3V',
        successUrl: 'http://localhost:4242/payment/success',
        paymentReason:
          'You must pay a subscription to add two big numbers together.',
      }
    );

    this.paidTool(
      'generate_emoji',
      {
        object: z.string().describe('one word'),
      },
      ({object}) => {
        return {
          content: [{type: 'text', text: generateImage(object)}],
        };
      },
      {
        priceId: 'price_1RJdGWR1bGyW9S0UucbYBFBZ',
        successUrl: 'http://localhost:4242/payment/success',
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
  // @ts-ignore
  apiHandler: MyMCP.mount('/sse'),
  // @ts-ignore
  defaultHandler: app,
  authorizeEndpoint: '/authorize',
  tokenEndpoint: '/token',
  clientRegistrationEndpoint: '/register',
});
