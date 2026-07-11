<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import { NButton, NDataTable, NDatePicker, NInput, NSelect, NTag, useMessage } from 'naive-ui'
import { computed, h, onMounted, reactive, ref } from 'vue'
import { clearLogs, fetchLogs, fetchLogsStats } from '@/service/api/logs'
import type { ListLogsQuery, LogsStats, OperationLog } from '@/service/api/logs'

const message = useMessage()
const loading = ref(false)
const rows = ref<OperationLog[]>([])
const total = ref(0)
const stats = ref<LogsStats>()
const range = ref<[number, number] | null>(null)
const query = reactive<ListLogsQuery>({ page: 1, pageSize: 30 })
const typeOptions = [
  ['llm.call', '模型调用'], ['tool.call', '工具调用'], ['tool.error', '工具错误'],
  ['processor.call', '处理器'], ['processor.error', '处理器错误'],
  ['trigger.call', '触发器'], ['trigger.error', '触发器错误'],
].map(([value, label]) => ({ value, label }))
const levelOptions = [{ label: '正常', value: 'info' }, { label: '警告', value: 'warn' }, { label: '错误', value: 'error' }]
const metrics = computed(() => [
  { label: '24 小时记录', value: stats.value?.last24h ?? 0 },
  { label: '累计 Token', value: (stats.value?.totalTokens ?? 0).toLocaleString() },
  { label: '平均模型耗时', value: `${stats.value?.avgLlmDurationMs ?? 0} ms` },
  { label: '错误率', value: `${((stats.value?.errorRate ?? 0) * 100).toFixed(1)}%` },
])
const columns: DataTableColumns<OperationLog> = [
  { title: '时间', key: 'timestamp', width: 168, render: row => new Date(row.timestamp).toLocaleString() },
  { title: '类型', key: 'type', width: 126, render: row => h(NTag, { size: 'small', bordered: false, type: row.level === 'error' ? 'error' : row.type === 'llm.call' ? 'info' : 'default' }, { default: () => typeOptions.find(x => x.value === row.type)?.label || row.type }) },
  { title: '摘要', key: 'summary', minWidth: 210, ellipsis: { tooltip: true } },
  { title: '渠道 / 模型', key: 'channelName', minWidth: 170, render: row => h('div', [h('div', row.channelName || row.channelId || '—'), h('small', { style: 'color: var(--chaite-muted)' }, row.model || '')]) },
  { title: '预设', key: 'presetName', width: 140, ellipsis: { tooltip: true }, render: row => row.presetName || row.presetId || '—' },
  { title: '群 / 用户', key: 'groupId', width: 150, render: row => h('div', [h('div', row.groupId ? `群 ${row.groupId}` : '私聊/系统'), h('small', { style: 'color: var(--chaite-muted)' }, row.userId ? `用户 ${row.userId}` : '')]) },
  { title: 'Usage', key: 'totalTokens', width: 145, render: row => row.type === 'llm.call' ? `${row.inputTokens || 0} + ${row.outputTokens || 0} = ${row.totalTokens ?? ((row.inputTokens || 0) + (row.outputTokens || 0))}` : '—' },
  { title: '耗时', key: 'durationMs', width: 92, render: row => row.durationMs == null ? '—' : `${row.durationMs} ms` },
]
async function load() {
  loading.value = true
  if (range.value) { query.from = range.value[0]; query.to = range.value[1] }
  else { delete query.from; delete query.to }
  try {
    const [listRsp, statsRsp] = await Promise.all([fetchLogs(query), fetchLogsStats()])
    if (listRsp.code === 0) { rows.value = listRsp.data.items; total.value = listRsp.data.total }
    if (statsRsp.code === 0) stats.value = statsRsp.data
  }
  catch { message.error('使用记录加载失败') }
  finally { loading.value = false }
}
function reset() {
  Object.assign(query, { page: 1, pageSize: 30, type: undefined, level: undefined, userId: undefined, groupId: undefined, channelId: undefined, model: undefined, presetId: undefined, keyword: undefined })
  range.value = null
  load()
}
async function clearAll() {
  const rsp = await clearLogs()
  if (rsp.code === 0) { message.success(`已清除 ${rsp.data.deleted} 条记录`); load() }
}
onMounted(load)
</script>

<template>
  <div class="chaite-page">
    <header class="chaite-page-header" data-tour="logs">
      <div><h1>使用记录</h1><p>查询模型、渠道、预设、工具、处理器与触发器的真实使用情况。</p></div>
      <NButton tertiary type="error" @click="clearAll">清除记录</NButton>
    </header>
    <div class="metrics-grid">
      <div v-for="item in metrics" :key="item.label" class="chaite-panel chaite-metric">
        <div class="chaite-metric-label">{{ item.label }}</div><div class="chaite-metric-value">{{ item.value }}</div>
      </div>
    </div>
    <section class="chaite-panel records">
      <div class="chaite-toolbar">
        <NInput v-model:value="query.keyword" clearable placeholder="搜索渠道、模型、预设或摘要" style="width: 260px" @keyup.enter="load" />
        <NSelect v-model:value="query.type" clearable :options="typeOptions" placeholder="记录类型" style="width: 150px" />
        <NSelect v-model:value="query.level" clearable :options="levelOptions" placeholder="结果" style="width: 110px" />
        <NInput v-model:value="query.groupId" clearable placeholder="群号" style="width: 130px" />
        <NInput v-model:value="query.userId" clearable placeholder="用户 QQ" style="width: 130px" />
        <NInput v-model:value="query.model" clearable placeholder="模型" style="width: 150px" />
        <NDatePicker v-model:value="range" type="datetimerange" clearable style="width: 310px" />
        <NButton type="primary" @click="query.page = 1; load()">查询</NButton>
        <NButton quaternary @click="reset">重置</NButton>
      </div>
      <NDataTable remote :loading="loading" :columns="columns" :data="rows" :row-key="row => row.id" :pagination="{ page: query.page, pageSize: query.pageSize, itemCount: total, showSizePicker: true, pageSizes: [20, 30, 50, 100], onChange: (p: number) => { query.page = p; load() }, onUpdatePageSize: (s: number) => { query.pageSize = s; query.page = 1; load() } }" />
    </section>
  </div>
</template>

<style scoped>
.metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; }
.records { overflow: hidden; }
@media (max-width: 900px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .metrics-grid { grid-template-columns: 1fr; } }
</style>
