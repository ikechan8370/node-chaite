<script lang="ts" setup>
import { NAlert, NButton, NCode, NDynamicInput, NForm, NFormItem, NInput, NModal, NSelect, NSwitch, NTabs, NTabPane, useMessage } from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { testProcessor } from '@/service/api/processors'

const props = defineProps<{ show: boolean; processor?: Shareable.ProcessorModel }>()
const emit = defineEmits<{ 'update:show': [value: boolean] }>()
const message = useMessage()
const running = ref(false)
const mode = ref<'text' | 'image' | 'mixed'>('text')
const text = ref('你好，这是管理面板构造的测试消息。')
const image = ref('https://example.com/test-image.png')
const historyText = ref('')
const userId = ref('console-test')
const groupId = ref('')
const result = ref<any>()
const isPre = computed(() => props.processor?.type === 'pre')
const role = computed(() => isPre.value ? 'user' : 'assistant')

function buildContent() {
  const output: any[] = []
  if (mode.value !== 'image' && text.value) output.push({ type: 'text', text: text.value })
  if (mode.value !== 'text' && image.value) output.push({ type: 'image', image: image.value })
  return output
}
function parseHistory() {
  if (!historyText.value.trim()) return []
  const parsed = JSON.parse(historyText.value)
  if (!Array.isArray(parsed)) throw new Error('历史消息必须是 JSON 数组')
  return parsed
}
async function run() {
  if (!props.processor?.id) return
  try {
    running.value = true; result.value = undefined
    const rsp = await testProcessor(props.processor.id, { message: { role: role.value, content: buildContent() }, history: parseHistory(), userId: userId.value || undefined, groupId: groupId.value || undefined })
    if (rsp.code === 0) result.value = rsp.data
    else message.error(rsp.message || '处理器执行失败')
  } catch (error) { message.error(error instanceof Error ? error.message : '测试消息无效') }
  finally { running.value = false }
}
watch(() => props.show, value => { if (value) result.value = undefined })
</script>
<template>
  <NModal :show="show" preset="card" title="处理器测试台" style="width: min(980px, calc(100vw - 32px))" @update:show="emit('update:show', $event)">
    <NAlert type="info" :show-icon="false" style="margin-bottom: 16px">正在测试 <b>{{ processor?.name }}</b>（{{ isPre ? '前处理器：UserMessage' : '后处理器：AssistantMessage' }}）。消息会在真实插件运行时执行，但不会发送给模型或 QQ。</NAlert>
    <NForm label-placement="top"><div class="grid">
      <NFormItem label="内置消息样例"><NSelect v-model:value="mode" :options="[{label:'纯文本',value:'text'},{label:'图片消息',value:'image'},{label:'文本 + 图片',value:'mixed'}]" /></NFormItem>
      <NFormItem label="测试用户 / 群号"><div class="context"><NInput v-model:value="userId" placeholder="用户 QQ" /><NInput v-model:value="groupId" placeholder="群号（可选）" /></div></NFormItem>
    </div>
    <NFormItem v-if="mode !== 'image'" :label="isPre ? '用户消息文本' : '助手回复文本'"><NInput v-model:value="text" type="textarea" :autosize="{minRows:4,maxRows:8}" /></NFormItem>
    <NFormItem v-if="mode !== 'text'" label="图片 URL"><NInput v-model:value="image" placeholder="https://..." /></NFormItem>
    <NFormItem label="多轮历史（可选 JSON 数组）"><NInput v-model:value="historyText" type="textarea" placeholder='[ {"role":"user","content":[{"type":"text","text":"上一句"}]} ]' :autosize="{minRows:3,maxRows:6}" /></NFormItem>
    </NForm>
    <NButton type="primary" :loading="running" @click="run">执行处理器</NButton>
    <div v-if="result" class="compare"><div><h3>输入</h3><NCode :code="JSON.stringify(result.before, null, 2)" language="json" word-wrap /></div><div><h3>输出 · {{ result.durationMs }} ms</h3><NCode :code="JSON.stringify(result.after, null, 2)" language="json" word-wrap /></div></div>
  </NModal>
</template>
<style scoped>.grid,.context,.compare{display:grid;gap:14px}.grid{grid-template-columns:1fr 1fr}.context{grid-template-columns:1fr 1fr;width:100%}.compare{grid-template-columns:1fr 1fr;margin-top:18px}.compare>div{padding:12px;border-radius:12px;background:rgba(109,93,252,.06);min-width:0}.compare h3{margin:0 0 8px}@media(max-width:700px){.grid,.context,.compare{grid-template-columns:1fr}}</style>
