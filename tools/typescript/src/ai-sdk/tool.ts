import {tool} from 'ai';
import {z} from 'zod/v3';
import StripeAPI from '../shared/api';

type ProviderTool = ReturnType<typeof tool>;

export default function StripeTool(
  stripeAPI: StripeAPI,
  method: string,
  description: string,
  schema: z.ZodObject<any, any, any, any, {[x: string]: any}>
) {
  return tool({
    description: description,
    inputSchema: schema,
    execute: (arg: z.output<typeof schema>) => {
      return stripeAPI.run(method, arg);
    },
  });
}
