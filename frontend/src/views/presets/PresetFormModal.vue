<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NButton, NCard, NCheckbox, NCheckboxGroup, NCollapse, NCollapseItem, NForm, NFormItemGridItem, NGrid, NIcon, NInput, NInputNumber, NModal, NPopover, NSelect, NSpace, NTooltip } from 'naive-ui'
import { InformationCircleOutline } from '@vicons/ionicons5'
import type { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import type { FormInst } from 'naive-ui'
import { HarmBlockThreshold, HarmCategory } from '@/utils/constants'
import type { Shareable } from '@/typings/entities/shareable'

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
  toolsOptions: {
    type: Array,
    default: () => [],
  },
  modelOptions: {
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

const groupContextOptions = [
  { label: '禁用', value: 'disable' },
  { label: '启用', value: 'enabled' },
  { label: '使用系统提示词', value: 'use_system' },
]

const dynamicContextHistoryOptions = [
  { label: '使用全局配置', value: 'use_system' },
  { label: '仅保留最新一轮（省 Token）', value: 'discard' },
  { label: '保留每一轮（适合上下文缓存）', value: 'retain' },
]

const responseModalitiesOptions = [
  { label: '文本', value: 'text' },
  { label: '图片', value: 'image' },
]

const reasoningEffortOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
  { label: '最小', value: 'minimal' },
]

const toolChoiceTypeOptions = [
  { label: '无', value: 'none' },
  { label: 'ANY', value: 'any' },
  { label: 'AUTO', value: 'auto' },
  { label: '指定', value: 'specified' },
]

// Add options for safety settings
const harmCategoryOptions = Object.entries(HarmCategory)
  .map(([label, value]) => ({ label, value }))

const harmBlockThresholdOptions = Object.entries(HarmBlockThreshold)
  .map(([label, value]) => ({ label, value }))

const channelRules = {
  'name': {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入预设名称',
  },
  'description': {
    required: true,
    trigger: ['blur', 'change'],
    message: '请选择客户端类型',
  },
  'prefix': {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入基础URL',
  },
  'sendMessageOption.model': {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入模型',
  },
}

// Form data
const addPreset = ref<Partial<Shareable.PresetModel>>({
  modelType: 'settings',
  name: '',
  embedded: false,
  description: '',
  sendMessageOption: {
    systemOverride: '',
    temperature: 0.6,
    model: '',
    maxToken: 4000,
    disableHistoryRead: false,
    disableHistorySave: false,
    stream: true,
    enableReasoning: false,
    reasoningEffort: 'medium',
    reasoningBudgetTokens: 2000,
    toolChoice: {
      type: 'auto',
      tools: [],
    } as Shareable.ToolChoice,
    toolGroupId: ['default_local'],
    responseModalities: undefined,
    safetySettings: undefined,
  } as Shareable.SendMessageOption,
  prefix: '',
  local: true,
  groupContext: 'use_system',
  dynamicContextHistory: 'use_system',
  builtinToolCategories: ['mcp-discovery', 'mcp-management', 'skill-management'],
  disableSystemInstructions: false,
})

// Initialize form when in edit mode
watch(() => props.initialData, (newVal) => {
  if (props.editMode && newVal) {
    // Ensure all required nested properties exist
    const data = { ...newVal }
    if (!data.sendMessageOption) {
      data.sendMessageOption = {}
    }

    if (!data.sendMessageOption.toolChoice) {
      data.sendMessageOption.toolChoice = { type: 'auto', tools: [] }
    }
    if (!data.dynamicContextHistory) {
      data.dynamicContextHistory = 'use_system'
    }
    if (!Array.isArray(data.builtinToolCategories)) {
      data.builtinToolCategories = ['mcp-discovery', 'mcp-management', 'skill-management']
    }

    addPreset.value = data
  }
}, { immediate: true })

// Add safety setting
function addSafetySetting() {
  if (!addPreset.value.sendMessageOption!.safetySettings) {
    addPreset.value.sendMessageOption!.safetySettings = []
  }

  addPreset.value.sendMessageOption!.safetySettings.push({
    // method: HarmBlockMethod.HARM_BLOCK_METHOD_UNSPECIFIED,
    category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
    threshold: HarmBlockThreshold.HARM_BLOCK_THRESHOLD_UNSPECIFIED,
  })
}

// Remove safety setting
function removeSafetySetting(index: number) {
  if (addPreset.value.sendMessageOption?.safetySettings) {
    addPreset.value.sendMessageOption.safetySettings.splice(index, 1)
  }
}

function handleAddPreset() {
  formRef.value?.validate().then((errors) => {
    if (Array.isArray(errors)) {
      console.error(errors)
      return
    }
    emit('submit', addPreset.value)
    showModal.value = false
  })
}

// Reset form when modal is closed
watch(showModal, (val) => {
  if (!val && !props.editMode) {
    addPreset.value = {
      modelType: 'settings',
      name: '',
      embedded: false,
      description: '',
      sendMessageOption: {
        systemOverride: '',
        temperature: 0.6,
        model: '',
        maxToken: 4000,
        isThinkingModel: false,
        disableHistoryRead: false,
        disableHistorySave: false,
        stream: true,
        enableReasoning: false,
        reasoningEffort: 'medium',
        reasoningBudgetTokens: 2000,
        toolChoice: {
          type: 'auto',
          tools: [],
        },
        toolGroupId: ['default_local'],
        responseModalities: undefined,
        safetySettings: undefined,
      },
      prefix: '',
      local: true,
      groupContext: 'use_system',
      dynamicContextHistory: 'use_system',
      builtinToolCategories: ['mcp-discovery', 'mcp-management', 'skill-management'],
    }
  }
})
</script>

<template>
  <div>
    <NModal v-model:show="showModal" preset="card" style="width: 700px; max-width: 90vw">
      <NCard :title="editMode ? '编辑预设' : '添加预设'">
        <NForm ref="formRef" :rules="channelRules" :model="addPreset">
          <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="self" item-responsive>
            <!-- 预设名称 -->
            <NFormItemGridItem span="12 s:8 m:8" label="名称" path="name">
              <NInput v-model:value="addPreset.name" placeholder="请输入预设名称" />
            </NFormItemGridItem>

            <!-- 预设前缀 -->
            <NFormItemGridItem span="12 s:8 m:8" label="前缀" path="prefix">
              <NInput v-model:value="addPreset.prefix" placeholder="请输入前缀" />
            </NFormItemGridItem>

            <!-- 模型 -->
            <NFormItemGridItem span="12 s:8 m:8" label="模型" path="sendMessageOption.model">
              <NSelect
                v-model:value="addPreset.sendMessageOption!!.model"
                :options="modelOptions as SelectMixedOption[]"
                filterable
                tag
                clearable
                placeholder="选择渠道模型，或直接输入自定义模型名"
              />
            </NFormItemGridItem>

            <!-- 温度 -->
            <NFormItemGridItem span="12 s:8 m:8" label="温度" path="sendMessageOption.temperature">
              <NInputNumber v-model:value="addPreset.sendMessageOption!!.temperature" placeholder="请输入温度" />
            </NFormItemGridItem>

            <!-- 最大Token -->
            <NFormItemGridItem span="12 s:8 m:8" label="最大Token" path="sendMessageOption.maxToken">
              <NInputNumber v-model:value="addPreset.sendMessageOption!!.maxToken" placeholder="请输入最大Token数" />
            </NFormItemGridItem>

            <NFormItemGridItem span="12 s:12 m:6" label="推理模型" path="sendMessageOption.isThinkingModel">
              <NCheckbox v-model:checked="addPreset.sendMessageOption!!.isThinkingModel">
                是否是推理模型
              </NCheckbox>
            </NFormItemGridItem>

            <!-- 系统提示词 -->
            <NFormItemGridItem span="24" label="系统提示词" path="sendMessageOption.systemOverride">
              <NInput v-model:value="addPreset.sendMessageOption!!.systemOverride" type="textarea" placeholder="请输入提示词" />
            </NFormItemGridItem>
          </NGrid>

          <!-- Advanced Settings in Collapsible Panel -->
          <NCollapse class="mt-4">
            <NCollapseItem title="高级设置" name="advanced">
              <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                <!-- 历史记录设置 -->
                <NFormItemGridItem span="24 s:12 m:12" label="历史记录设置" path="historySettings">
                  <NSpace align="center">
                    <NCheckbox v-model:checked="addPreset.sendMessageOption!!.disableHistoryRead">
                      禁用历史记录读取
                    </NCheckbox>
                    <NCheckbox v-model:checked="addPreset.sendMessageOption!!.disableHistorySave">
                      禁用历史记录保存
                    </NCheckbox>
                  </NSpace>
                </NFormItemGridItem>

                <!-- 流模式 -->
                <NFormItemGridItem span="12 s:12 m:6" label="流模式" path="sendMessageOption.stream">
                  <NCheckbox v-model:checked="addPreset.sendMessageOption!!.stream">
                    启用流模式
                  </NCheckbox>
                </NFormItemGridItem>

                <!-- 携带群聊上下文 -->
                <NFormItemGridItem span="12 s:12 m:12" label="携带群聊上下文" path="sendMessageOption.groupContext">
                  <NSelect
                    v-model:value="addPreset.groupContext"
                    :options="groupContextOptions"
                    placeholder="请选择群聊上下文设置"
                  />
                </NFormItemGridItem>

                <NFormItemGridItem span="12 s:12 m:12" label="动态上下文历史" path="dynamicContextHistory">
                  <NSelect
                    v-model:value="addPreset.dynamicContextHistory"
                    :options="dynamicContextHistoryOptions"
                    placeholder="选择是否保留旧的群聊上下文和时间"
                  />
                </NFormItemGridItem>

                <NFormItemGridItem span="24" label="内置工具" path="builtinToolCategories">
                  <NCheckboxGroup v-model:value="addPreset.builtinToolCategories">
                    <NSpace>
                      <NCheckbox value="mcp-discovery">
                        MCP 发现与按需激活（2 个）
                      </NCheckbox>
                      <NCheckbox value="mcp-management">
                        MCP 管理（仅主人，2 个）
                      </NCheckbox>
                      <NCheckbox value="skill-management">
                        Skill/工作流管理（仅主人，6 个）
                      </NCheckbox>
                    </NSpace>
                  </NCheckboxGroup>
                </NFormItemGridItem>

                <!-- 禁止系统prompt -->
                <NFormItemGridItem span="12 s:12 m:12" label="禁止系统prompt" path="sendMessageOption.disableSystemInstructions">
                  <NCheckbox v-model:checked="addPreset.disableSystemInstructions">
                    禁止系统prompt
                  </NCheckbox>
                </NFormItemGridItem>

                <!-- 推理设置 -->
                <NFormItemGridItem span="24" label="推理设置" path="reasoningSettings">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16">
                    <NFormItemGridItem span="8" label="启用推理" path="sendMessageOption.enableReasoning">
                      <NCheckbox v-model:checked="addPreset.sendMessageOption!!.enableReasoning">
                        启用推理
                      </NCheckbox>
                    </NFormItemGridItem>
                    <NFormItemGridItem span="8" label="推理强度" path="sendMessageOption.reasoningEffort">
                      <NSelect
                        v-model:value="addPreset.sendMessageOption!!.reasoningEffort"
                        :options="reasoningEffortOptions"
                        placeholder="请选择推理强度"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="8" label="推理Token预算" path="sendMessageOption.reasoningBudgetTokens">
                      <NInputNumber
                        v-model:value="addPreset.sendMessageOption!!.reasoningBudgetTokens"
                        placeholder="推理Token预算"
                      />
                    </NFormItemGridItem>
                  </NGrid>
                </NFormItemGridItem>

                <!-- 工具选择 -->
                <NFormItemGridItem span="24" label="工具选择" path="sendMessageOption.toolChoice">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16">
                    <NFormItemGridItem span="24" label="" path="sendMessageOption.toolChoice.type">
                      <div style="display: flex; align-items: center; width: 100%;">
                        <NSelect
                          v-model:value="addPreset.sendMessageOption!!.toolChoice!!.type"
                          :options="toolChoiceTypeOptions"
                          placeholder="请选择工具选择类型"
                          style="flex: 1;"
                        />
                        <NTooltip placement="top" trigger="hover">
                          <template #trigger>
                            <NIcon size="18" class="ml-2" style="margin-left: 8px; cursor: pointer;">
                              <InformationCircleOutline />
                            </NIcon>
                          </template>
                          <span>注意：如果选择了"任意"，则toolcall的下一轮assistant消息会自动变回"自动"模式，否则会无限使用工具。</span>
                        </NTooltip>
                      </div>
                    </NFormItemGridItem>
                  </NGrid>
                </NFormItemGridItem>

                <!-- 响应模态 -->
                <NFormItemGridItem span="24" label="响应模态" path="sendMessageOption.responseModalities">
                  <NSelect
                    v-model:value="addPreset.sendMessageOption!!.responseModalities"
                    multiple
                    placeholder="请选择响应模态"
                    :options="responseModalitiesOptions"
                  />
                  <NTooltip placement="top" trigger="hover">
                    <template #trigger>
                      <NIcon size="18" class="ml-2" style="margin-left: 8px; cursor: pointer;">
                        <InformationCircleOutline />
                      </NIcon>
                    </template>
                    <span>仅 Gemini 模型支持此功能</span>
                  </NTooltip>
                </NFormItemGridItem>

                <!-- 安全设置 -->
                <NFormItemGridItem span="24" label="安全设置" path="sendMessageOption.safetySettings">
                  <div>
                    <NButton size="small" type="primary" style="margin-bottom: 12px" @click="addSafetySetting">
                      添加安全设置
                    </NButton>
                    <NTooltip placement="top" trigger="hover">
                      <template #trigger>
                        <NIcon size="18" class="ml-2" style="margin-left: 8px; cursor: pointer;">
                          <InformationCircleOutline />
                        </NIcon>
                      </template>
                      <span>仅 Gemini 模型支持此功能</span>
                    </NTooltip>

                    <div v-if="addPreset.sendMessageOption?.safetySettings?.length === 0" class="text-xs text-gray-500">
                      还没有添加安全设置
                    </div>

                    <div
                      v-for="(setting, index) in addPreset.sendMessageOption?.safetySettings"
                      :key="index"
                      style="border: 1px solid #eee; padding: 12px; margin-bottom: 12px; border-radius: 4px;"
                    >
                      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong>安全设置 #{{ index + 1 }}</strong>
                        <NButton size="small" type="error" @click="removeSafetySetting(index)">
                          删除
                        </NButton>
                      </div>

                      <NSpace vertical style="width: 100%">
                        <!--                        <div style="width: 100%"> -->
                        <!--                          <div style="margin-bottom: 4px; font-size: 12px; display: flex; align-items: center;"> -->
                        <!--                            方法 -->
                        <!--                            <NTooltip placement="top" trigger="hover"> -->
                        <!--                              <template #trigger> -->
                        <!--                                <NIcon size="16" style="margin-left: 4px; cursor: pointer;"> -->
                        <!--                                  <InformationCircleOutline /> -->
                        <!--                                </NIcon> -->
                        <!--                              </template> -->
                        <!--                              <span>确定伤害拦截方法是使用概率分数还是同时使用概率和严重程度分数</span> -->
                        <!--                            </NTooltip> -->
                        <!--                          </div> -->
                        <!--                          <NSelect -->
                        <!--                            v-model:value="setting.method" -->
                        <!--                            :options="harmMethodOptions" -->
                        <!--                            placeholder="选择方法" -->
                        <!--                            style="width: 100%" -->
                        <!--                          /> -->
                        <!--                        </div> -->

                        <div style="width: 100%">
                          <div style="margin-bottom: 4px; font-size: 12px; display: flex; align-items: center;">
                            类别
                            <NTooltip placement="top" trigger="hover">
                              <template #trigger>
                                <NIcon size="16" style="margin-left: 4px; cursor: pointer;">
                                  <InformationCircleOutline />
                                </NIcon>
                              </template>
                              <span>伤害类别，指定需要检测和过滤的有害内容类型</span>
                            </NTooltip>
                          </div>
                          <NSelect
                            v-model:value="setting.category"
                            :options="harmCategoryOptions"
                            placeholder="选择类别"
                            style="width: 100%"
                          />
                        </div>

                        <div style="width: 100%">
                          <div style="margin-bottom: 4px; font-size: 12px; display: flex; align-items: center;">
                            阈值
                            <NTooltip placement="top" trigger="hover">
                              <template #trigger>
                                <NIcon size="16" style="margin-left: 4px; cursor: pointer;">
                                  <InformationCircleOutline />
                                </NIcon>
                              </template>
                              <span>伤害阻止阈值，决定在何种级别的风险程度下阻止内容生成</span>
                            </NTooltip>
                          </div>
                          <NSelect
                            v-model:value="setting.threshold"
                            :options="harmBlockThresholdOptions"
                            placeholder="选择阈值"
                            style="width: 100%"
                          />
                        </div>
                      </NSpace>
                    </div>
                  </div>
                </NFormItemGridItem>

                <!-- 处理器设置 -->
                <NFormItemGridItem span="24 s:12 m:12" label="处理器" path="processors">
                  <NSpace>
                    <NPopover trigger="hover" placement="bottom" :width="260">
                      <template #trigger>
                        <NButton size="small">
                          前处理器
                        </NButton>
                      </template>
                      <NSelect
                        v-model:value="addPreset.sendMessageOption!!.preProcessorIds"
                        multiple
                        placeholder="请选择前处理器"
                        :options="preProcessorOptions as SelectMixedOption[]"
                      />
                    </NPopover>
                    <NPopover trigger="hover" placement="bottom" :width="260">
                      <template #trigger>
                        <NButton size="small">
                          后处理器
                        </NButton>
                      </template>
                      <NSelect
                        v-model:value="addPreset.sendMessageOption!!.postProcessorIds"
                        multiple
                        placeholder="请选择后处理器"
                        :options="postProcessorOptions as SelectMixedOption[]"
                      />
                    </NPopover>
                  </NSpace>
                </NFormItemGridItem>

                <NFormItemGridItem span="24 s:12 m:12" label="工具" path="tools">
                  <NPopover trigger="hover" placement="bottom" :width="260">
                    <template #trigger>
                      <NButton size="small">
                        工具组
                      </NButton>
                    </template>
                    <NSelect
                      v-model:value="addPreset.sendMessageOption!!.toolGroupId"
                      multiple
                      placeholder="请选择工具组"
                      :options="toolsOptions as SelectMixedOption[]"
                    />
                  </NPopover>
                </NFormItemGridItem>
              </NGrid>
            </NCollapseItem>
          </NCollapse>

          <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
            <NSpace>
              <NButton @click="showModal = false">
                取消
              </NButton>
              <NButton type="primary" @click="handleAddPreset">
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
