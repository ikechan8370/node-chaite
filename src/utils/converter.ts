import { IMessage } from '../types'
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions/completions'

type IntoChaiteConverter<T> = (source: T) => IMessage;

class IntoChaiteConverterEntry {
  openai: IntoChaiteConverter<ChatCompletionMessageParam>
}
const converters = new IntoChaiteConverterEntry()

export function registerIntoChaiteConverter<T>(
  _clientType: 'openai',
  converter: IntoChaiteConverter<T>,
) {
  converters.openai = converter as unknown as IntoChaiteConverter<ChatCompletionMessageParam>
}

// 获取转换器
export function getIntoChaiteConverter(_clientType: 'openai'): IntoChaiteConverter<ChatCompletionMessageParam> {
  return converters.openai
}



type FromChaiteConverter<T> = (source: IMessage) => T;

class FromChaiteConverterEntry {
  openai: FromChaiteConverter<ChatCompletionMessageParam>
}
const fromConverters = new FromChaiteConverterEntry()

export function registerFromChaiteConverter<T>(
  _clientType: 'openai',
  converter: FromChaiteConverter<T>,
) {
  fromConverters.openai = converter as unknown as FromChaiteConverter<ChatCompletionMessageParam>
}

// 获取转换器
export function getFromChaiteConverter(_clientType: 'openai'): FromChaiteConverter<ChatCompletionMessageParam> {
  return fromConverters.openai
}

