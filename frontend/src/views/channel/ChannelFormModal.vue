<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NButton, NCard, NCollapse, NCollapseItem, NDynamicTags, NFlex, NForm, NFormItemGridItem, NGrid, NInput, NInputNumber, NModal, NSelect, NSpace, NSwitch } from 'naive-ui'
import type { FormInst } from 'naive-ui'

const props = defineProps({
  show: Boolean,
  editMode: Boolean,
  initialData: {
    type: Object,
    default: () => ({}),
  },
  preProcessorOptions: {
    type: Array,
    default: () => [],
  },
  postProcessorOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:show', 'submit'])

const formRef = ref<FormInst | null>()

const showModal = computed({
  get: () => props.show,
  set: value => emit('update:show', value),
})

const channelRules = {
  'name': {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入渠道名称',
  },
  'adapterType': {
    required: true,
    trigger: ['blur', 'change'],
    message: '请选择客户端类型',
  },
  'options.baseUrl': {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入基础URL',
  },
}

// Form data
const addChannel = ref<Partial<Shareable.ChannelModel>>({
  adapterType: 'openai',
  models: [],
  weight: 1,
  priority: 0,
  status: 'enabled',
  options: {
    baseUrl: '',
    apiKey: '',
    multipleKeyStrategy: 'random',
    proxy: '',
    preProcessorIds: [],
    postProcessorIds: [],
  },
  description: '',
  name: '',
  modelType: 'settings',
})

const modelsValidationStatus = computed(() => {
  const modelsArray = Array.isArray(addChannel.value.models)
    ? addChannel.value.models
    : []

  if (modelsArray.length === 0) {
    return 'error'
  }

  // Check for duplicates
  const uniqueModels = new Set(modelsArray)
  if (uniqueModels.size !== modelsArray.length) {
    return 'error'
  }

  return undefined // Valid
})

const modelsFeedback = computed(() => {
  const modelsArray = Array.isArray(addChannel.value.models)
    ? addChannel.value.models
    : []

  if (modelsArray.length === 0) {
    return '请至少添加一个模型'
  }

  // Check for duplicates
  const uniqueModels = new Set(modelsArray)
  if (uniqueModels.size !== modelsArray.length) {
    return '模型名称不能重复'
  }

  return ''
})

// Model management
const tagModelMode = ref(true)
const modelTags = ref<string[]>([])
const newModelInput = ref('')
const modelsText = ref('')

const statusEnabled = computed({
  get: () => addChannel.value.status === 'enabled',
  set: value => updateStatus(value),
})

// Initialize form when in edit mode
watch(() => props.initialData, (newVal) => {
  if (props.editMode && newVal) {
    addChannel.value = { ...newVal }
    modelTags.value = [...(newVal.models || [])]
    modelsText.value = (newVal.models || []).join(', ')
  }
}, { immediate: true })

// Methods
function updateStatus(value: boolean) {
  addChannel.value.status = value ? 'enabled' : 'disabled'
}

function updateModels(value: string[]) {
  addChannel.value.models = [...value]
}

function addModelTag() {
  if (newModelInput.value.trim()) {
    modelTags.value.push(newModelInput.value.trim())
    updateModels(modelTags.value)
    newModelInput.value = ''
  }
}

function updateModelsFromText(value: string) {
  const models = value.split(',').map(item => item.trim()).filter(Boolean)
  addChannel.value.models = models
  modelTags.value = models
}

function handleAddChannel() {
  formRef.value?.validate().then((errors) => {
    if (Array.isArray(errors)) {
      console.error(errors)
      return
    }
    emit('submit', addChannel.value)
    showModal.value = false
  })
}

// API key handling - 使用独立的响应式变量
const apiKeyText = ref('')

// 初始化API密钥文本
watch(() => addChannel.value.options?.apiKey, (apiKey) => {
  if (Array.isArray(apiKey)) {
    apiKeyText.value = apiKey.join('\n')
  }
  else {
    apiKeyText.value = apiKey || ''
  }
}, { immediate: true })

// 处理API密钥更新
function updateApiKey() {
  if (!addChannel.value.options) {
    addChannel.value.options = {} as Shareable.BaseClientOptions
  }

  const keys = apiKeyText.value.split('\n').filter(line => line.length > 0)
  addChannel.value.options.apiKey = keys.length > 1 ? keys : (keys[0] || '')
}

// API key handling
const apiKeyInput = computed({
  get: () => {
    const apiKey = addChannel.value.options?.apiKey
    if (Array.isArray(apiKey)) {
      return apiKey.join('\n')
    }
    return apiKey || ''
  },
  set: (value: string) => {
    if (!addChannel.value.options) {
      addChannel.value.options = {} as Shareable.BaseClientOptions
    }

    const keys = value.split('\n').filter(line => line.length > 0)
    addChannel.value.options.apiKey = keys.length > 1 ? keys : (keys[0] || '')
  },
})

// Reset form when modal is closed
watch(showModal, (val) => {
  if (!val && !props.editMode) {
    addChannel.value = {
      adapterType: 'openai',
      models: [],
      weight: 1,
      priority: 0,
      status: 'enabled',
      options: {
        baseUrl: '',
        apiKey: '',
        multipleKeyStrategy: 'random',
        proxy: '',
        preProcessorIds: [],
        postProcessorIds: [],
      },
      description: '',
    }
    modelTags.value = []
    modelsText.value = ''
    newModelInput.value = ''
  }
})
</script>

<template>
  <div>
    <NModal v-model:show="showModal" preset="card" style="width: 700px; max-width: 90vw">
      <NCard :title="editMode ? '编辑渠道' : '添加渠道'">
        <NForm ref="formRef" :rules="channelRules" :model="addChannel">
          <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
            <!-- 渠道名称 -->
            <NFormItemGridItem span="24 s:12 m:16" label="名称" path="name">
              <NInput v-model:value="addChannel.name" placeholder="请输入渠道名称" />
            </NFormItemGridItem>

            <!-- 适配器类型 -->
            <NFormItemGridItem span="24 s:12 m:8" label="适配器类型" path="adapterType">
              <NSelect
                v-model:value="addChannel.adapterType"
                :options="[
                  { label: 'OpenAI', value: 'openai' },
                  { label: 'Gemini', value: 'gemini' },
                  { label: 'Claude', value: 'claude' },
                ]"
                placeholder="请选择适配器类型"
              />
            </NFormItemGridItem>

            <!-- 基础URL -->
            <NFormItemGridItem span="24 s:12 m:16" label="BaseURL" path="options.baseUrl">
              <NInput v-model:value="addChannel.options!!.baseUrl" placeholder="请输入基础URL" />
            </NFormItemGridItem>

            <!-- API密钥 -->
            <NFormItemGridItem span="24" label="API密钥" path="options.apiKey">
              <NInput
                v-model:value="apiKeyText"
                type="textarea"
                placeholder="请输入API密钥，多个密钥请每行输入一个"
                @blur="updateApiKey"
              />
            </NFormItemGridItem>

            <!-- Models Section - Always Visible -->
            <NFormItemGridItem
              span="24 s:12 m:8"
              label="支持模型"
              path="models"
              :validation-status="modelsValidationStatus"
              :feedback="modelsFeedback"
            >
              <NFlex vertical>
                <NFlex align="center" class="mb-2">
                  <NSwitch v-model:value="tagModelMode" size="small" />
                  <span class="ml-2 text-xs">{{ tagModelMode ? '标签模式' : '文本模式' }}</span>
                </NFlex>
                <template v-if="tagModelMode">
                  <NDynamicTags
                    v-model:value="modelTags"
                    @update:value="updateModels"
                  />
                  <NInput
                    v-model:value="newModelInput"
                    class="mt-2"
                    placeholder="输入模型名称后按回车添加"
                    @keydown.enter.prevent="addModelTag"
                  />
                </template>
                <NInput
                  v-else
                  v-model:value="modelsText"
                  placeholder="请输入支持的模型列表，以逗号分隔"
                  @update:value="updateModelsFromText"
                />
              </NFlex>
            </NFormItemGridItem>
          </NGrid>

          <!-- Advanced Settings in Collapsible Panel -->
          <NCollapse class="mt-4">
            <NCollapseItem title="高级设置" name="advanced">
              <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                <!-- 状态设置 -->
                <NFormItemGridItem span="24 s:12 m:8" label="状态" path="status">
                  <NSpace align="center">
                    <NSwitch v-model:value="statusEnabled" @update:value="updateStatus" />
                    <span>{{ statusEnabled ? '启用' : '禁用' }}</span>
                  </NSpace>
                </NFormItemGridItem>

                <!-- 多密钥策略 -->
                <NFormItemGridItem span="24 s:12 m:8" label="多密钥策略" path="options.multipleKeyStrategy">
                  <NSelect
                    v-model:value="addChannel.options!!.multipleKeyStrategy"
                    :options="[
                      { label: '随机', value: 'random' },
                      { label: '轮询', value: 'round-robin' },
                      { label: '会话哈希', value: 'conversation-hash' },
                    ]"
                    placeholder="请选择多密钥策略"
                  />
                </NFormItemGridItem>

                <!-- 代理设置 -->
                <NFormItemGridItem span="24 s:12 m:8" label="代理" path="options.proxy">
                  <NInput v-model:value="addChannel.options!!.proxy" placeholder="请输入代理地址(可选)" />
                </NFormItemGridItem>

                <!-- 优先级与权重 -->
                <NFormItemGridItem span="24 s:12 m:8" label="优先级" path="priority">
                  <NInputNumber v-model:value="addChannel.priority" />
                </NFormItemGridItem>

                <NFormItemGridItem span="24 s:12 m:8" label="权重" path="weight">
                  <NInputNumber v-model:value="addChannel.weight" />
                </NFormItemGridItem>

                <!-- 描述字段 -->
                <NFormItemGridItem span="24" label="描述" path="description">
                  <NInput
                    v-model:value="addChannel.description"
                    type="textarea"
                    placeholder="请输入渠道描述"
                  />
                </NFormItemGridItem>

                <!-- 禁用原因，条件渲染 -->
                <NFormItemGridItem v-if="!statusEnabled" span="24" label="禁用原因" path="disabledReason">
                  <NInput v-model:value="addChannel.disabledReason" placeholder="请输入禁用原因" />
                </NFormItemGridItem>
              </NGrid>
            </NCollapseItem>
          </NCollapse>

          <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
            <NSpace>
              <NButton @click="showModal = false">
                取消
              </NButton>
              <NButton type="primary" @click="handleAddChannel">
                确定
              </NButton>
            </NSpace>
          </div>
        </NForm>
      </NCard>
    </NModal>
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 12px;
}
</style>
