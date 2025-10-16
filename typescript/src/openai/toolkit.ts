import StripeAPI from '../shared/api';
import tools from '../shared/tools';
import {isToolAllowed, type Configuration} from '../shared/configuration';
import {zodToJsonSchema} from 'zod-to-json-schema';
import type {
  ChatCompletionTool,
  ChatCompletionMessageToolCall,
  ChatCompletionToolMessageParam,
} from 'openai/resources';
import type {ChatCompletionMessageFunctionToolCall} from 'openai/resources/chat/completions';

class StripeAgentToolkit {
  private _stripe: StripeAPI;

  tools: ChatCompletionTool[];

  constructor({
    secretKey,
    configuration,
  }: {
    secretKey: string;
    configuration: Configuration;
  }) {
    this._stripe = new StripeAPI(secretKey, configuration.context);

    const context = configuration.context || {};
    const filteredTools = tools(context).filter((tool) =>
      isToolAllowed(tool, configuration)
    );

    this.tools = filteredTools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.method,
        description: tool.description,
        parameters: zodToJsonSchema(tool.parameters),
      },
    }));
  }

  getTools(): ChatCompletionTool[] {
    return this.tools;
  }

  /**
   * Processes a single OpenAI tool call by executing the requested function.
   *
   * @param {ChatCompletionMessageFunctionToolCall} toolCall - The tool call object from OpenAI containing
   *   function name, arguments, and ID.
   * @returns {Promise<ChatCompletionToolMessageParam>} A promise that resolves to a tool message
   *   object containing the result of the tool execution with the proper format for the OpenAI API.
   */
  async handleToolCall(toolCall: ChatCompletionMessageFunctionToolCall) {
    const args = JSON.parse(toolCall.function.arguments);
    const response = await this._stripe.run(toolCall.function.name, args);
    return {
      role: 'tool',
      tool_call_id: toolCall.id,
      content: response,
    } as ChatCompletionToolMessageParam;
  }
}

export default StripeAgentToolkit;
