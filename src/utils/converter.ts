import { IMessage, Tool } from '../types'
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/src/resources/chat/completions/completions'

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


type FromChaiteToolConverter<T> = (source: Tool) => T;

class FromChaiteToolConverterEntry {
  openai: FromChaiteToolConverter<ChatCompletionTool>
}
const fromToolConverters = new FromChaiteToolConverterEntry()

export function registerFromChaiteToolConverter<T>(
  _clientType: 'openai',
  converter: FromChaiteToolConverter<T>,
) {
  fromToolConverters.openai = converter as unknown as FromChaiteToolConverter<ChatCompletionTool>
}

// 获取转换器
export function getFromChaiteToolConverter(_clientType: 'openai'): FromChaiteToolConverter<ChatCompletionTool> {
  return fromToolConverters.openai
}

