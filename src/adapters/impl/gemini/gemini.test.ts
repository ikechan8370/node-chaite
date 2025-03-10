import {GeminiClient} from "./GeminiClient";
import DefaultHistoryManager from '../../../utils/history'
import {ArgumentValue, Function, Parameter, Tool, UserMessage} from "../../../types";
import {DefaultLogger} from "../../../types";

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

describe('GeminiClient', () => {
  test('GeminiClient works correctly', async () => {
    console.log(process.env.GEMINI_API_KEY)
    const geminiClient = new GeminiClient({
      apiKey: process.env.GEMINI_API_KEY as string,
      baseUrl: process.env.GEMINI_BASE_URL as string,
      features: ['chat', 'tool', 'visual'],
      historyManager: DefaultHistoryManager,
      tools: [searchTool]
    })
    const userMessage = {
      role: 'user',
      content: [{
        type: 'text',
        text: 'search about weather in Beijing and Shanghai'
      }]
    } as UserMessage
    const response = await geminiClient.sendMessage(userMessage, {
      model: 'gemini-2.0-flash-001',
    })
    DefaultLogger.info(JSON.stringify(response))
    expect(response.contents[0].type).toBe('text')

    expect(response.contents[0].type).toBe('text')
  }, 60000);
});
