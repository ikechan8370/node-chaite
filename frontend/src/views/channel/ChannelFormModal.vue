<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NButton, NCard, NCheckbox, NCollapse, NCollapseItem, NFlex, NForm, NFormItemGridItem, NGrid, NInput, NInputNumber, NModal, NSelect, NSpace, NSwitch, useMessage } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import { autoDetectFeatures } from '@/service/api/channels'

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
  const modelsArray = addChannel.value.models || []
  if (modelsArray.length === 0) {
    return 'error'
  }
  // Check for duplicate names
  const names = modelsArray.map(m => m.name)
  if (new Set(names).size !== names.length) {
    return 'error'
  }
  // Check for empty names
  if (modelsArray.some(m => !m.name?.trim())) {
    return 'error'
  }
  return undefined
})

const modelsFeedback = computed(() => {
  const modelsArray = addChannel.value.models || []
  if (modelsArray.length === 0) {
    return '请至少添加一个模型'
  }
  const names = modelsArray.map(m => m.name)
  if (new Set(names).size !== names.length) {
    return '模型名称不能重复'
  }
  if (modelsArray.some(m => !m.name?.trim())) {
    return '模型名称不能为空'
  }
  return ''
})

// Model management
function addModelEntry() {
  if (!addChannel.value.models) addChannel.value.models = []
  addChannel.value.models.push({ name: '', features: ['chat', 'tool'] })
}

function removeModelEntry(index: number) {
  if (addChannel.value.models) {
    addChannel.value.models.splice(index, 1)
  }
}

const message = useMessage()
const detectingModelIndex = ref(-1)

async function detectModelFeatures(index: number) {
  const model = addChannel.value.models?.[index]
  if (!model?.name?.trim()) {
    message.warning('请先输入模型名称')
    return
  }
  if (!props.initialData?.id) {
    message.warning('请先保存渠道后再探测')
    return
  }
  detectingModelIndex.value = index
  try {
    const res = await autoDetectFeatures({ id: props.initialData.id as string, model: model.name })
    if (res.code === 0) {
      const features: string[] = []
      for (const [key, val] of Object.entries(res.data.features)) {
        if (val.supported) features.push(key)
      }
      model.features = features as any
      message.success(`${model.name}: ${features.join(', ') || '无'}`)
    } else {
      message.error(res.message || '探测失败')
    }
  } catch (e: any) {
    message.error(e?.message || '探测失败')
  } finally {
    detectingModelIndex.value = -1
  }
}

function toggleModelFeature(index: number, feature: string, checked: boolean) {
  if (!addChannel.value.models) return
  const model = addChannel.value.models[index]
  if (!model) return
  if (!model.features) model.features = []
  if (checked) {
    if (!model.features.includes(feature as any)) model.features.push(feature as any)
  } else {
    model.features = model.features.filter(f => f !== feature)
  }
}

const statusEnabled = computed({
  get: () => addChannel.value.status === 'enabled',
  set: value => updateStatus(value),
})

// Initialize form when in edit mode
watch(() => props.initialData, (newVal) => {
  if (props.editMode && newVal) {
    addChannel.value = { ...newVal }
    // Ensure models have features
    if (addChannel.value.models) {
      addChannel.value.models = addChannel.value.models.map((m: any) => typeof m === 'string'
        ? { name: m, features: ['chat', 'tool'] }
        : { name: m.name || '', features: m.features || ['chat', 'tool'] })
    }
  }
}, { immediate: true })

// Methods
function updateStatus(value: boolean) {
  addChannel.value.status = value ? 'enabled' : 'disabled'
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
          </NGrid>

          <!-- Models Section -->
          <div class="mt-4">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span>
                  <span style="color: red;">*</span> 支持模型
                  <span v-if="modelsValidationStatus" style="color: #d03050; font-size: 12px;">
                    — {{ modelsFeedback }}
                  </span>
                </span>
                <NButton size="small" type="primary" @click="addModelEntry">
                  + 添加模型
                </NButton>
              </div>
              <div
                v-for="(model, idx) in (addChannel.models || [])"
                :key="idx"
                style="border: 1px solid #e8e8e8; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px;"
              >
                <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
                  <NInput
                    v-model:value="model.name"
                    placeholder="模型名称"
                    size="small"
                    style="flex: 1; max-width: 180px;"
                  />
                  <NButton
                    size="tiny"
                    :loading="detectingModelIndex === idx"
                    @click="detectModelFeatures(idx)"
                  >
                    🔍
                  </NButton>
                  <NButton size="tiny" type="error" quaternary @click="removeModelEntry(idx)">
                    删除
                  </NButton>
                </div>
                <NSpace :size="4">
                  <NCheckbox
                    size="small"
                    :checked="model.features?.includes('chat')"
                    @update:checked="(v: boolean) => toggleModelFeature(idx, 'chat', v)"
                  >
                    💬 对话
                  </NCheckbox>
                  <NCheckbox
                    size="small"
                    :checked="model.features?.includes('visual')"
                    @update:checked="(v: boolean) => toggleModelFeature(idx, 'visual', v)"
                  >
                    👁️ 识图
                  </NCheckbox>
                  <NCheckbox
                    size="small"
                    :checked="model.features?.includes('tool')"
                    @update:checked="(v: boolean) => toggleModelFeature(idx, 'tool', v)"
                  >
                    🔧 工具
                  </NCheckbox>
                  <NCheckbox
                    size="small"
                    :checked="model.features?.includes('embedding')"
                    @update:checked="(v: boolean) => toggleModelFeature(idx, 'embedding', v)"
                  >
                    📊 嵌入
                  </NCheckbox>
                </NSpace>
              </div>
              <div v-if="!addChannel.models || addChannel.models.length === 0" style="color: #999; font-size: 12px;">
                暂无模型，请点击"添加模型"
              </div>
            </div>

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
