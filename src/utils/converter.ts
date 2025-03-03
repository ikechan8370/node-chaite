import { AssistantMessage, IMessage, Tool } from '../types'
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/src/resources/chat/completions/completions'
import { Content, GenerateContentResult } from '@google/generative-ai'
import { Tool as GeminiTool } from '@google/generative-ai'
type IntoChaiteConverter<T> = (source: T) => AssistantMessage;

class IntoChaiteConverterEntry {
  openai: IntoChaiteConverter<ChatCompletionMessageParam | ChatCompletionMessageParam[]>
  gemini: IntoChaiteConverter<GenerateContentResult>
}
const converters = new IntoChaiteConverterEntry()

export function registerIntoChaiteConverter<T>(
  _clientType: 'openai' | 'gemini',
  converter: IntoChaiteConverter<T>,
) {
  switch (_clientType) {
  case 'openai': {
    converters.openai = converter as unknown as IntoChaiteConverter<ChatCompletionMessageParam | ChatCompletionMessageParam[]>
    break
  }
  case 'gemini': {
    converters.gemini = converter as unknown as IntoChaiteConverter<GenerateContentResult>
    break
  }
  default: {
    throw new Error('unsupported adapter type')
  }
  }
  
}

export function getIntoChaiteConverter(_clientType: 'openai'): IntoChaiteConverter<ChatCompletionMessageParam | ChatCompletionMessageParam[]>;
export function getIntoChaiteConverter(_clientType: 'gemini'): IntoChaiteConverter<GenerateContentResult>;
export function getIntoChaiteConverter(_clientType: 'openai' | 'gemini'): IntoChaiteConverter<ChatCompletionMessageParam | ChatCompletionMessageParam[]> | IntoChaiteConverter<GenerateContentResult> {
  if (_clientType === 'openai') {
    return converters.openai
  } else {
    return converters.gemini
  }
}



type FromChaiteConverter<T> = (source: IMessage) => T;

class FromChaiteConverterEntry {
  openai: FromChaiteConverter<ChatCompletionMessageParam | ChatCompletionMessageParam[]>
  gemini: FromChaiteConverter<Content>
}
const fromConverters = new FromChaiteConverterEntry()

export function registerFromChaiteConverter<T>(
  _clientType: 'openai' | 'gemini',
  converter: FromChaiteConverter<T>,
) {
  switch (_clientType) {
  case 'openai': {
    fromConverters.openai = converter as unknown as FromChaiteConverter<ChatCompletionMessageParam | ChatCompletionMessageParam[]>
    break
  }
  case 'gemini': {
    fromConverters.gemini = converter as unknown as FromChaiteConverter<Content>
    break
  }
  default: {
    throw new Error('unsupported adapter type')
  }
  }
}


export function getFromChaiteConverter(_clientType: 'openai'): FromChaiteConverter<ChatCompletionMessageParam | ChatCompletionMessageParam[]>;
export function getFromChaiteConverter(_clientType: 'gemini'): FromChaiteConverter<Content>;
export function getFromChaiteConverter(_clientType: 'openai' | 'gemini'): FromChaiteConverter<ChatCompletionMessageParam | ChatCompletionMessageParam[]> | FromChaiteConverter<Content> {
  if (_clientType === 'openai') {
    return fromConverters.openai
  } else {
    return fromConverters.gemini
  }
}


type FromChaiteToolConverter<T> = (source: Tool) => T;

class FromChaiteToolConverterEntry {
  openai: FromChaiteToolConverter<ChatCompletionTool>
  gemini: FromChaiteToolConverter<GeminiTool>
}
const fromToolConverters = new FromChaiteToolConverterEntry()

export function registerFromChaiteToolConverter<T>(
  _clientType: 'openai' | 'gemini',
  converter: FromChaiteToolConverter<T>,
) {
  switch (_clientType) {
  case 'openai': {
    fromToolConverters.openai = converter as unknown as FromChaiteToolConverter<ChatCompletionTool>
    break
  }
  case 'gemini': {
    fromToolConverters.gemini = converter as unknown as FromChaiteToolConverter<GeminiTool>
    break
  }
  default: {
    throw new Error('unsupported adapter type')
  }
  }
  
}


export function getFromChaiteToolConverter(_clientType: 'openai'): FromChaiteToolConverter<ChatCompletionTool>;
export function getFromChaiteToolConverter(_clientType: 'gemini'): FromChaiteToolConverter<GeminiTool>;
export function getFromChaiteToolConverter(_clientType: 'openai' | 'gemini'): FromChaiteToolConverter<ChatCompletionTool> | FromChaiteToolConverter<GeminiTool> {
  if (_clientType === 'openai') {
    return fromToolConverters.openai
  } else {
    return fromToolConverters.gemini
  }
}

