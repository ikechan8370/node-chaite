<script lang="ts" setup>
import { computed, h, onMounted, reactive, ref } from 'vue'
import type { Component } from 'vue'
import type { MenuOption } from 'naive-ui'
import {
  NAlert,
  NButton,
  NCard,
  NDynamicTags,
  NForm,
  NFormItemGridItem,
  NGrid,
  NIcon,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  NTabPane,
  NTabs,
  useMessage,
} from 'naive-ui'
import IconLinkStar from '~icons/icon-park-outline/star-one'
import IconLinkSystem from '~icons/icon-park-outline/system'
import IconLinkPermission from '~icons/icon-park-outline/permissions'
import IconLinkLock from '~icons/icon-park-outline/electronic-locks-open'
import IconLinkMemory from '~icons/icon-park-outline/brain'
import type { CustomConfig } from '@/service/api/config'
import { fetchConfig, saveConfig } from '@/service/api/config'
import { fetchPresetList } from '@/service/api/presets'
import type { DownloadSimpleExtensionParams, MemoryConfig, SimpleExtensionStatus } from '@/service/api/memory'
import {
  downloadSimpleExtension,
  fetchMemoryConfig,
  fetchSimpleExtensionStatus,
  updateMemoryConfig,
} from '@/service/api/memory'
// Create the message instance
const message = useMessage()
const activeTab = ref('basic')
const tabsRef = ref(null)

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions: MenuOption[] = [
  {
    label: '基础设置',
    key: 'basic',
    icon: renderIcon(IconLinkSystem),
  },
  {
    label: '模型与对话',
    key: 'llm',
    icon: renderIcon(IconLinkPermission),
  },
  {
    label: '权限管理',
    key: 'management',
    icon: renderIcon(IconLinkLock),
  },
  {
    label: '记忆配置',
    key: 'memory',
    icon: renderIcon(IconLinkMemory),
  },
  {
    label: 'Chaite配置',
    key: 'chaite',
    icon: renderIcon(IconLinkStar),
  },
]

function handleMenuUpdate(key: string) {
  activeTab.value = key
}

// Define the config structure based on your ChatGPTConfig class
const config = reactive({
  version: '3.0.0',
  basic: {
    toggleMode: 'at',
    togglePrefix: '#chat',
    debug: false,
    commandPrefix: '^#chatgpt',
  },
  /**
   * 伪人模式，基于框架实现，因此机器人开启前缀后依然需要带上前缀。
   * @type {{
   *   enable: boolean,
   *   hit: string[],
   *   probability: number,
   *   defaultPreset: string,
   *   presetPrefix?: string,
   *   presetMap: Array<{
   *     keywords: string[],
   *     presetId: string,
   *     priority: number,
   *     recall?: boolean
   *   }>,
   *   maxTokens: number,
   *   temperature: number,
   *   sendReasoning: boolean
   * }}
   * }}
   */
  bym: {
    enable: false,
    hit: ['bym'],
    probability: 0.02,
    defaultPreset: '',
    presetPrefix: '',
    presetMap: [],
    maxTokens: 0,
    temperature: -1,
    sendReasoning: false,
  } as {
    enable: boolean
    hit: string[]
    probability: number
    defaultPreset: string
    presetPrefix?: string
    presetMap: Array<{
      keywords: string[]
      presetId: string
      priority: number
      recall?: boolean
    }>
    maxTokens: number
    temperature: number
    sendReasoning: boolean
  },
  llm: {
    defaultModel: '',
    embeddingModel: 'gemini-embedding-exp-03-07',
    dimensions: 0,
    defaultChatPresetId: '',
    enableCustomPreset: false,
    customPresetUserWhiteList: [],
    customPresetUserBlackList: [],
    promptBlockWords: [],
    responseBlockWords: [],
    blockStrategy: 'full',
    blockWordMask: '**',
    enableGroupContext: false,
    groupContextLength: 20,
    groupContextTemplatePrefix: 'Latest several messages in the group chat:\n'
      + '| sender.card | sender.nickname | sender.user_id | sender.role | sender.title | time | messageId | raw_message |\n'
      + '|---|---|---|---|---|---|---|---|',
    groupContextTemplateMessage: '| $' + '{message.sender.card} | $' + '{message.sender.nickname} | $' + '{message.sender.user_id} | $' + '{message.sender.role} | $' + '{message.sender.title} | $' + '{message.time} | $' + '{message.messageId} | $' + '{message.raw_message} |',
    groupContextTemplateSuffix: '\n',
  },
  management: {
    blackGroups: [],
    whiteGroups: [],
    blackUsers: [],
    whiteUsers: [],
    defaultRateLimit: 0,
  },
  chaite: {
    dataDir: 'data',
    processorsDirPath: 'utils/processors',
    toolsDirPath: 'utils/tools',
    cloudBaseUrl: '',
    cloudApiKey: '',
    authKey: '',
    host: '',
    port: 48370,
  },
})

// Memory configuration (separate API)
const memoryConfig = reactive({
  database: 'data/memory.db',
  vectorDimensions: 1536,
  group: {
    enable: false,
    enabledGroups: [],
    extractionModel: '',
    extractionPresetId: '',
    minMessageCount: 80,
    maxMessageWindow: 300,
    retrievalMode: 'hybrid' as 'vector' | 'keyword' | 'hybrid',
    hybridPrefer: 'vector-first' as 'vector-first' | 'keyword-first',
    historyPollInterval: 300,
    historyBatchSize: 120,
    promptHeader: '# 群聊长期记忆',
    promptItemTemplate: '- ${fact}${topicSuffix}',
    promptFooter: '',
    extractionSystemPrompt: '',
    extractionUserPrompt: '',
    vectorMaxDistance: 0,
    textMaxBm25Score: 0,
    maxFactsPerInjection: 5,
    minImportanceForInjection: 0.3,
  },
  user: {
    enable: false,
    whitelist: [],
    blacklist: [],
    extractionModel: '',
    extractionPresetId: '',
    maxItemsPerInjection: 5,
    maxRelevantItemsPerQuery: 3,
    minImportanceForInjection: 0,
    promptHeader: '# 用户画像',
    promptItemTemplate: '- ${value}',
    promptFooter: '',
    extractionSystemPrompt: '',
    extractionUserPrompt: '',
  },
  extensions: {
    simple: {
      enable: false,
      libraryPath: '',
      dictPath: '',
      useJieba: false,
    },
  },
}) as MemoryConfig

const simpleAssetOptions = [
  { label: '自动识别 (推荐)', value: 'auto' },
  { label: 'Linux x64', value: 'linux-x64' },
  { label: 'Linux ARM64', value: 'linux-arm64' },
  { label: 'Windows x64', value: 'win32-x64' },
  { label: 'Windows x86 (32位)', value: 'win32-ia32' },
  { label: 'Windows ARM64', value: 'win32-arm64' },
  { label: 'macOS x64', value: 'darwin-x64' },
] as const

const simpleStatus = ref<SimpleExtensionStatus | null>(null)
const simpleStatusLoading = ref(false)
const simpleDownloadLoading = ref(false)
const simpleSelectedAsset = ref<typeof simpleAssetOptions[number]['value']>('auto')
const simpleCustomAssetName = ref('')

function applyMemoryConfigPayload(payload?: Partial<MemoryConfig>) {
  if (!payload) {
    return
  }
  if (typeof payload.database === 'string') {
    memoryConfig.database = payload.database
  }
  if (typeof payload.vectorDimensions === 'number') {
    memoryConfig.vectorDimensions = payload.vectorDimensions
  }
  if (payload.group) {
    Object.assign(memoryConfig.group, payload.group)
  }
  if (payload.user) {
    Object.assign(memoryConfig.user, payload.user)
  }
  if (payload.extensions?.simple) {
    Object.assign(memoryConfig.extensions.simple, payload.extensions.simple)
  }
}

async function getConfig(): Promise<CustomConfig> {
  const data = await fetchConfig()
  if (data.isSuccess) {
    message.success('配置加载成功')
  }
  else {
    message.error('配置加载失败')
  }
  Object.assign(config, data.data)
  if (!Array.isArray(config.bym.presetMap)) {
    config.bym.presetMap = []
  }
  return data.data
}

async function updateConfig() {
  const updateRes = await saveConfig(config)
  if (updateRes.isSuccess) {
    message.success('配置保存成功')
  }
  else {
    message.error('配置保存失败')
  }
}

// Memory config functions
// eslint-disable-next-line unused-imports/no-unused-vars
async function getMemoryConfig() {
  try {
    const data = await fetchMemoryConfig()
    if (data.isSuccess) {
      applyMemoryConfigPayload(data.data)
    }
    else {
      message.error('记忆配置加载失败')
    }
  }
  catch (error) {
    console.error('Failed to load memory config:', error)
  }
}

// eslint-disable-next-line unused-imports/no-unused-vars
async function updateMemoryConfigData() {
  try {
    const res = await updateMemoryConfig(memoryConfig)
    if (res.isSuccess) {
      message.success('记忆配置保存成功')
      applyMemoryConfigPayload(res.data)
      await refreshSimpleExtensionStatus()
    }
    else {
      message.error(res.message || '记忆配置保存失败')
    }
  }
  catch (error) {
    console.error('Failed to update memory config:', error)
    message.error('记忆配置保存失败')
  }
}

async function refreshSimpleExtensionStatus() {
  simpleStatusLoading.value = true
  try {
    const res = await fetchSimpleExtensionStatus()
    if (res.isSuccess) {
      simpleStatus.value = res.data
    }
    else {
      message.error(res.message || '扩展状态获取失败')
    }
  }
  catch (error) {
    console.error('Failed to fetch simple extension status:', error)
    message.error('扩展状态获取失败')
  }
  finally {
    simpleStatusLoading.value = false
  }
}

async function handleDownloadSimpleExtension() {
  const payload: DownloadSimpleExtensionParams = {}
  if (simpleSelectedAsset.value !== 'auto') {
    payload.assetKey = simpleSelectedAsset.value
  }
  if (simpleCustomAssetName.value.trim().length > 0) {
    payload.assetName = simpleCustomAssetName.value.trim()
  }
  simpleDownloadLoading.value = true
  try {
    const res = await downloadSimpleExtension(payload)
    if (res.isSuccess) {
      message.success('扩展下载完成，记得保存配置并启用分词。')
      if (res.data.assetKey && simpleAssetOptions.some(option => option.value === res.data.assetKey)) {
        simpleSelectedAsset.value = res.data.assetKey as typeof simpleAssetOptions[number]['value']
      } else {
        simpleSelectedAsset.value = 'auto'
      }
      simpleCustomAssetName.value = ''
      memoryConfig.extensions.simple.libraryPath = res.data.libraryPath
      memoryConfig.extensions.simple.dictPath = res.data.dictPath
      await refreshSimpleExtensionStatus()
    }
    else {
      message.error(res.message || '扩展下载失败')
    }
  }
  catch (error) {
    console.error('Failed to download simple extension:', error)
    message.error('扩展下载失败')
  }
  finally {
    simpleDownloadLoading.value = false
  }
}

const presets = ref([] as Array<Shareable.PresetModel>)
function fetchPresets() {
  fetchPresetList({}).then((res) => {
    presets.value = res.data
  }).catch((err) => {
    console.error(err)
  })
}

const presetOptions = computed(() => {
  return presets.value.map(preset => ({
    label: preset.name,
    value: preset.id,
  }))
})

function filterOption(query: string, option: any) {
  return option.label.toLowerCase().includes(query.toLowerCase())
}

// Load configuration on component mount
onMounted(async () => {
  try {
    await Promise.all([getConfig(), getMemoryConfig()])
    fetchPresets()
    await refreshSimpleExtensionStatus()
  }
  catch (error) {
    console.error('加载配置失败:', error)
    message.error('配置加载失败')
  }
})
</script>

<template>
  <div class="config-container">
    <NCard title="系统配置" class="main-card">
      <div class="layout-container">
        <!-- Left sidebar for navigation on wider screens -->
        <div class="sidebar">
          <NMenu
            v-model:value="activeTab"
            :options="menuOptions"
            @update:value="handleMenuUpdate"
          />
          <div class="version-info">
            <span>版本: {{ config.version }}</span>
          </div>
        </div>
        <!-- Main content area -->
        <div class="content-area">
          <NTabs
            ref="tabsRef"
            v-model:value="activeTab"
            type="line"
            animated
            class="responsive-tabs"
          >
            <!-- 基础设置选项卡 -->
            <NTabPane name="basic" tab="基础设置">
              <NCard class="inner-card">
                <template #header>
                  <div class="card-header">
                    <div class="card-header">
                      <div class="card-title">
                        触发与命令
                      </div>
                      <div class="card-subtitle">
                        设置机器人的触发方式和基本命令
                      </div>
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.basic">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16">
                    <NFormItemGridItem span="24 s:24 m:12" label="触发方式" path="toggleMode">
                      <NSelect
                        v-model:value="config.basic.toggleMode"
                        :options="[
                          { label: '@ 触发', value: 'at' },
                          { label: '前缀触发', value: 'prefix' },
                        ]"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="触发前缀" path="togglePrefix">
                      <NInput
                        v-model:value="config.basic.togglePrefix"
                        placeholder="仅前缀触发时有效"
                        :disabled="config.basic.toggleMode !== 'prefix'"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="命令前缀" path="commandPrefix">
                      <NInput
                        v-model:value="config.basic.commandPrefix"
                        placeholder="例如: ^#chatgpt"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="调试模式" path="debug">
                      <NSwitch v-model:value="config.basic.debug" />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>
            </NTabPane>

            <!-- 模型与对话选项卡 -->
            <NTabPane name="llm" tab="模型与对话">
              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      模型配置
                    </div>
                    <div class="card-subtitle">
                      设置默认使用的模型和嵌入模型
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.llm">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16">
                    <!--                    <NFormItemGridItem span="24 s:24 m:12" label="默认模型" path="defaultModel"> -->
                    <!--                      <NInput v-model:value="config.llm.defaultModel" placeholder="输入默认模型名称" /> -->
                    <!--                    </NFormItemGridItem> -->

                    <NFormItemGridItem span="24 s:24 m:12" label="嵌入模型" path="embeddingModel">
                      <NInput v-model:value="config.llm.embeddingModel" placeholder="输入嵌入模型名称" />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="嵌入维度" path="dimensions">
                      <NInputNumber
                        v-model:value="config.llm.dimensions"
                        clearable
                        placeholder="0表示自动"
                        :min="0"
                        style="width: 100%"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="默认对话预设" path="defaultChatPresetId">
                      <NSelect
                        v-model:value="config.llm.defaultChatPresetId"
                        :options="presetOptions"
                        filterable
                        placeholder="选择默认对话预设"
                        clearable
                      />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>

              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      预设控制
                    </div>
                    <div class="card-subtitle">
                      设置用户预设切换权限
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.llm">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16">
                    <NFormItemGridItem span="24 s:24 m:12" label="允许切换预设" path="enableCustomPreset">
                      <NSwitch v-model:value="config.llm.enableCustomPreset" />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="预设白名单用户" path="customPresetUserWhiteList">
                      <NDynamicTags
                        v-model:value="config.llm.customPresetUserWhiteList"
                        placeholder="输入用户ID并按回车添加"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="预设黑名单用户" path="customPresetUserBlackList">
                      <NDynamicTags
                        v-model:value="config.llm.customPresetUserBlackList"
                        placeholder="输入用户ID并按回车添加"
                      />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>

              <NCard class="inner-card">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      伪人模式
                    </div>
                    <div class="card-subtitle">
                      设置和管理伪人模式配置
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.bym">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16">
                    <!-- 开关 -->
                    <NFormItemGridItem span="24 s:24 m:12" label="启用伪人模式" path="enable">
                      <NSwitch v-model:value="config.bym.enable" />
                    </NFormItemGridItem>

                    <!-- 伪人必定触发词 -->
                    <NFormItemGridItem span="24" label="伪人触发词" path="hit" :span-feedback="24">
                      <NDynamicTags v-model:value="config.bym.hit" placeholder="输入触发词并按回车添加" />
                      <template #feedback>
                        <span class="form-hint">包含这些词时将必定触发伪人模式</span>
                      </template>
                    </NFormItemGridItem>

                    <!-- 不包含伪人必定触发词时的概率 -->
                    <NFormItemGridItem span="24 s:24 m:12" label="随机触发概率" path="probability" :span-feedback="24">
                      <NInputNumber
                        v-model:value="config.bym.probability"
                        :min="0"
                        :max="1"
                        :step="0.01"
                        style="width: 100%"
                      >
                        <template #suffix>
                          {{ (config.bym.probability * 100).toFixed(0) }}%
                        </template>
                      </NInputNumber>
                      <template #feedback>
                        <span class="form-hint">不包含触发词时随机触发的概率</span>
                      </template>
                    </NFormItemGridItem>

                    <!-- 伪人模式的默认预设 -->
                    <NFormItemGridItem span="24 s:24 m:12" label="默认预设" path="defaultPreset" :span-feedback="24">
                      <NSelect
                        v-model:value="config.bym.defaultPreset"
                        :options="presetOptions"
                        filterable
                        :filter-option="filterOption"
                        placeholder="选择默认预设"
                        clearable
                      />
                      <template #feedback>
                        <span class="form-hint">伪人模式的默认预设</span>
                      </template>
                    </NFormItemGridItem>

                    <!-- 预设前缀 -->
                    <NFormItemGridItem span="24" label="预设前缀" path="presetPrefix" :span-feedback="24">
                      <NInput
                        v-model:value="config.bym.presetPrefix"
                        type="textarea"
                        placeholder="输入预设前缀"
                        :autosize="{ minRows: 3, maxRows: 6 }"
                      />
                      <template #feedback>
                        <span class="form-hint">会加在所有伪人模式预设前的通用前缀，可用于配置通用的伪人发言风格</span>
                      </template>
                    </NFormItemGridItem>

                    <!-- maxTokens -->
                    <NFormItemGridItem span="24 s:24 m:12" label="最大Token数" path="maxTokens" :span-feedback="24">
                      <NInputNumber
                        v-model:value="config.bym.maxTokens"
                        :min="0"
                        placeholder="0表示不限制"
                        style="width: 100%"
                      />
                      <template #feedback>
                        <span class="form-hint">大于0时会覆盖预设中的maxToken值</span>
                      </template>
                    </NFormItemGridItem>

                    <!-- temperature -->
                    <NFormItemGridItem span="24 s:24 m:12" label="温度" path="temperature" :span-feedback="24">
                      <NInputNumber
                        v-model:value="config.bym.temperature"
                        :min="-1"
                        :max="2"
                        :step="0.1"
                        placeholder="-1表示使用预设值"
                        style="width: 100%"
                      />
                      <template #feedback>
                        <span class="form-hint">大于等于0时会覆盖预设中的temperature值，-1表示使用预设值</span>
                      </template>
                    </NFormItemGridItem>

                    <!-- 是否发送思考内容 -->
                    <NFormItemGridItem span="24 s:24 m:12" label="发送思考过程" path="sendReasoning">
                      <NSwitch v-model:value="config.bym.sendReasoning" />
                    </NFormItemGridItem>

                    <!-- 预设映射 -->
                    <NFormItemGridItem span="24" label="预设映射" path="presetMap" :span-feedback="24">
                      <div class="preset-map-container">
                        <div v-for="(item, index) in config.bym.presetMap" :key="index" class="preset-map-item">
                          <div class="preset-map-keyword-container">
                            <NDynamicTags
                              v-model:value="item.keywords"
                              placeholder="添加关键词"
                              class="preset-map-keywords"
                            />
                          </div>
                          <NIcon class="preset-map-arrow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M16.01 11H4v2h12.01v3L20 12l-3.99-4z" />
                            </svg>
                          </NIcon>
                          <NSelect
                            v-model:value="item.presetId"
                            class="preset-map-preset"
                            :options="presetOptions"
                            filterable
                            :filter-option="filterOption"
                            placeholder="选择预设"
                            clearable
                          />
                          <NInputNumber
                            v-model:value="item.priority"
                            class="preset-map-priority"
                            :min="0"
                            placeholder="优先级"
                          />
                          <NSwitch
                            v-model:value="item.recall"
                            class="preset-map-recall"
                            :default-value="false"
                          >
                            <template #checked>
                              撤回
                            </template>
                            <template #unchecked>
                              保留
                            </template>
                          </NSwitch>
                          <NButton
                            type="error"
                            quaternary
                            circle
                            class="preset-map-delete"
                            @click="config.bym.presetMap.splice(index, 1)"
                          >
                            <NIcon>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z" />
                              </svg>
                            </NIcon>
                          </NButton>
                        </div>
                        <NButton
                          type="primary"
                          dashed
                          class="preset-map-add"
                          @click="config.bym.presetMap.push({ keywords: [], presetId: '', priority: 0, recall: false })"
                        >
                          添加关键词预设映射
                        </NButton>
                      </div>
                      <template #feedback>
                        <span class="form-hint">按优先级排序，消息包含特定关键词时使用对应的预设</span>
                      </template>
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>
              <NCard class="inner-card">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      内容过滤
                    </div>
                    <div class="card-subtitle">
                      设置敏感词过滤规则
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.llm">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16">
                    <NFormItemGridItem span="24" label="用户输入屏蔽词" path="promptBlockWords">
                      <NDynamicTags
                        v-model:value="config.llm.promptBlockWords"
                        placeholder="输入屏蔽词并按回车添加"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="回复屏蔽词" path="responseBlockWords">
                      <NDynamicTags
                        v-model:value="config.llm.responseBlockWords"
                        placeholder="输入屏蔽词并按回车添加"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="屏蔽策略" path="blockStrategy">
                      <NSelect
                        v-model:value="config.llm.blockStrategy"
                        :options="[
                          { label: '完全屏蔽消息', value: 'full' },
                          { label: '仅屏蔽关键词', value: 'mask' },
                        ]"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem
                      span="24 s:24 m:12"
                      label="屏蔽替换字符"
                      path="blockWordMask"
                      :disabled="config.llm.blockStrategy !== 'mask'"
                    >
                      <NInput
                        v-model:value="config.llm.blockWordMask"
                        placeholder="例如: ***"
                        :disabled="config.llm.blockStrategy !== 'mask'"
                      />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>

              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      群聊上下文
                    </div>
                    <div class="card-subtitle">
                      配置群组上下文相关参数
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.llm">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16">
                    <NFormItemGridItem span="24 s:24 m:12" label="启用群组上下文" path="enableGroupContext">
                      <NSwitch v-model:value="config.llm.enableGroupContext" />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="上下文长度" path="groupContextLength" :span-feedback="24">
                      <NInputNumber
                        v-model:value="config.llm.groupContextLength"
                        :min="0"
                        :max="100"
                        style="width: 100%"
                        placeholder="群组上下文保留的消息数"
                      />
                      <template #feedback>
                        <span class="form-hint">保留的群聊消息数量</span>
                      </template>
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="上下文模板前缀" path="groupContextTemplatePrefix" :span-feedback="24">
                      <NInput
                        v-model:value="config.llm.groupContextTemplatePrefix"
                        type="textarea"
                        placeholder="输入上下文模板前缀"
                        :autosize="{ minRows: 3, maxRows: 6 }"
                      />
                      <template #feedback>
                        <span class="form-hint">用于组装群聊上下文提示词的模板前缀</span>
                      </template>
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="上下文消息模板" path="groupContextTemplateMessage" :span-feedback="24">
                      <NInput
                        v-model:value="config.llm.groupContextTemplateMessage"
                        type="textarea"
                        placeholder="输入上下文消息模板"
                        :autosize="{ minRows: 3, maxRows: 6 }"
                      />
                      <template #feedback>
                        <span class="form-hint">用于组装群聊上下文提示词的模板内容部分，使用${message.xxx}引用消息属性</span>
                      </template>
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="上下文模板后缀" path="groupContextTemplateSuffix" :span-feedback="24">
                      <NInput
                        v-model:value="config.llm.groupContextTemplateSuffix"
                        type="textarea"
                        placeholder="输入上下文模板后缀"
                        :autosize="{ minRows: 2, maxRows: 4 }"
                      />
                      <template #feedback>
                        <span class="form-hint">用于组装群聊上下文提示词的模板后缀</span>
                      </template>
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>
            </NTabPane>

            <!-- 权限管理选项卡 -->
            <NTabPane name="management" tab="权限管理">
              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      访问控制
                    </div>
                    <div class="card-subtitle">
                      设置黑白名单控制机器人访问权限
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.management">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16">
                    <NFormItemGridItem span="24 s:24 m:12" label="黑名单群组" path="blackGroups">
                      <NDynamicTags
                        v-model:value="config.management.blackGroups"
                        placeholder="输入群号并按回车添加"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="白名单群组" path="whiteGroups">
                      <NDynamicTags
                        v-model:value="config.management.whiteGroups"
                        placeholder="输入群号并按回车添加"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="黑名单用户" path="blackUsers">
                      <NDynamicTags
                        v-model:value="config.management.blackUsers"
                        placeholder="输入用户ID并按回车添加"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="白名单用户" path="whiteUsers">
                      <NDynamicTags
                        v-model:value="config.management.whiteUsers"
                        placeholder="输入用户ID并按回车添加"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="对话速率限制" path="defaultRateLimit">
                      <NInputNumber
                        v-model:value="config.management.defaultRateLimit"
                        placeholder="0表示不限制"
                        :min="0"
                        style="width: 100%"
                      >
                        <template #suffix>
                          次/分钟
                        </template>
                      </NInputNumber>
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>
            </NTabPane>

            <!-- 记忆配置选项卡 -->
            <NTabPane name="memory" tab="记忆配置">
              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      基础配置
                    </div>
                    <div class="card-subtitle">
                      配置记忆系统的基础参数
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="memoryConfig">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16">
                    <NFormItemGridItem span="24 s:24 m:12" label="数据库路径" path="database">
                      <NInput v-model:value="memoryConfig.database" placeholder="data/memory.db" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="向量维度" path="vectorDimensions">
                      <NInputNumber v-model:value="memoryConfig.vectorDimensions" :min="0" style="width: 100%" />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>

              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      群组记忆配置
                    </div>
                    <div class="card-subtitle">
                      配置群组事实记忆的提取和检索参数
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="memoryConfig.group">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16">
                    <NFormItemGridItem span="24 s:24 m:12" label="启用群组记忆" path="enable">
                      <NSwitch v-model:value="memoryConfig.group.enable" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="启用的群组" path="enabledGroups">
                      <NDynamicTags v-model:value="memoryConfig.group.enabledGroups" placeholder="输入群组ID并按回车添加" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="提取模型" path="extractionModel">
                      <NInput v-model:value="memoryConfig.group.extractionModel" placeholder="模型名称" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="提取预设ID" path="extractionPresetId">
                      <NSelect
                        v-model:value="memoryConfig.group.extractionPresetId"
                        :options="presetOptions"
                        filterable
                        placeholder="选择预设"
                        clearable
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="最少消息数" path="minMessageCount">
                      <NInputNumber v-model:value="memoryConfig.group.minMessageCount" :min="0" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="最大消息窗口" path="maxMessageWindow">
                      <NInputNumber v-model:value="memoryConfig.group.maxMessageWindow" :min="0" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="历史轮询间隔(秒)" path="historyPollInterval">
                      <NInputNumber
                        v-model:value="memoryConfig.group.historyPollInterval"
                        :min="0"
                        style="width: 100%"
                      >
                        <template #suffix>
                          秒
                        </template>
                      </NInputNumber>
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="历史采样条数" path="historyBatchSize">
                      <NInputNumber v-model:value="memoryConfig.group.historyBatchSize" :min="0" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="检索模式" path="retrievalMode">
                      <NSelect
                        v-model:value="memoryConfig.group.retrievalMode"
                        :options="[
                          { label: '向量检索', value: 'vector' },
                          { label: '关键词检索', value: 'keyword' },
                          { label: '混合检索', value: 'hybrid' },
                        ]"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="混合检索优先" path="hybridPrefer">
                      <NSelect
                        v-model:value="memoryConfig.group.hybridPrefer"
                        :options="[
                          { label: '向量优先', value: 'vector-first' },
                          { label: '关键词优先', value: 'keyword-first' },
                        ]"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="每次注入最多Facts数" path="maxFactsPerInjection">
                      <NInputNumber v-model:value="memoryConfig.group.maxFactsPerInjection" :min="0" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="注入最低重要度" path="minImportanceForInjection">
                      <NInputNumber v-model:value="memoryConfig.group.minImportanceForInjection" :min="0" :max="1" :step="0.1" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="向量距离阈值" path="vectorMaxDistance">
                      <NInputNumber
                        v-model:value="memoryConfig.group.vectorMaxDistance"
                        :min="0"
                        :step="0.01"
                        style="width: 100%"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="文本BM25阈值" path="textMaxBm25Score">
                      <NInputNumber
                        v-model:value="memoryConfig.group.textMaxBm25Score"
                        :min="0"
                        :step="0.1"
                        style="width: 100%"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="Prompt标题模板" path="promptHeader">
                      <NInput
                        v-model:value="memoryConfig.group.promptHeader"
                        type="textarea"
                        :autosize="{ minRows: 1, maxRows: 3 }"
                        placeholder="例如：# 群聊长期记忆"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="Prompt条目模板" path="promptItemTemplate">
                      <NInput
                        v-model:value="memoryConfig.group.promptItemTemplate"
                        type="textarea"
                        :autosize="{ minRows: 2, maxRows: 6 }"
                        placeholder="可使用占位符：${fact}、${topicSuffix}、${order}、${distance} 等"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="Prompt结束模板" path="promptFooter">
                      <NInput
                        v-model:value="memoryConfig.group.promptFooter"
                        type="textarea"
                        :autosize="{ minRows: 1, maxRows: 3 }"
                        placeholder="可选"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="抽取系统提示" path="extractionSystemPrompt">
                      <NInput
                        v-model:value="memoryConfig.group.extractionSystemPrompt"
                        type="textarea"
                        :autosize="{ minRows: 3, maxRows: 8 }"
                        placeholder="可选，覆盖内置的群记忆抽取系统提示"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="抽取用户提示模板" path="extractionUserPrompt">
                      <NInput
                        v-model:value="memoryConfig.group.extractionUserPrompt"
                        type="textarea"
                        :autosize="{ minRows: 3, maxRows: 8 }"
                        placeholder="可选，可使用 ${messages} 作为占位符"
                      />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>

              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      用户记忆配置
                    </div>
                    <div class="card-subtitle">
                      配置用户个性化记忆的提取参数
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="memoryConfig.user">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16">
                    <NFormItemGridItem span="24 s:24 m:12" label="启用用户记忆" path="enable">
                      <NSwitch v-model:value="memoryConfig.user.enable" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="白名单用户" path="whitelist">
                      <NDynamicTags v-model:value="memoryConfig.user.whitelist" placeholder="输入用户ID并按回车添加" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="黑名单用户" path="blacklist">
                      <NDynamicTags v-model:value="memoryConfig.user.blacklist" placeholder="输入用户ID并按回车添加" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="提取模型" path="extractionModel">
                      <NInput v-model:value="memoryConfig.user.extractionModel" placeholder="模型名称" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="提取预设ID" path="extractionPresetId">
                      <NSelect
                        v-model:value="memoryConfig.user.extractionPresetId"
                        :options="presetOptions"
                        filterable
                        placeholder="选择预设"
                        clearable
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="每次注入最多条目数" path="maxItemsPerInjection">
                      <NInputNumber v-model:value="memoryConfig.user.maxItemsPerInjection" :min="0" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="检索返回数量" path="maxRelevantItemsPerQuery">
                      <NInputNumber v-model:value="memoryConfig.user.maxRelevantItemsPerQuery" :min="0" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="最低重要度" path="minImportanceForInjection">
                      <NInputNumber v-model:value="memoryConfig.user.minImportanceForInjection" :min="0" :max="1" :step="0.1" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="Prompt标题模板" path="promptHeader">
                      <NInput
                        v-model:value="memoryConfig.user.promptHeader"
                        type="textarea"
                        :autosize="{ minRows: 1, maxRows: 3 }"
                        placeholder="例如：# 用户画像"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="Prompt条目模板" path="promptItemTemplate">
                      <NInput
                        v-model:value="memoryConfig.user.promptItemTemplate"
                        type="textarea"
                        :autosize="{ minRows: 2, maxRows: 6 }"
                        placeholder="可使用占位符：${value}、${order}、${importance} 等"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="Prompt结束模板" path="promptFooter">
                      <NInput
                        v-model:value="memoryConfig.user.promptFooter"
                        type="textarea"
                        :autosize="{ minRows: 1, maxRows: 3 }"
                        placeholder="可选"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="抽取系统提示" path="extractionSystemPrompt">
                      <NInput
                        v-model:value="memoryConfig.user.extractionSystemPrompt"
                        type="textarea"
                        :autosize="{ minRows: 3, maxRows: 8 }"
                        placeholder="可选，覆盖内置的用户记忆抽取系统提示"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="抽取用户提示模板" path="extractionUserPrompt">
                      <NInput
                        v-model:value="memoryConfig.user.extractionUserPrompt"
                        type="textarea"
                        :autosize="{ minRows: 3, maxRows: 8 }"
                        placeholder="可选，可使用 ${messages} 作为占位符"
                      />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>
              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      中文分词扩展（Simple）
                    </div>
                    <div class="card-subtitle">
                      可选安装的 FTS5 中文 tokenizer，提升检索效果
                    </div>
                  </div>
                </template>
                <NSpace vertical :size="16">
                  <NAlert show-icon type="info">
                    该扩展来自 <a href="https://github.com/wangfenjin/simple" target="_blank" rel="noopener noreferrer">wangfenjin/simple</a> 项目，
                    用于提供中文和拼音分词能力。点击下方按钮自动下载，也可以手动填写库文件路径和词典目录。
                  </NAlert>
                  <NForm label-placement="left" label-width="auto" :model="memoryConfig.extensions.simple">
                    <NGrid :cols="24" :x-gap="12" :y-gap="16">
                      <NFormItemGridItem span="24 s:24 m:12" label="启用扩展" path="enable">
                        <NSwitch v-model:value="memoryConfig.extensions.simple.enable" />
                      </NFormItemGridItem>
                      <NFormItemGridItem span="24 s:24 m:12" label="使用结巴分词" path="useJieba">
                        <NSwitch v-model:value="memoryConfig.extensions.simple.useJieba" />
                      </NFormItemGridItem>
                      <NFormItemGridItem span="24 s:24 m:12" label="库文件路径" path="libraryPath">
                        <NInput
                          v-model:value="memoryConfig.extensions.simple.libraryPath"
                          placeholder="相对于插件目录或绝对路径，例如 resources/simple/linux-x64/libsimple.so"
                        />
                      </NFormItemGridItem>
                      <NFormItemGridItem span="24 s:24 m:12" label="词典目录" path="dictPath">
                        <NInput
                          v-model:value="memoryConfig.extensions.simple.dictPath"
                          placeholder="可选，使用结巴分词时需要，例如 resources/simple/linux-x64/dict"
                        />
                      </NFormItemGridItem>
                    </NGrid>
                  </NForm>
                  <NForm label-placement="left" label-width="auto">
                    <NGrid :cols="24" :x-gap="12" :y-gap="16">
                      <NFormItemGridItem span="24 s:24 m:12" label="目标平台">
                        <NSelect v-model:value="simpleSelectedAsset" :options="simpleAssetOptions" />
                      </NFormItemGridItem>
                      <NFormItemGridItem span="24 s:24 m:12" label="自定义文件名">
                        <NInput
                          v-model:value="simpleCustomAssetName"
                          placeholder="可选，例如 libsimple-osx-x64.zip"
                        />
                      </NFormItemGridItem>
                      <NFormItemGridItem span="24" label=" ">
                        <NSpace>
                          <NButton type="primary" :loading="simpleDownloadLoading" @click="handleDownloadSimpleExtension">
                            下载扩展
                          </NButton>
                          <NButton :loading="simpleStatusLoading" @click="refreshSimpleExtensionStatus">
                            刷新状态
                          </NButton>
                        </NSpace>
                      </NFormItemGridItem>
                    </NGrid>
                  </NForm>
                  <div class="simple-extension-status">
                    <NSpace align="center" wrap>
                      <span>当前状态：</span>
                      <NTag v-if="simpleStatus?.loaded" type="success">已加载</NTag>
                      <NTag v-else-if="simpleStatus?.enabled" type="warning">等待加载</NTag>
                      <NTag v-else type="default">未启用</NTag>
                      <NTag v-if="simpleStatus?.libraryExists" type="success">库文件存在</NTag>
                      <NTag v-else type="error">库文件缺失</NTag>
                      <NTag
                        v-if="memoryConfig.extensions.simple.useJieba"
                        :type="simpleStatus?.dictExists ? 'success' : 'warning'"
                      >
                        词典{{ simpleStatus?.dictExists ? '可用' : '缺失' }}
                      </NTag>
                    </NSpace>
                    <div class="simple-extension-paths">
                      <div>
                        库文件：{{ simpleStatus?.resolvedLibraryPath || '未配置' }}
                      </div>
                      <div>
                        词典目录：{{ simpleStatus?.resolvedDictPath || '未配置' }}
                      </div>
                      <div>
                        服务器平台：{{ simpleStatus?.platform || '未知' }} / {{ simpleStatus?.arch || '' }}
                      </div>
                      <div v-if="simpleStatus?.error">
                        <NTag type="error" size="small">{{ simpleStatus.error }}</NTag>
                      </div>
                    </div>
                  </div>
                </NSpace>
              </NCard>
              <div class="action-bar" style="margin-top: 16px;">
                <NSpace>
                  <NButton type="primary" @click="updateMemoryConfigData">
                    保存记忆配置
                  </NButton>
                </NSpace>
              </div>
              <NCard class="inner-card" title="说明">
                <p>记忆功能配置通过独立的API接口管理（/api/memory/config）。</p>
                <p>
                  记忆数据的管理请前往 <router-link to="/memory">
                    记忆管理
                  </router-link> 页面。
                </p>
              </NCard>
            </NTabPane>

            <!-- Chaite配置选项卡 -->
            <NTabPane name="chaite" tab="Chaite配置">
              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      文件与目录
                    </div>
                    <div class="card-subtitle">
                      设置Chaite相关文件目录
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.chaite">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16">
                    <NFormItemGridItem span="24 s:24 m:12" label="数据目录" path="dataDir">
                      <NInput v-model:value="config.chaite.dataDir" placeholder="相对于插件目录" />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="处理器目录" path="processorsDirPath">
                      <NInput v-model:value="config.chaite.processorsDirPath" placeholder="相对于插件目录" />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="工具目录" path="toolsDirPath">
                      <NInput v-model:value="config.chaite.toolsDirPath" placeholder="相对于插件目录" />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>

              <NCard class="inner-card">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      API与管理面板
                    </div>
                    <div class="card-subtitle">
                      设置云端API和管理面板配置
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.chaite">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16">
                    <NFormItemGridItem span="24" label="云端API URL" path="cloudBaseUrl">
                      <NInput v-model:value="config.chaite.cloudBaseUrl" placeholder="输入云端API URL" />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="云端API Key" path="cloudApiKey">
                      <NInput
                        v-model:value="config.chaite.cloudApiKey"
                        type="password"
                        show-password-on="click"
                        placeholder="输入云端API Key"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="认证密钥" path="authKey">
                      <NInput
                        v-model:value="config.chaite.authKey"
                        type="password"
                        show-password-on="click"
                        placeholder="非必要勿修改"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="监听地址" path="host">
                      <NInput v-model:value="config.chaite.host" placeholder="管理面板监听地址" />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="监听端口" path="port">
                      <NInputNumber
                        v-model:value="config.chaite.port"
                        :min="1"
                        :max="65535"
                        style="width: 100%"
                        placeholder="输入监听端口"
                      />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>
            </NTabPane>
          </NTabs>

          <div class="action-bar">
            <NSpace>
              <!--              <NButton type="default" @click="resetConfig"> -->
              <!--                重置配置 -->
              <!--              </NButton> -->
              <NButton type="primary" @click="updateConfig">
                保存配置
              </NButton>
            </NSpace>
          </div>
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.config-container {
  margin: 20px;
}

.main-card {
  margin-bottom: 24px;
}

.layout-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Switch to side-by-side layout for wider screens */
@media (min-width: 992px) {
  .layout-container {
    flex-direction: row;
  }

  .sidebar {
    width: 200px;
    flex-shrink: 0;
  }

  .content-area {
    flex: 1;
    padding-left: 20px;
  }

  /* Hide tab headers in wider layout since we use side menu */
  .responsive-tabs :deep(.n-tabs-tab) {
    display: none;
  }
}

.sidebar {
  display: none;
}

@media (min-width: 992px) {
  .sidebar {
    display: block;
    border-right: 1px solid #eee;
    padding-right: 20px;
  }
}

.simple-extension-status {
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
}

.simple-extension-paths {
  margin-top: 8px;
}

.simple-extension-paths div {
  word-break: break-all;
}

.inner-card {
  margin-bottom: 16px;
}

.card-header {
  margin-bottom: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.card-subtitle {
  font-size: 12px;
  color: #8e8e8e;
  margin-top: 4px;
}

.action-bar {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.mb-4 {
  margin-bottom: 16px;
}

.version-info {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  font-size: 12px;
  color: #999;
  text-align: center;
}

/* Visual elements */
.demo-box {
  margin-top: 16px;
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.demo-content {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
}

.demo-title {
  font-weight: 500;
  margin-bottom: 8px;
  color: #666;
}

.highlight {
  color: #18a058;
  font-weight: 500;
}

.demo-text {
  line-height: 1.8;
}

.form-hint {
  font-size: 12px;
  color: #999;
}

.preset-map-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preset-map-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 8px;
}

.preset-map-keyword-container {
  width: 40%;
}

.preset-map-keywords {
  width: 100%;
}

.preset-map-arrow {
  color: #999;
  flex-shrink: 0;
}

.preset-map-preset {
  width: 25%;
}

.preset-map-priority {
  width: 15%;
}

.preset-map-recall {
  flex-shrink: 0;
  margin-left: 8px;
}

.preset-map-delete {
  flex-shrink: 0;
}
</style>
