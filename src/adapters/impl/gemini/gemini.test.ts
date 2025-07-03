import {GeminiClient} from "./GeminiClient"
import DefaultHistoryManager from '../../../utils/history'
import { Parameter, Tool, Function } from "../../../types/tools"
import { ArgumentValue, UserMessage } from "../../../types/models"
import { DefaultLogger } from "../../../types/common"

class SearchTool implements Tool {
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
    this.name = 'search'
  }

  type: "function";
  function: Function

  async run(args: Record<string, ArgumentValue | Record<string, ArgumentValue>>): Promise<string> {
    DefaultLogger.info(`search query: ${args.query}`)
    return "search failed"
  }

  name: Function["name"];
}

const searchTool = new SearchTool()

class SearchImageTool implements Tool {
  constructor() {
    this.function = {
      name: 'search',
      description: 'search images from search engine',
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
    this.name = 'search'
  }

  type: "function";
  function: Function

  async run(args: Record<string, ArgumentValue | Record<string, ArgumentValue>>): Promise<string> {
    DefaultLogger.info(`search query: ${args.query}`)
    return "search failed"
  }

  name: Function["name"];
}

const searchImageTool = new SearchImageTool()

describe('GeminiClient', () => {
  test('GeminiClient works correctly', async () => {
    console.log(process.env.GEMINI_API_KEY)
    const geminiClient = new GeminiClient({
      apiKey: process.env.GEMINI_API_KEY as string,
      baseUrl: process.env.GEMINI_BASE_URL as string,
      features: ['chat', 'tool', 'visual'],
      historyManager: DefaultHistoryManager,
      tools: [searchTool, searchImageTool]
    })
    const userMessage = {
      role: 'user',
      content: [{
        type: 'text',
        text: 'search about weather in Beijing and Shanghai, and then search a image of a blue cat'
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
