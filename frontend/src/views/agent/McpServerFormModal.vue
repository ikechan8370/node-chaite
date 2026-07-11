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
  NSelect,
  NSpace,
  NSwitch,
} from 'naive-ui'
import type { FormInst } from 'naive-ui'
import type { CreateMcpServerDTO, McpServerConfig } from '@/service/api/agent'

const props = defineProps<{
  show: boolean
  editMode: boolean
  initialData: Partial<McpServerConfig>
  toolGroupOptions?: Array<{ label: string; value: string }>
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
  transport: 'streamable-http',
  url: '',
  headers: {},
  command: '',
  args: [],
  env: {},
  cwd: '',
  toolGroupIds: [],
  timeoutMs: 10000,
  enabled: true,
})

const form = ref<CreateMcpServerDTO>(defaultForm())

watch(() => props.initialData, (val) => {
  if (props.editMode && val) {
    form.value = {
      name: val.name ?? '',
      description: val.description ?? '',
      transport: val.transport ?? 'streamable-http',
      url: val.url ?? val.baseUrl ?? '',
      headers: val.headers ?? (val.authHeader ? { Authorization: val.authHeader } : {}),
      command: val.command ?? '',
      args: val.args ?? [],
      env: val.env ?? {},
      cwd: val.cwd ?? '',
      toolGroupIds: val.toolGroupIds ?? [],
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
  url: { validator: () => form.value.transport === 'stdio' || Boolean(form.value.url?.trim()), trigger: ['blur', 'input'], message: '请输入服务器地址' },
  command: { validator: () => form.value.transport !== 'stdio' || Boolean(form.value.command?.trim()), trigger: ['blur', 'input'], message: '请输入启动命令' },
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

        <NFormItemGridItem :span="24" label="传输方式" path="transport">
          <NSelect v-model:value="form.transport" :options="[{ label: 'Streamable HTTP（推荐）', value: 'streamable-http' }, { label: 'SSE（兼容旧服务）', value: 'sse' }, { label: '本地 stdio 命令', value: 'stdio' }]" />
        </NFormItemGridItem>

        <NFormItemGridItem v-if="form.transport !== 'stdio'" :span="24" label="服务器地址" path="url">
          <NInput v-model:value="form.url" placeholder="https://example.com/mcp" />
        </NFormItemGridItem>

        <NFormItemGridItem v-else :span="24" label="启动命令" path="command">
          <NInput v-model:value="form.command" placeholder="npx" />
        </NFormItemGridItem>

        <NFormItemGridItem v-if="form.transport === 'stdio'" :span="24" label="命令参数（每行一个）">
          <NInput :value="(form.args || []).join('\n')" type="textarea" :rows="2" placeholder="-y\n@modelcontextprotocol/server-filesystem\n/path" @update:value="value => form.args = value.split('\n').map(item => item.trim()).filter(Boolean)" />
        </NFormItemGridItem>

        <NFormItemGridItem v-if="form.transport === 'stdio'" :span="12" label="工作目录（可选）">
          <NInput v-model:value="form.cwd" placeholder="留空使用机器人目录" />
        </NFormItemGridItem>

        <NFormItemGridItem v-if="form.transport === 'stdio'" :span="12" label="环境变量（每行 KEY=VALUE）">
          <NInput :value="Object.entries(form.env || {}).map(([key, value]) => `${key}=${value}`).join('\n')" type="textarea" :rows="2" placeholder="API_KEY=xxx" @update:value="value => form.env = Object.fromEntries(value.split('\n').map(line => line.trim()).filter(Boolean).map(line => { const index = line.indexOf('='); return index > 0 ? [line.slice(0, index), line.slice(index + 1)] : [line, ''] }))" />
        </NFormItemGridItem>

        <NFormItemGridItem v-if="form.transport !== 'stdio'" :span="24" label="Authorization（可选）">
          <NInput
            :value="form.headers?.Authorization || ''"
            placeholder="Bearer your-token-here"
            type="password"
            show-password-on="click"
            @update:value="value => form.headers = { ...(form.headers || {}), Authorization: value }"
          />
        </NFormItemGridItem>

        <NFormItemGridItem :span="24" label="关联工具组">
          <NSelect v-model:value="form.toolGroupIds" multiple :options="toolGroupOptions || []" placeholder="预设选中这些工具组时，才会启用此 MCP 的工具" />
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
