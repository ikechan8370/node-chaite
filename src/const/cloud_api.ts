import { CloudAPIType } from '../types/index'

const API_V1_PREFIX = '/api/v1'
export const CloudAPI: Record<'USER', string> & Record<'LIST' | 'ADD' | 'GET' | 'TEMP_SHARE' | 'DELETE', Record<CloudAPIType, string>> = {
  USER: API_V1_PREFIX + '/user',
  LIST: {
    tool: API_V1_PREFIX + '/tools',
    processor: API_V1_PREFIX + '/processors',
    channel: API_V1_PREFIX + '/channels',
    'chat-preset': API_V1_PREFIX + '/presets',
    'tool-setting': API_V1_PREFIX + '/settings',
  },
  ADD: {
    tool: API_V1_PREFIX + '/tool',
    processor: API_V1_PREFIX + '/processor',
    channel: API_V1_PREFIX + '/channel',
    'chat-preset': API_V1_PREFIX + '/preset',
    'tool-setting': API_V1_PREFIX + '/setting',
  },
  GET: {
    tool: API_V1_PREFIX + '/tool',
    processor: API_V1_PREFIX + '/processor',
    channel: API_V1_PREFIX + '/channel',
    'chat-preset': API_V1_PREFIX + '/preset',
    'tool-setting': API_V1_PREFIX + '/setting',
  },
  TEMP_SHARE: {
    tool: API_V1_PREFIX + '/tool',
    processor: API_V1_PREFIX + '/processor',
    channel: API_V1_PREFIX + '/channel',
    'chat-preset': API_V1_PREFIX + '/preset',
    'tool-setting': API_V1_PREFIX + '/setting',
  },
  DELETE: {
    tool: API_V1_PREFIX + '/tool',
    processor: API_V1_PREFIX + '/processor',
    channel: API_V1_PREFIX + '/channel',
    'chat-preset': API_V1_PREFIX + '/preset',
    'tool-setting': API_V1_PREFIX + '/setting',
  },
}