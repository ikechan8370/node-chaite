<script lang="ts" setup>
import { NButton, NIcon, NProgress, NTag } from 'naive-ui'
import { AddOutline, ChatbubblesOutline, FlashOutline, PulseOutline, ServerOutline, StatsChartOutline } from '@vicons/ionicons5'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchSystemInfo } from '@/service'
import { fetchChannelList } from '@/service/api/channels'
import { fetchPresetList } from '@/service/api/presets'
import { fetchLogs, fetchLogsStats } from '@/service/api/logs'
import type { LogsStats, OperationLog } from '@/service/api/logs'

const router = useRouter()
const loading = ref(true)
const systemInfo = ref<Entity.SystemInfo>()
const channelTotal = ref(0)
const enabledChannels = ref(0)
const presetTotal = ref(0)
const stats = ref<LogsStats>()
const recentLogs = ref<OperationLog[]>([])
const health = computed(() => channelTotal.value ? Math.round(enabledChannels.value / channelTotal.value * 100) : 0)
const cards = computed(() => [
  { label: '渠道', value: channelTotal.value, hint: `${enabledChannels.value} 个正在服务`, icon: ServerOutline, route: '/channels' },
  { label: '预设', value: presetTotal.value, hint: '角色与群聊配置', icon: ChatbubblesOutline, route: '/chat-preset' },
  { label: '24h 调用', value: stats.value?.byType?.['llm.call'] ?? 0, hint: `${(stats.value?.totalTokens ?? 0).toLocaleString()} tokens`, icon: FlashOutline, route: '/logs' },
  { label: '平均延迟', value: `${stats.value?.avgLlmDurationMs ?? 0}ms`, hint: `错误率 ${((stats.value?.errorRate ?? 0) * 100).toFixed(1)}%`, icon: PulseOutline, route: '/logs' },
])

async function load() {
  loading.value = true
  try {
    const [sys, channels, presets, logStats, logs] = await Promise.all([
      fetchSystemInfo(), fetchChannelList({ pageSize: 100 }), fetchPresetList({ pageSize: 100 }), fetchLogsStats(), fetchLogs({ pageSize: 8 }),
    ])
    if (sys.isSuccess) systemInfo.value = sys.data
    const channelPayload: any = channels.data
    const channelItems: any[] = channelPayload?.items || channelPayload || []
    channelTotal.value = channelItems.length
    enabledChannels.value = channelItems.filter((item: any) => item.status === 'enabled').length
    const presetPayload: any = presets.data
    const presetItems: any[] = presetPayload?.items || presetPayload || []
    presetTotal.value = presetItems.length
    if (logStats.code === 0) stats.value = logStats.data
    if (logs.code === 0) recentLogs.value = logs.data.items
  }
  finally { loading.value = false }
}
onMounted(load)
function restartTour() { window.dispatchEvent(new Event('chaite:start-tour')) }
</script>

<template>
  <div class="chaite-page cockpit">
    <section class="hero chaite-panel" data-tour="dashboard">
      <div>
        <div class="eyebrow"><span class="live-dot" /> CHAITE CONSOLE · {{ systemInfo?.version || 'LOCAL' }}</div>
        <h1>群聊 AI，一切就绪。</h1>
        <p>从这里掌握渠道健康、模型用量与最近异常，快速进入最常用的配置。</p>
        <div class="hero-actions">
          <NButton type="primary" size="large" @click="router.push('/quick-setup')"><template #icon><NIcon :component="AddOutline" /></template>快速接入模型</NButton>
          <NButton size="large" secondary @click="router.push('/chat-preset')">创建预设</NButton>
          <NButton text @click="restartTour">查看新手引导</NButton>
        </div>
      </div>
      <div class="health-ring">
        <NProgress type="circle" :percentage="health" :stroke-width="7" :status="health > 70 ? 'success' : health ? 'warning' : 'error'" />
        <span>渠道可用率</span>
      </div>
    </section>

    <section class="metric-grid">
      <button v-for="card in cards" :key="card.label" class="metric chaite-panel" @click="router.push(card.route)">
        <NIcon :component="card.icon" size="24" class="metric-icon" />
        <div class="chaite-metric-label">{{ card.label }}</div><strong>{{ card.value }}</strong><small>{{ card.hint }}</small>
      </button>
    </section>

    <section class="main-grid">
      <div class="chaite-panel activity">
        <div class="section-title"><div><h2>最近活动</h2><p>模型、工具和群聊能力的真实调用记录</p></div><NButton text type="primary" @click="router.push('/logs')">查看全部</NButton></div>
        <div v-if="!recentLogs.length" class="empty">还没有使用记录。完成一次对话后，这里会出现详细数据。</div>
        <div v-for="item in recentLogs" :key="item.id" class="activity-row">
          <div class="activity-icon"><NIcon :component="StatsChartOutline" /></div>
          <div class="activity-copy"><strong>{{ item.summary }}</strong><span>{{ item.channelName || item.model || item.presetName || '系统' }} · {{ new Date(item.timestamp).toLocaleString() }}</span></div>
          <NTag size="small" :type="item.level === 'error' ? 'error' : 'default'" :bordered="false">{{ item.level === 'error' ? '异常' : `${item.durationMs ?? 0} ms` }}</NTag>
        </div>
      </div>
      <aside class="chaite-panel quick">
        <div class="section-title"><div><h2>快速管理</h2><p>高频入口</p></div></div>
        <button @click="router.push('/channels')"><b>渠道池</b><span>测试、启停与调整优先级</span></button>
        <button @click="router.push('/chat-preset')"><b>预设库</b><span>搜索、复制和维护角色</span></button>
        <button @click="router.push('/tools')"><b>工具与分组</b><span>组织模型可调用的能力</span></button>
        <button @click="router.push('/config')"><b>系统配置</b><span>对话、视觉、记忆与服务</span></button>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.cockpit { display: grid; gap: 16px; }
.hero { padding: clamp(24px, 4vw, 46px); display: flex; justify-content: space-between; align-items: center; background: radial-gradient(circle at 85% 20%, rgba(22,184,200,.18), transparent 28%), radial-gradient(circle at 10% 90%, rgba(109,93,252,.18), transparent 35%), var(--chaite-surface); }
.eyebrow { color: var(--chaite-muted); font-size: 12px; font-weight: 700; letter-spacing: .12em; }.live-dot { display: inline-block; width: 8px; height: 8px; margin-right: 7px; border-radius: 50%; background: #2ecb8c; box-shadow: 0 0 0 6px rgba(46,203,140,.12); }
.hero h1 { margin: 14px 0 10px; font-size: clamp(32px, 5vw, 56px); letter-spacing: -.055em; }.hero p { max-width: 660px; color: var(--chaite-muted); font-size: 16px; }.hero-actions { display: flex; gap: 10px; margin-top: 24px; }.health-ring { display: grid; justify-items: center; gap: 10px; padding: 10px 28px; color: var(--chaite-muted); }
.metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }.metric { position: relative; padding: 20px; border: 1px solid var(--chaite-border); color: inherit; text-align: left; cursor: pointer; transition: .2s ease; }.metric:hover { transform: translateY(-3px); border-color: rgba(109,93,252,.35); }.metric strong { display: block; margin-top: 8px; font-size: 29px; }.metric small { color: var(--chaite-muted); }.metric-icon { float: right; color: var(--chaite-accent); }
.main-grid { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(270px, .7fr); gap: 16px; }.activity,.quick { padding: 20px; }.section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 13px; }.section-title h2 { margin: 0; }.section-title p { margin: 4px 0 0; color: var(--chaite-muted); }.activity-row { display: grid; grid-template-columns: 38px 1fr auto; gap: 11px; align-items: center; padding: 12px 4px; border-top: 1px solid var(--chaite-border); }.activity-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 11px; background: rgba(109,93,252,.1); color: var(--chaite-accent); }.activity-copy { display: grid; }.activity-copy span,.empty { color: var(--chaite-muted); font-size: 12px; }.empty { padding: 34px 10px; text-align: center; }.quick button { width: 100%; display: grid; gap: 3px; padding: 15px 2px; border: 0; border-top: 1px solid var(--chaite-border); background: none; color: inherit; text-align: left; cursor: pointer; }.quick button:hover b { color: var(--chaite-accent); }.quick span { color: var(--chaite-muted); font-size: 12px; }
@media (max-width: 1000px) { .metric-grid { grid-template-columns: repeat(2, 1fr); }.main-grid { grid-template-columns: 1fr; }.health-ring { display: none; } }
@media (max-width: 560px) { .metric-grid { grid-template-columns: 1fr; }.hero-actions { flex-wrap: wrap; } }
</style>
