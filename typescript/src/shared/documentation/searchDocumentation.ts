import Stripe from 'stripe';
import {z} from 'zod';
import type {Context} from '@/shared/configuration';
import type {Tool} from '@/shared/tools';
export const searchDocumentationPrompt = (_context: Context = {}) => `
This tool will take in a user question about integrating with Stripe in their application, then search and retrieve relevant Stripe documentation to answer the question.

It takes two arguments:
- question (str): The user question to search an answer for in the Stripe documentation.
- language (str, optional): The programming language to search for in the the documentation.
`;

export const searchDocumentationParameters = (
  _context: Context = {}
): z.AnyZodObject =>
  z.object({
    question: z
      .string()
      .describe(
        'The user question about integrating with Stripe will be used to search the documentation.'
      ),
    language: z
      .enum(['dotnet', 'go', 'java', 'node', 'php', 'ruby', 'python', 'curl'])
      .optional()
      .describe(
        'The programming language to search for in the the documentation.'
      ),
  });

export const searchDocumentation = async (
  _stripe: Stripe,
  context: Context,
  params: z.infer<ReturnType<typeof searchDocumentationParameters>>
) => {
  try {
    const endpoint = 'https://ai.stripe.com/search';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
        'User-Agent':
          context.mode === 'modelcontextprotocol'
            ? 'stripe-mcp'
            : 'stripe-agent-toolkit-typescript',
      },
      body: JSON.stringify(params),
    });

    // If status not in 200-299 range, throw error
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data?.sources;
  } catch (error) {
    return 'Failed to search documentation';
  }
};

const tool = (context: Context): Tool => ({
  method: 'search_stripe_documentation',
  name: 'Search Stripe Documentation',
  description: searchDocumentationPrompt(context),
  parameters: searchDocumentationParameters(context),
  actions: {
    documentation: {
      read: true,
    },
  },
  execute: searchDocumentation,
});

export default tool;
