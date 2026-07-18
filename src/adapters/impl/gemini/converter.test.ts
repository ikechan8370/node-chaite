import { Content } from '@google/genai'
import { UserMessage } from '../../../types'
import { getFromChaiteConverter } from '../../../utils/converter'
import './converter'

describe('Gemini message converter', () => {
  test('preserves GIF MIME type and data', () => {
    const converter = getFromChaiteConverter('gemini')
    const gifData = 'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
    const message = {
      role: 'user',
      content: [{
        type: 'image',
        image: gifData,
        mimeType: 'image/gif',
      }],
    } as UserMessage

    const converted = converter(message) as Content

    expect(converted.parts?.[0]?.inlineData).toEqual({
      mimeType: 'image/gif',
      data: gifData,
    })
  })
})
