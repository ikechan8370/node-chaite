<script lang="ts" setup>
import { NAlert, NButton, NCode, NForm, NFormItem, NInput, NInputNumber, NModal, NSelect, NSwitch, useMessage } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { fetchToolTestSchema, testTool } from '@/service/api/tools'
import type { ToolTestSchema } from '@/service/api/tools'

const props = defineProps<{ show: boolean; tool?: Shareable.ToolModel }>()
const emit = defineEmits<{ 'update:show': [value: boolean] }>()
const message = useMessage()
const schema = ref<ToolTestSchema>()
const loading = ref(false)
const running = ref(false)
const args = reactive<Record<string, any>>({})
const userId = ref('console-test')
const groupId = ref('')
const result = ref<{ result: string; durationMs: number }>()
const required = computed(() => new Set(schema.value?.parameters.required || []))
const properties = computed(() => Object.entries(schema.value?.parameters.properties || {}))

function resetArgs() {
  Object.keys(args).forEach(key => delete args[key])
  properties.value.forEach(([name, prop]) => { args[name] = prop.type === 'boolean' ? false : prop.type === 'number' ? 0 : '' })
}
async function load() {
  if (!props.show || !props.tool?.id) return
  loading.value = true; result.value = undefined
  try { const rsp = await fetchToolTestSchema(props.tool.id); if (rsp.code === 0) { schema.value = rsp.data; resetArgs() } else message.error(rsp.message || '无法读取工具参数') }
  catch { message.error('无法读取工具参数') }
  finally { loading.value = false }
}
function normalizedArgs() {
  const output: Record<string, unknown> = {}
  for (const [name, prop] of properties.value) {
    const value = args[name]
    if ((prop.type === 'array' || prop.type === 'object') && typeof value === 'string') {
      if (!value.trim()) { output[name] = prop.type === 'array' ? [] : {}; continue }
      output[name] = JSON.parse(value)
    } else output[name] = value
  }
  return output
}
async function run() {
  if (!props.tool?.id) return
  try {
    const payload = normalizedArgs()
    for (const name of required.value) if (payload[name] === '' || payload[name] == null) throw new Error(`请填写必填参数：${name}`)
    running.value = true
    const rsp = await testTool(props.tool.id, { args: payload, userId: userId.value || undefined, groupId: groupId.value || undefined })
    if (rsp.code === 0) result.value = rsp.data
    else message.error(rsp.message || '工具执行失败')
  } catch (error) { message.error(error instanceof Error ? error.message : '参数无效') }
  finally { running.value = false }
}
watch(() => props.show, load)
</script>
<template>
  <NModal :show="show" preset="card" title="工具测试" style="width: min(900px, calc(100vw - 32px))" @update:show="emit('update:show', $event)">
    <NAlert type="info" :show-icon="false" style="margin-bottom: 16px">使用当前 chatgpt-plugin 进程中已经加载的 <b>{{ tool?.name }}</b> 执行。请勿用真实敏感数据测试会产生外部副作用的工具。</NAlert>
    <div v-if="loading">正在读取工具定义…</div>
    <template v-else-if="schema">
      <p class="desc">{{ schema.description || '该工具未提供说明。' }}</p>
      <NForm label-placement="top"><div class="grid">
        <NFormItem v-for="[name, prop] in properties" :key="name" :label="`${name}${required.has(name) ? ' *' : ''}`" :feedback="prop.description || undefined">
          <NSwitch v-if="prop.type === 'boolean'" v-model:value="args[name]" />
          <NInputNumber v-else-if="prop.type === 'number'" v-model:value="args[name]" style="width: 100%" />
          <NInput v-else v-model:value="args[name]" :type="prop.type === 'array' || prop.type === 'object' ? 'textarea' : 'text'" :placeholder="prop.type === 'array' || prop.type === 'object' ? `输入 JSON ${prop.type}` : `输入 ${name}`" />
        </NFormItem>
      </div><div class="grid context"><NFormItem label="测试用户 QQ（可选）"><NInput v-model:value="userId" /></NFormItem><NFormItem label="测试群号（可选）"><NInput v-model:value="groupId" /></NFormItem></div></NForm>
      <NButton type="primary" :loading="running" @click="run">真实运行工具</NButton>
      <div v-if="result" class="result"><div>执行完成 · {{ result.durationMs }} ms</div><NCode :code="result.result" language="json" word-wrap /></div>
    </template>
  </NModal>
</template>
<style scoped>.grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 0 14px; }.context { margin-top: 8px; }.desc { color: var(--chaite-muted); }.result { margin-top: 18px; padding: 14px; border-radius: 12px; background: rgba(109,93,252,.06); } @media(max-width:600px){.grid{grid-template-columns:1fr}}</style>
