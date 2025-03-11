import {UserMessage} from "./models.js";
import {PreProcessor} from "./processors.js";

describe('ProcessorSerialize', () => {
  test('ProcessorSerialize works correctly', () => {
    class TestPreProcessor extends PreProcessor {
      type: 'pre' = 'pre'
      name = 'test'
      code = () => {
        return TestPreProcessor.toString()
      }

      async process(message: UserMessage): Promise<UserMessage> {
        console.log(message.role)
        return message;
      }
    }
    let processor = new TestPreProcessor()
    console.log(processor.code())
  })
})