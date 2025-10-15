import { OpenAI as OpenAIOriginal, ClientOptions } from 'openai'
import type { APIPromise } from 'openai'
import type { Stream } from 'openai/streaming'
import type { ParsedResponse } from 'openai/resources/responses/responses'
import type { ResponseCreateParamsWithTools, ExtractParsedContentFromParams } from 'openai/lib/ResponsesParser'
import type { StripeConfig, StripeParams } from '../types'
import { extractStripeParams, normalizeUsage, normalizeResponsesUsage, logUsageEvent } from '../meter-event-logging'

const Chat = OpenAIOriginal.Chat
const Completions = Chat.Completions
const Responses = OpenAIOriginal.Responses
const Embeddings = OpenAIOriginal.Embeddings

type ChatCompletion = OpenAIOriginal.ChatCompletion
type ChatCompletionChunk = OpenAIOriginal.ChatCompletionChunk
type ChatCompletionCreateParamsBase = OpenAIOriginal.Chat.Completions.ChatCompletionCreateParams
type ChatCompletionCreateParamsNonStreaming = OpenAIOriginal.Chat.Completions.ChatCompletionCreateParamsNonStreaming
type ChatCompletionCreateParamsStreaming = OpenAIOriginal.Chat.Completions.ChatCompletionCreateParamsStreaming
type ResponsesCreateParamsBase = OpenAIOriginal.Responses.ResponseCreateParams
type ResponsesCreateParamsNonStreaming = OpenAIOriginal.Responses.ResponseCreateParamsNonStreaming
type ResponsesCreateParamsStreaming = OpenAIOriginal.Responses.ResponseCreateParamsStreaming
type CreateEmbeddingResponse = OpenAIOriginal.CreateEmbeddingResponse
type EmbeddingCreateParams = OpenAIOriginal.EmbeddingCreateParams

interface StripeTrackedOpenAIConfig extends ClientOptions {
  apiKey: string
  stripe: StripeConfig
}

type RequestOptions = Record<string, any>

/**
 * OpenAI client wrapper that tracks token usage and reports to Stripe
 */
class StripeTrackedOpenAI extends OpenAIOriginal {
  private readonly stripeConfig: StripeConfig
  public chat: WrappedChat
  public responses: WrappedResponses
  public embeddings: WrappedEmbeddings

  constructor(config: StripeTrackedOpenAIConfig) {
    const { stripe, ...openAIConfig } = config
    super(openAIConfig)
    this.stripeConfig = stripe
    this.chat = new WrappedChat(this, this.stripeConfig)
    this.responses = new WrappedResponses(this, this.stripeConfig)
    this.embeddings = new WrappedEmbeddings(this, this.stripeConfig)
  }
}

/**
 * Wrapped Chat class
 */
class WrappedChat extends Chat {
  constructor(parentClient: StripeTrackedOpenAI, stripeConfig: StripeConfig) {
    super(parentClient)
    this.completions = new WrappedCompletions(parentClient, stripeConfig)
  }

  public completions: WrappedCompletions
}

/**
 * Wrapped Completions class - handles chat.completions.create()
 */
class WrappedCompletions extends Completions {
  private readonly stripeConfig: StripeConfig
  private readonly baseURL: string

  constructor(client: OpenAIOriginal, stripeConfig: StripeConfig) {
    super(client)
    this.stripeConfig = stripeConfig
    this.baseURL = client.baseURL
  }

  // --- Overload #1: Non-streaming
  public create(
    body: ChatCompletionCreateParamsNonStreaming & StripeParams,
    options?: RequestOptions
  ): APIPromise<ChatCompletion>

  // --- Overload #2: Streaming
  public create(
    body: ChatCompletionCreateParamsStreaming & StripeParams,
    options?: RequestOptions
  ): APIPromise<Stream<ChatCompletionChunk>>

  // --- Overload #3: Generic base
  public create(
    body: ChatCompletionCreateParamsBase & StripeParams,
    options?: RequestOptions
  ): APIPromise<ChatCompletion | Stream<ChatCompletionChunk>>

  // --- Implementation Signature
  public create(
    body: ChatCompletionCreateParamsBase & StripeParams,
    options?: RequestOptions
  ): APIPromise<ChatCompletion | Stream<ChatCompletionChunk>> {
    const { providerParams: openAIParams, stripeCustomerId } = extractStripeParams(body)

    // For streaming requests, ensure we get usage data
    const paramsWithUsage = openAIParams.stream
      ? {
          ...openAIParams,
          stream_options: { include_usage: true },
        }
      : openAIParams

    const parentPromise = super.create(paramsWithUsage, options)

    if (openAIParams.stream) {
      return parentPromise.then((value) => {
        if ('tee' in value) {
          const [stream1, stream2] = value.tee()
          ;(async () => {
            try {
              let usage: any = {
                prompt_tokens: 0,
                completion_tokens: 0,
              }

              for await (const chunk of stream1) {
                // Capture usage information from the stream
                if (chunk.usage) {
                  usage = chunk.usage
                }
              }

              logUsageEvent(this.stripeConfig, {
                model: openAIParams.model,
                provider: 'openai',
                usage: normalizeUsage(usage),
                stripeCustomerId,
              })
            } catch (error: unknown) {
              logUsageEvent(this.stripeConfig, {
                model: openAIParams.model,
                provider: 'openai',
                usage: normalizeUsage(null),
                stripeCustomerId,
              })
            }
          })()

          // Return the other stream to the user
          return stream2
        }
        return value
      }) as APIPromise<Stream<ChatCompletionChunk>>
    } else {
      const wrappedPromise = parentPromise.then(
        async (result) => {
          if ('choices' in result) {
            logUsageEvent(this.stripeConfig, {
              model: openAIParams.model,
              provider: 'openai',
              usage: normalizeUsage(result.usage),
              stripeCustomerId,
            })
          }
          return result
        },
        async (error: unknown) => {
          logUsageEvent(this.stripeConfig, {
            model: String(openAIParams.model ?? ''),
            provider: 'openai',
            usage: normalizeUsage(null),
            stripeCustomerId,
          })
          throw error
        }
      ) as APIPromise<ChatCompletion>

      return wrappedPromise
    }
  }
}

/**
 * Wrapped Responses class - handles responses.create() and responses.parse()
 */
class WrappedResponses extends Responses {
  private readonly stripeConfig: StripeConfig
  private readonly baseURL: string

  constructor(client: OpenAIOriginal, stripeConfig: StripeConfig) {
    super(client)
    this.stripeConfig = stripeConfig
    this.baseURL = client.baseURL
  }

  // --- Overload #1: Non-streaming
  public create(
    body: ResponsesCreateParamsNonStreaming & StripeParams,
    options?: RequestOptions
  ): APIPromise<OpenAIOriginal.Responses.Response>

  // --- Overload #2: Streaming
  public create(
    body: ResponsesCreateParamsStreaming & StripeParams,
    options?: RequestOptions
  ): APIPromise<Stream<OpenAIOriginal.Responses.ResponseStreamEvent>>

  // --- Overload #3: Generic base
  public create(
    body: ResponsesCreateParamsBase & StripeParams,
    options?: RequestOptions
  ): APIPromise<OpenAIOriginal.Responses.Response | Stream<OpenAIOriginal.Responses.ResponseStreamEvent>>

  // --- Implementation Signature
  public create(
    body: ResponsesCreateParamsBase & StripeParams,
    options?: RequestOptions
  ): APIPromise<OpenAIOriginal.Responses.Response | Stream<OpenAIOriginal.Responses.ResponseStreamEvent>> {
    const { providerParams: openAIParams, stripeCustomerId } = extractStripeParams(body)

    const parentPromise = super.create(openAIParams, options)

    if (openAIParams.stream) {
      return parentPromise.then((value) => {
        if ('tee' in value && typeof (value as any).tee === 'function') {
          const [stream1, stream2] = (value as any).tee()
          ;(async () => {
            try {
              let usage: any = {
                input_tokens: 0,
                output_tokens: 0,
              }

              for await (const chunk of stream1) {
                if ('response' in chunk && chunk.response?.usage) {
                  usage = chunk.response.usage
                }
              }

              logUsageEvent(this.stripeConfig, {
                model: (openAIParams as any).model,
                provider: 'openai',
                usage: normalizeResponsesUsage(usage),
                stripeCustomerId,
              })
            } catch (error: unknown) {
              logUsageEvent(this.stripeConfig, {
                model: (openAIParams as any).model,
                provider: 'openai',
                usage: normalizeResponsesUsage(null),
                stripeCustomerId,
              })
            }
          })()

          return stream2
        }
        return value
      }) as APIPromise<Stream<OpenAIOriginal.Responses.ResponseStreamEvent>>
    } else {
      const wrappedPromise = parentPromise.then(
        async (result) => {
          if ('output' in result) {
            logUsageEvent(this.stripeConfig, {
              model: (openAIParams as any).model,
              provider: 'openai',
              usage: normalizeResponsesUsage(result.usage),
              stripeCustomerId,
            })
          }
          return result
        },
        async (error: unknown) => {
          logUsageEvent(this.stripeConfig, {
            model: String(openAIParams.model ?? ''),
            provider: 'openai',
            usage: normalizeResponsesUsage(null),
            stripeCustomerId,
          })
          throw error
        }
      ) as APIPromise<OpenAIOriginal.Responses.Response>

      return wrappedPromise
    }
  }

  public parse<Params extends ResponseCreateParamsWithTools, ParsedT = ExtractParsedContentFromParams<Params>>(
    body: Params & StripeParams,
    options?: RequestOptions
  ): APIPromise<ParsedResponse<ParsedT>> {
    const { providerParams: openAIParams, stripeCustomerId } = extractStripeParams(body)

    const originalCreate = super.create.bind(this)
    const originalSelf = this as any
    const tempCreate = originalSelf.create
    originalSelf.create = originalCreate

    try {
      const parentPromise = super.parse(openAIParams, options)

      const wrappedPromise = parentPromise.then(
        async (result) => {
          logUsageEvent(this.stripeConfig, {
            model: String(openAIParams.model ?? ''),
            provider: 'openai',
            usage: normalizeResponsesUsage(result.usage),
            stripeCustomerId,
          })
          return result
        },
        async (error: unknown) => {
          logUsageEvent(this.stripeConfig, {
            model: String(openAIParams.model ?? ''),
            provider: 'openai',
            usage: normalizeResponsesUsage(null),
            stripeCustomerId,
          })
          throw error
        }
      )

      return wrappedPromise as APIPromise<ParsedResponse<ParsedT>>
    } finally {
      // Restore our wrapped create method
      originalSelf.create = tempCreate
    }
  }
}

/**
 * Wrapped Embeddings class - handles embeddings.create()
 */
class WrappedEmbeddings extends Embeddings {
  private readonly stripeConfig: StripeConfig
  private readonly baseURL: string

  constructor(client: OpenAIOriginal, stripeConfig: StripeConfig) {
    super(client)
    this.stripeConfig = stripeConfig
    this.baseURL = client.baseURL
  }

  public create(
    body: EmbeddingCreateParams & StripeParams,
    options?: RequestOptions
  ): APIPromise<CreateEmbeddingResponse> {
    const { providerParams: openAIParams, stripeCustomerId } = extractStripeParams(body)

    const parentPromise = super.create(openAIParams, options)

    const wrappedPromise = parentPromise.then(
      async (result) => {
        logUsageEvent(this.stripeConfig, {
          model: openAIParams.model,
          provider: 'openai',
          usage: normalizeUsage(result.usage),
          stripeCustomerId,
        })
        return result
      },
      async (error: unknown) => {
        logUsageEvent(this.stripeConfig, {
          model: openAIParams.model,
          provider: 'openai',
          usage: normalizeUsage(null),
          stripeCustomerId,
        })
        throw error
      }
    ) as APIPromise<CreateEmbeddingResponse>

    return wrappedPromise
  }
}

// Export as OpenAI (default) and StripeTrackedOpenAI (alternative)
export default StripeTrackedOpenAI
export { StripeTrackedOpenAI as OpenAI, StripeTrackedOpenAI }

