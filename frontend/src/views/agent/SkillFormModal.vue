<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  NButton,
  NDynamicTags,
  NForm,
  NFormItemGridItem,
  NGrid,
  NInput,
  NModal,
  NSelect,
  NSpace,
} from 'naive-ui'
import type { FormInst } from 'naive-ui'
import type { CreateSkillDTO, SkillDetail, SkillExecutionMode, UpdateSkillDTO } from '@/service/api/agent'

const props = defineProps<{
  show: boolean
  editMode: boolean
  initialData: Partial<SkillDetail>
  presetOptions?: Array<{ label: string; value: string }>
  mcpServerOptions?: Array<{ label: string; value: string }>
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'submit', data: CreateSkillDTO | (UpdateSkillDTO & { name?: string })): void
}>()

const formRef = ref<FormInst | null>(null)

const showModal = computed({
  get: () => props.show,
  set: val => emit('update:show', val),
})

interface FormState {
  name: string
  description: string
  systemPrompt: string
  executionMode: SkillExecutionMode
  allowedTools: string[]
  preset: string
  planningModel: string
  keywords: string[]
  mcpServer: string
  mcpTools: string[]
}

const defaultForm = (): FormState => ({
  name: '',
  description: '',
  systemPrompt: '',
  executionMode: 'direct',
  allowedTools: [],
  preset: '',
  planningModel: '',
  keywords: [],
  mcpServer: '',
  mcpTools: [],
})

const form = ref<FormState>(defaultForm())

watch(() => [props.initialData, props.show], ([data]) => {
  if (props.editMode && data) {
    const d = data as Partial<SkillDetail>
    form.value = {
      name: d.name ?? '',
      description: d.description ?? '',
      systemPrompt: d.instructions ?? '',
      executionMode: d.executionMode ?? 'direct',
      allowedTools: d.allowedTools ?? [],
      preset: d.preset ?? '',
      planningModel: d.planningModel ?? '',
      keywords: d.keywords ?? [],
      mcpServer: d.mcpServer ?? '',
      mcpTools: d.mcpTools ?? [],
    }
  }
}, { immediate: true })

watch(showModal, (val) => {
  if (!val && !props.editMode) {
    form.value = defaultForm()
    formRef.value?.restoreValidation()
  }
})

const executionModeOptions = [
  { label: 'Direct（直接对话）', value: 'direct' },
  { label: 'Plan（自动规划）', value: 'plan' },
  { label: 'Workflow（工作流）', value: 'workflow' },
]

const createRules = {
  name: { required: true, trigger: ['blur', 'input'], message: '请输入技能名称' },
  description: { required: true, trigger: ['blur', 'input'], message: '请输入技能描述' },
  systemPrompt: { required: true, trigger: ['blur', 'input'], message: '请输入系统提示词' },
}

const editRules = {
  description: { required: true, trigger: ['blur', 'input'], message: '请输入技能描述' },
}

function handleSubmit() {
  formRef.value?.validate((errors) => {
    if (errors)
      return
    const payload = {
      ...(props.editMode ? {} : { name: form.value.name }),
      description: form.value.description,
      systemPrompt: form.value.systemPrompt,
      executionMode: form.value.executionMode,
      allowedTools: form.value.allowedTools.length > 0 ? form.value.allowedTools : undefined,
      preset: form.value.preset || undefined,
      planningModel: form.value.planningModel || undefined,
      keywords: form.value.keywords.length ? form.value.keywords : undefined,
      mcpServer: form.value.mcpServer || undefined,
      mcpTools: form.value.mcpTools.length ? form.value.mcpTools : undefined,
    }
    emit('submit', payload)
    showModal.value = false
  })
}
</script>

<template>
  <NModal v-model:show="showModal" preset="card" :style="{ width: '680px', maxWidth: '95vw' }">
    <template #header>
      {{ editMode ? `编辑技能 - ${initialData.name}` : '创建技能' }}
    </template>

    <NForm
      ref="formRef"
      :model="form"
      :rules="editMode ? editRules : createRules"
      label-placement="top"
    >
      <NGrid :cols="24" :x-gap="12" :y-gap="4">
        <NFormItemGridItem v-if="!editMode" :span="24" label="技能名称 (英文，不含空格)" path="name">
          <NInput v-model:value="form.name" placeholder="例：my-assistant" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="24" label="技能描述" path="description">
          <NInput v-model:value="form.description" placeholder="简要说明此技能的用途，也作为 Agent 选择技能的依据" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="12" label="执行模式" path="executionMode">
          <NSelect v-model:value="form.executionMode" :options="executionModeOptions" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="12" label="绑定预设 (可选)" path="preset">
          <NSelect
            v-model:value="form.preset"
            :options="presetOptions ?? []"
            placeholder="选择预设"
            clearable
          />
        </NFormItemGridItem>

        <NFormItemGridItem v-if="form.executionMode === 'plan'" :span="24" label="规划模型 (可选)" path="planningModel">
          <NInput v-model:value="form.planningModel" placeholder="留空使用默认模型" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="24" label="允许使用的工具 (可选，空则不限制)" path="allowedTools">
          <NDynamicTags v-model:value="form.allowedTools" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="24" label="匹配关键词（可选）">
          <NDynamicTags v-model:value="form.keywords" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="12" label="关联 MCP Server（可选）">
          <NSelect v-model:value="form.mcpServer" :options="mcpServerOptions ?? []" clearable placeholder="此 Skill 激活的 MCP" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="12" label="默认启用 MCP 工具">
          <NDynamicTags v-model:value="form.mcpTools" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="24" label="系统提示词 (System Prompt)" path="systemPrompt">
          <NInput
            v-model:value="form.systemPrompt"
            type="textarea"
            :rows="8"
            placeholder="编写技能的系统提示词，定义 Agent 的行为和能力边界"
          />
        </NFormItemGridItem>
      </NGrid>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="showModal = false">
          取消
        </NButton>
        <NButton type="primary" @click="handleSubmit">
          {{ editMode ? '保存' : '创建' }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
