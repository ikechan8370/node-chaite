import { AssistantMessage, ClientType, IMessage, ReasoningPart, Tool } from '../types/index.js'
import { Content, GenerateContentResult } from '@google/generative-ai'
import { Tool as GeminiTool } from '@google/generative-ai'
// import type { Anthropic.MessageParam, ToolUnion } from '@anthropic-ai/sdk/src/resources'
type IntoChaiteConverter<T> = (source: T) => IMessage;
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
class IntoChaiteConverterEntry {
  openai: IntoChaiteConverter<OpenAI.ChatCompletionMessageParam & ReasoningPart>
  gemini: IntoChaiteConverter<GenerateContentResult>
  claude: IntoChaiteConverter<Anthropic.MessageParam>
}
const converters = new IntoChaiteConverterEntry()

export function registerIntoChaiteConverter<T>(
  _clientType: ClientType,
  converter: IntoChaiteConverter<T>,
) {
  switch (_clientType) {
  case 'openai': {
    converters.openai = converter as unknown as IntoChaiteConverter<OpenAICompatibleMessageParam>
    break
  }
  case 'gemini': {
    converters.gemini = converter as unknown as IntoChaiteConverter<GenerateContentResult>
    break
  }
  case 'claude': {
    converters.claude = converter as unknown as IntoChaiteConverter<Anthropic.MessageParam>
  }
  }
  
}

export function getIntoChaiteConverter(_clientType: 'openai'): IntoChaiteConverter<OpenAICompatibleMessageParam>;
export function getIntoChaiteConverter(_clientType: 'gemini'): IntoChaiteConverter<GenerateContentResult>;

export function getIntoChaiteConverter(_clientType: 'claude'): IntoChaiteConverter<Anthropic.MessageParam>;
export function getIntoChaiteConverter(_clientType: ClientType): IntoChaiteConverter<OpenAICompatibleMessageParam> | IntoChaiteConverter<GenerateContentResult> | IntoChaiteConverter<Anthropic.MessageParam> {
  switch (_clientType) {
  case 'openai': {
    return converters.openai
  }
  case 'gemini': {
    return converters.gemini
  }
  case 'claude': {
    return converters.claude
  }
  }
}



type FromChaiteConverter<T> = (source: IMessage) => T;
export type OpenAICompatibleMessageParam = OpenAI.ChatCompletionMessageParam & ReasoningPart
class FromChaiteConverterEntry {
  openai: FromChaiteConverter<OpenAICompatibleMessageParam | OpenAICompatibleMessageParam[]>
  gemini: FromChaiteConverter<Content>
  claude: FromChaiteConverter<Anthropic.MessageParam>
}
const fromConverters = new FromChaiteConverterEntry()

export function registerFromChaiteConverter<T>(
  _clientType: ClientType,
  converter: FromChaiteConverter<T>,
) {
  switch (_clientType) {
  case 'openai': {
    fromConverters.openai = converter as unknown as FromChaiteConverter<OpenAICompatibleMessageParam | OpenAICompatibleMessageParam[]>
    break
  }
  case 'gemini': {
    fromConverters.gemini = converter as unknown as FromChaiteConverter<Content>
    break
  }
  case 'claude': {
    fromConverters.claude = converter as unknown as FromChaiteConverter<Anthropic.MessageParam>
  }
  }
}


export function getFromChaiteConverter(_clientType: 'openai'): FromChaiteConverter<OpenAICompatibleMessageParam | OpenAICompatibleMessageParam[]>;
export function getFromChaiteConverter(_clientType: 'gemini'): FromChaiteConverter<Content>;

export function getFromChaiteConverter(_clientType: 'claude'): FromChaiteConverter<Anthropic.MessageParam>;
export function getFromChaiteConverter(_clientType: ClientType): FromChaiteConverter<OpenAICompatibleMessageParam | OpenAICompatibleMessageParam[]> | FromChaiteConverter<Content> | FromChaiteConverter<Anthropic.MessageParam> {
  switch (_clientType) {
  case 'openai': {
    return fromConverters.openai
  }
  case 'gemini': {
    return fromConverters.gemini
  }
  case 'claude': {
    return fromConverters.claude
  }
  }
}


type FromChaiteToolConverter<T> = (source: Tool) => T;

class FromChaiteToolConverterEntry {
  openai: FromChaiteToolConverter<OpenAI.ChatCompletionTool>
  gemini: FromChaiteToolConverter<GeminiTool>
  claude: FromChaiteToolConverter<Anthropic.ToolUnion>
}
const fromToolConverters = new FromChaiteToolConverterEntry()

export function registerFromChaiteToolConverter<T>(
  _clientType: ClientType,
  converter: FromChaiteToolConverter<T>,
) {
  switch (_clientType) {
  case 'openai': {
    fromToolConverters.openai = converter as unknown as FromChaiteToolConverter<OpenAI.ChatCompletionTool>
    break
  }
  case 'gemini': {
    fromToolConverters.gemini = converter as unknown as FromChaiteToolConverter<GeminiTool>
    break
  }
  case 'claude': {
    fromToolConverters.claude = converter as unknown as FromChaiteToolConverter<Anthropic.ToolUnion>
  }
  }
  
}


export function getFromChaiteToolConverter(_clientType: 'openai'): FromChaiteToolConverter<OpenAI.ChatCompletionTool>;
export function getFromChaiteToolConverter(_clientType: 'gemini'): FromChaiteToolConverter<GeminiTool>;
export function getFromChaiteToolConverter(_clientType: 'claude'): FromChaiteToolConverter<Anthropic.ToolUnion>;
export function getFromChaiteToolConverter(_clientType: ClientType): FromChaiteToolConverter<OpenAI.ChatCompletionTool> | FromChaiteToolConverter<GeminiTool> | FromChaiteToolConverter<Anthropic.ToolUnion> {
  switch (_clientType) {
  case 'openai': {
    return fromToolConverters.openai
  }
  case 'gemini': {
    return fromToolConverters.gemini
  }
  case 'claude': {
    return fromToolConverters.claude
  }
  }
}

