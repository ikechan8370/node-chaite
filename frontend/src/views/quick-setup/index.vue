<script lang="ts" setup>
import { NAlert, NButton, NCheckbox, NCheckboxGroup, NForm, NFormItem, NInput, NInputNumber, NRadioButton, NRadioGroup, NSelect, NSteps, NStep, useMessage } from 'naive-ui'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { createChanel, fetchChannelDetail, testChannel } from '@/service/api/channels'
import { createPreset, deletePreset } from '@/service/api/presets'
import { fetchAllProcessorList } from '@/service/api/processors'
import { fetchAllToolGroupList } from '@/service/api/toolGroup'
import { fetchConfig, saveConfig } from '@/service/api/config'

const message = useMessage()
const router = useRouter()
const route = useRoute()
const existingChannelId = ref('')
const step = ref(1)
const submitting = ref(false)
const testText = ref('')
const processors = ref<Shareable.ProcessorModel[]>([])
const toolGroups = ref<Shareable.ToolsGroupModel[]>([])
const form = reactive({
  adapterType: 'openai' as Shareable.ClientType,
  channelName: '', baseUrl: '', apiKey: '', model: '',
  features: ['chat', 'tool'] as Shareable.Feature[], priority: 1, weight: 1,
  presetName: '', prefix: '', systemPrompt: '你是一个活跃在 QQ 群聊中的 AI 助手。自然、友善地参与讨论。',
  temperature: 0.8, maxToken: 4096, groupContext: true,
  preProcessorIds: [] as string[], postProcessorIds: [] as string[], toolGroupIds: [] as string[],
  applyDefault: true, enableBym: false, bymProbability: 0.02,
})
const processorOptions = computed(() => processors.value.map(item => ({ label: `${item.type === 'pre' ? '前置' : '后置'} · ${item.name}`, value: item.id! })))
const toolOptions = computed(() => toolGroups.value.map(item => ({ label: item.name, value: item.id! })))

function defaultsForAdapter(type: Shareable.ClientType) {
  form.adapterType = type
  if (!form.baseUrl || ['https://api.openai.com/v1', 'https://generativelanguage.googleapis.com', 'https://api.anthropic.com'].includes(form.baseUrl)) {
    form.baseUrl = type === 'openai' ? 'https://api.openai.com/v1' : type === 'gemini' ? 'https://generativelanguage.googleapis.com' : 'https://api.anthropic.com'
  }
}

async function finish() {
  if (!form.channelName || !form.baseUrl || !form.apiKey || !form.model || !form.presetName) {
    message.warning('请填写渠道、连接、模型和预设名称')
    return
  }
  submitting.value = true
  let channelId = ''
  let presetId = ''
  try {
    step.value = 2
    const preProcessorIds = form.preProcessorIds.filter(id => processors.value.find(item => item.id === id)?.type === 'pre')
    const postProcessorIds = form.postProcessorIds.filter(id => processors.value.find(item => item.id === id)?.type === 'post')
    const channelRsp = existingChannelId.value ? { code: 0, data: { id: existingChannelId.value } } : await createChanel({
      name: form.channelName, description: '通过快速接入向导创建', modelType: 'settings', embedded: false,
      adapterType: form.adapterType, type: form.adapterType, status: 'enabled', priority: form.priority, weight: form.weight,
      models: [{ name: form.model, features: form.features }],
      options: { baseUrl: form.baseUrl, apiKey: form.apiKey, features: form.features, preProcessorIds, postProcessorIds },
    } as Shareable.ChannelModel)
    if (channelRsp.code !== 0) throw new Error(channelRsp.message || '渠道创建失败')
    channelId = channelRsp.data.id
    const testRsp = await testChannel({ id: channelId, model: form.model })
    if (!testRsp.data?.success) throw new Error(`渠道测试失败：${testRsp.data?.error || '未知错误'}`)
    testText.value = `连接成功，耗时 ${testRsp.data.elapsed}ms`

    const presetRsp = await createPreset({
      name: form.presetName, description: `使用 ${form.channelName} / ${form.model}`, modelType: 'settings', embedded: false,
      local: true, prefix: form.prefix, groupContext: form.groupContext ? 'enabled' : 'disable',
      sendMessageOption: { model: form.model, systemOverride: form.systemPrompt, temperature: form.temperature, maxToken: form.maxToken, toolGroupId: form.toolGroupIds },
    } as Shareable.PresetModel)
    if (presetRsp.code !== 0) throw new Error(presetRsp.message || '预设创建失败')
    presetId = presetRsp.data.id

    if (form.applyDefault || form.enableBym) {
      const configRsp = await fetchConfig()
      if (configRsp.code !== 0) throw new Error(configRsp.message || '插件配置读取失败')
      const config: any = configRsp.data
      if (form.applyDefault) {
        config.llm = { ...(config.llm || {}), defaultModel: form.model, defaultChatPresetId: presetId }
      }
      if (form.enableBym) {
        config.bym = { ...(config.bym || {}), enable: true, defaultPreset: presetId, probability: form.bymProbability }
      }
      const saveRsp = await saveConfig(config)
      if (saveRsp.code !== 0) throw new Error(saveRsp.message || '群聊配置保存失败')
    }
    step.value = 3
    message.success('接入完成，新模型已经可以用于群聊')
  }
  catch (error) {
    // Keep a failed channel for diagnosis, but do not leave an incomplete preset.
    if (presetId) await deletePreset(presetId).catch(() => undefined)
    message.error(error instanceof Error ? error.message : '接入失败')
    step.value = channelId ? 2 : 1
  }
  finally { submitting.value = false }
}

onMounted(async () => {
  defaultsForAdapter('openai')
  const [allProcessors, allToolGroups] = await Promise.all([fetchAllProcessorList(), fetchAllToolGroupList()])
  processors.value = allProcessors
  toolGroups.value = allToolGroups
  if (typeof route.query.channelId === 'string') {
    const rsp = await fetchChannelDetail(route.query.channelId)
    if (rsp.code === 0) {
      const channel = rsp.data
      existingChannelId.value = channel.id || ''
      form.channelName = channel.name
      form.adapterType = channel.adapterType
      form.baseUrl = channel.options.baseUrl
      form.apiKey = Array.isArray(channel.options.apiKey) ? channel.options.apiKey[0] || '' : channel.options.apiKey
      form.model = channel.models[0]?.name || ''
      form.features = channel.models[0]?.features || ['chat']
      form.priority = channel.priority
      form.weight = channel.weight
      form.presetName = `${channel.name} 预设`
    }
  }
})
</script>

<template>
  <div class="chaite-page setup-page">
    <header class="chaite-page-header"><div><h1>快速接入</h1><p>把一个 API、模型和 Key 一次配置成群聊中可直接使用的预设。</p></div></header>
    <NSteps :current="step" class="steps"><NStep title="填写接入信息" /><NStep title="创建并测试" /><NStep title="群聊可用" /></NSteps>

    <div v-if="step < 3" class="setup-grid">
      <section class="chaite-panel form-panel" data-tour="quick-setup">
        <div class="section-head"><span>01</span><div><h2>模型渠道</h2><p>只填写分享者给你的内容，其余可以保持默认。</p></div></div>
        <NForm label-placement="top">
          <NFormItem label="接口类型"><NRadioGroup :value="form.adapterType" @update:value="defaultsForAdapter"><NRadioButton value="openai">OpenAI 兼容</NRadioButton><NRadioButton value="gemini">Gemini</NRadioButton><NRadioButton value="claude">Claude</NRadioButton></NRadioGroup></NFormItem>
          <div class="two"><NFormItem label="渠道名称"><NInput v-model:value="form.channelName" placeholder="例如：群友分享的公益站" /></NFormItem><NFormItem label="模型名称"><NInput v-model:value="form.model" placeholder="例如：gpt-4o-mini" /></NFormItem></div>
          <NFormItem label="API 地址"><NInput v-model:value="form.baseUrl" /></NFormItem>
          <NFormItem label="API Key"><NInput v-model:value="form.apiKey" type="password" show-password-on="click" placeholder="仅保存在你的机器人服务器" /></NFormItem>
          <NFormItem label="模型能力"><NCheckboxGroup v-model:value="form.features"><NCheckbox value="chat" disabled>对话</NCheckbox><NCheckbox value="tool">工具</NCheckbox><NCheckbox value="visual">图片</NCheckbox></NCheckboxGroup></NFormItem>
          <div class="two"><NFormItem label="优先级"><NInputNumber v-model:value="form.priority" :min="0" /></NFormItem><NFormItem label="权重"><NInputNumber v-model:value="form.weight" :min="1" /></NFormItem></div>
        </NForm>
      </section>

      <section class="chaite-panel form-panel">
        <div class="section-head"><span>02</span><div><h2>预设与群聊</h2><p>无需记住模型名称或离开本页。</p></div></div>
        <NForm label-placement="top">
          <div class="two"><NFormItem label="预设名称"><NInput v-model:value="form.presetName" placeholder="例如：群聊小助手" /></NFormItem><NFormItem label="触发前缀（可选）"><NInput v-model:value="form.prefix" placeholder="例如：小助手" /></NFormItem></div>
          <NFormItem label="角色设定"><NInput v-model:value="form.systemPrompt" type="textarea" :autosize="{ minRows: 5, maxRows: 10 }" /></NFormItem>
          <div class="two"><NFormItem label="温度"><NInputNumber v-model:value="form.temperature" :min="0" :max="2" :step="0.1" /></NFormItem><NFormItem label="最大输出"><NInputNumber v-model:value="form.maxToken" :min="1" /></NFormItem></div>
          <NFormItem label="处理器"><NSelect v-model:value="form.preProcessorIds" multiple clearable :options="processorOptions" placeholder="可选：选择消息处理器" @update:value="value => { form.preProcessorIds = value; form.postProcessorIds = value }" /></NFormItem>
          <NFormItem label="工具组"><NSelect v-model:value="form.toolGroupIds" multiple clearable :options="toolOptions" placeholder="可选：让模型使用工具" /></NFormItem>
          <div class="checks"><NCheckbox v-model:checked="form.groupContext">携带群聊上下文</NCheckbox><NCheckbox v-model:checked="form.applyDefault">设为默认对话预设</NCheckbox><NCheckbox v-model:checked="form.enableBym">立即用于伪人模式</NCheckbox></div>
          <NFormItem v-if="form.enableBym" label="伪人触发概率"><NInputNumber v-model:value="form.bymProbability" :min="0" :max="1" :step="0.01" /></NFormItem>
        </NForm>
        <NAlert v-if="testText" type="success" :show-icon="true" class="result">{{ testText }}</NAlert>
        <NButton type="primary" size="large" block :loading="submitting" @click="finish">创建渠道、测试并应用到群聊</NButton>
      </section>
    </div>

    <section v-else class="chaite-panel success-card">
      <div class="success-icon">✓</div><h2>接入完成</h2><p>{{ form.channelName }} 的 {{ form.model }} 已创建为“{{ form.presetName }}”。</p>
      <div><NButton type="primary" @click="router.push('/chat-preset')">查看预设</NButton><NButton secondary @click="router.push('/dashboard')">返回驾驶台</NButton></div>
    </section>
  </div>
</template>

<style scoped>
.setup-page { max-width: 1320px; }.steps { max-width: 760px; margin: 0 auto 26px; }.setup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }.form-panel { padding: 24px; }.section-head { display: flex; gap: 13px; margin-bottom: 20px; }.section-head > span { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 12px; color: white; background: linear-gradient(135deg, var(--chaite-accent), var(--chaite-cyan)); font-weight: 800; }.section-head h2 { margin: 0; }.section-head p { margin: 3px 0 0; color: var(--chaite-muted); }.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }.checks { display: flex; flex-wrap: wrap; gap: 16px; margin: 4px 0 20px; }.result { margin-bottom: 14px; }.success-card { max-width: 620px; margin: 40px auto; padding: 50px; text-align: center; }.success-icon { width: 72px; height: 72px; display: grid; place-items: center; margin: auto; border-radius: 50%; background: #2ecb8c; color: white; font-size: 38px; }.success-card div:last-child { display: flex; justify-content: center; gap: 10px; margin-top: 24px; }
@media (max-width: 900px) { .setup-grid { grid-template-columns: 1fr; } } @media (max-width: 560px) { .two { grid-template-columns: 1fr; } }
</style>
