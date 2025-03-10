import {OpenAIClient} from "./OpenAIClient";
import DefaultHistoryManager from '../../../utils/history'
import {ArgumentValue, Function, ModelResponseChunk, Parameter, Tool, UserMessage} from "../../../types";
import {BaseClientOptions, DefaultLogger} from "../../../types";

const searchTool = new class SearchTool implements Tool {
  constructor() {
    this.function = {
      name: 'search',
      description: 'search from search engine',
      parameters: {
        type: 'object',
        required: ['query', 'limit'],
        properties: {
          query: {
            type: 'string',
            description: 'query string',
          },
          limit: {
            type: 'number',
            description: 'limit',
          }
        }
      } as Parameter
    } as Function
  }

  type: "function";
  function: Function

  async run(args: Record<string, ArgumentValue | Record<string, ArgumentValue>>): Promise<string> {
    DefaultLogger.info(`search query: ${args.query}`)
    return "search failed"
  }
}()

describe('OpenAIClient', () => {
  test('OpenAIClient works correctly', async () => {
    const openaiClient = new OpenAIClient(new BaseClientOptions({
      apiKey: process.env.OPENAI_API_KEY as string,
      baseUrl: process.env.OPENAI_BASE_URL as string,
      features: ['chat', 'tool'],
      historyManager: DefaultHistoryManager,
      tools: [searchTool]
    }))
    const userMessage = {
      role: 'user',
      content: [{
        type: 'text',
        text: 'search about weather in Beijing and Shanghai'
      }]
    } as UserMessage
    // const response = await openaiClient.sendMessage(userMessage, {
    //   model: 'gpt-4o-mini',
    // })
    // DefaultLogger.info(JSON.stringify(response))
    // expect(response.contents[0].type).toBe('text')

    const streamResponse = await openaiClient.sendMessage(userMessage, {
      model: 'gpt-4o-mini',
      stream: true,
      async onChunk(chunk: ModelResponseChunk): Promise<void> {
        DefaultLogger.info(JSON.stringify(chunk))
      }
    })
    DefaultLogger.info(JSON.stringify(streamResponse))
    expect(streamResponse.contents[0].type).toBe('text')
  }, 60000);
});
