import DefaultHistoryManager from '../../../utils/history'
import {ArgumentValue, Function, Parameter, Tool, UserMessage} from "../../../types";
import {DefaultLogger} from "../../../types/common";
import {ClaudeClient} from "./ClaudeClient";

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
    return "9摄氏度，晴，西北风"
  }
}()

describe('ClaudeClient', () => {
  test('ClaudeClient works correctly', async () => {
    console.log(process.env.CLAUDE_API_KEY)
    const claudeClient = new ClaudeClient({
      apiKey: process.env.CLAUDE_API_KEY as string,
      baseUrl: process.env.CLAUDE_BASE_URL as string,
      features: ['chat', 'tool', 'visual'],
      historyManager: DefaultHistoryManager,
      tools: [searchTool]
    })
    const userMessage = {
      role: 'user',
      content: [{
        type: 'text',
        text: 'search about weather in Beijing and house price in Shanghai'
      }]
    } as UserMessage
    const response = await claudeClient.sendMessage(userMessage, {
      toolChoice: {
        type: 'any'
      }
    })
    DefaultLogger.info(JSON.stringify(response))
    expect(response.contents[0].type).toBe('text')

    expect(response.contents[0].type).toBe('text')
  }, 60000);
});
