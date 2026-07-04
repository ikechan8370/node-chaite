<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  NButton,
  NForm,
  NFormItemGridItem,
  NGrid,
  NInput,
  NInputNumber,
  NModal,
  NSpace,
  NSwitch,
} from 'naive-ui'
import type { FormInst } from 'naive-ui'
import type { CreateMcpServerDTO, McpServerConfig } from '@/service/api/agent'

const props = defineProps<{
  show: boolean
  editMode: boolean
  initialData: Partial<McpServerConfig>
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'submit', data: CreateMcpServerDTO): void
}>()

const formRef = ref<FormInst | null>(null)

const showModal = computed({
  get: () => props.show,
  set: val => emit('update:show', val),
})

const defaultForm = (): CreateMcpServerDTO => ({
  name: '',
  description: '',
  baseUrl: '',
  authHeader: '',
  timeoutMs: 10000,
  enabled: true,
})

const form = ref<CreateMcpServerDTO>(defaultForm())

watch(() => props.initialData, (val) => {
  if (props.editMode && val) {
    form.value = {
      name: val.name ?? '',
      description: val.description ?? '',
      baseUrl: val.baseUrl ?? '',
      authHeader: val.authHeader ?? '',
      timeoutMs: val.timeoutMs ?? 10000,
      enabled: val.enabled ?? true,
    }
  }
}, { immediate: true })

watch(showModal, (val) => {
  if (!val && !props.editMode) {
    form.value = defaultForm()
    formRef.value?.restoreValidation()
  }
})

const rules = {
  name: { required: true, trigger: ['blur', 'input'], message: '请输入服务器名称' },
  baseUrl: { required: true, trigger: ['blur', 'input'], message: '请输入服务器地址' },
}

function handleSubmit() {
  formRef.value?.validate((errors) => {
    if (errors)
      return
    emit('submit', { ...form.value })
    showModal.value = false
  })
}
</script>

<template>
  <NModal v-model:show="showModal" preset="card" :style="{ width: '580px', maxWidth: '95vw' }">
    <template #header>
      {{ editMode ? '编辑 MCP 服务器' : '添加 MCP 服务器' }}
    </template>

    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <NGrid :cols="24" :x-gap="12" :y-gap="4">
        <NFormItemGridItem :span="24" label="名称" path="name">
          <NInput v-model:value="form.name" placeholder="唯一标识名称，如 my-mcp-server" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="24" label="服务器地址 (Base URL)" path="baseUrl">
          <NInput v-model:value="form.baseUrl" placeholder="http://localhost:3000" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="24" label="认证 Header (可选)" path="authHeader">
          <NInput
            v-model:value="form.authHeader"
            placeholder="Bearer your-token-here"
            type="password"
            show-password-on="click"
          />
        </NFormItemGridItem>

        <NFormItemGridItem :span="12" label="超时 (ms)" path="timeoutMs">
          <NInputNumber v-model:value="form.timeoutMs" :min="1000" :max="120000" :step="1000" style="width: 100%" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="12" label="状态" path="enabled">
          <NSpace align="center" style="height: 34px">
            <NSwitch v-model:value="form.enabled" />
            <span style="font-size: 13px; color: var(--n-text-color)">{{ form.enabled ? '启用' : '禁用' }}</span>
          </NSpace>
        </NFormItemGridItem>

        <NFormItemGridItem :span="24" label="描述 (可选)" path="description">
          <NInput v-model:value="form.description" type="textarea" :rows="2" placeholder="简要描述此 MCP 服务器的用途" />
        </NFormItemGridItem>
      </NGrid>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="showModal = false">
          取消
        </NButton>
        <NButton type="primary" @click="handleSubmit">
          {{ editMode ? '保存' : '添加' }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
