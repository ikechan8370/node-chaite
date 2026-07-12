<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import {
  NButton,
  NFlex,
  NGrid,
  NGridItem,
  NPopconfirm,
  NSpace,
  NTag,
  NTooltip,
  useMessage,
} from 'naive-ui'
import { h, onMounted, reactive, ref } from 'vue'
import {
  cancelScheduledTask,
  createMcpServer,
  createSkill,
  deleteMcpServer,
  deleteSkill,
  fetchJobList,
  fetchMcpServerList,
  fetchScheduledTaskList,
  fetchSkillDetail,
  fetchSkillList,
  reloadSkills,
  runSkill,
  testMcpServer,
  updateMcpServer,
  updateSkill,
} from '@/service/api/agent'
import type {
  BackgroundJob,
  CreateSkillDTO,
  McpServerConfig,
  ScheduledTask,
  SkillDetail,
  SkillMeta,
  UpdateSkillDTO,
} from '@/service/api/agent'
import { fetchPresetList } from '@/service/api/presets'
import McpServerFormModal from './McpServerFormModal.vue'
import SkillFormModal from './SkillFormModal.vue'

const message = useMessage()
const route = useRoute()
const activeTab = ref(typeof route.query.tab === 'string' ? route.query.tab : 'skills')

// ─── Skills ───────────────────────────────────────────────────────────────────

const skillsData = ref<SkillMeta[]>([])
const skillsLoading = ref(false)
const showSkillModal = ref(false)
const skillEditMode = ref(false)
const currentSkillDetail = ref<Partial<SkillDetail>>({})
const skillReloading = ref(false)
const presetOptions = ref<Array<{ label: string; value: string }>>([])

const skillSearchName = ref('')

function fetchSkills() {
  skillsLoading.value = true
  fetchSkillList({ name: skillSearchName.value || undefined })
    .then((res) => {
      if (res.code === 0)
        skillsData.value = res.data.items
      else
        message.error(res.message || '加载技能列表失败')
    })
    .catch(() => message.error('加载技能列表失败'))
    .finally(() => (skillsLoading.value = false))
}

function handleAddSkill() {
  skillEditMode.value = false
  currentSkillDetail.value = {}
  showSkillModal.value = true
}

function handleEditSkill(row: SkillMeta) {
  skillsLoading.value = true
  fetchSkillDetail(row.id)
    .then((res) => {
      if (res.code === 0) {
        skillEditMode.value = true
        currentSkillDetail.value = res.data
        showSkillModal.value = true
      }
      else {
        message.error(res.message || '加载技能详情失败')
      }
    })
    .catch(() => message.error('加载技能详情失败'))
    .finally(() => (skillsLoading.value = false))
}

function handleDeleteSkill(row: SkillMeta) {
  deleteSkill(row.id)
    .then((res) => {
      if (res.code === 0) {
        message.success('删除成功')
        fetchSkills()
      }
      else {
        message.error(res.message || '删除失败')
      }
    })
    .catch(() => message.error('删除失败'))
}

function handleRunSkill(row: SkillMeta) {
  if (row.frontmatter.executionMode === 'direct') {
    message.warning('direct 模式技能需通过对话 API 触发，不支持手动运行')
    return
  }
  runSkill(row.id, { background: true })
    .then((res) => {
      if (res.code === 0)
        message.success(`已提交后台任务，Job ID: ${res.data?.jobId ?? '未知'}`)
      else
        message.error(res.message || '运行失败')
    })
    .catch(() => message.error('运行失败'))
}

function handleReloadSkills() {
  skillReloading.value = true
  reloadSkills()
    .then((res) => {
      if (res.code === 0) {
        message.success(`重载成功，共 ${res.data.count} 个技能`)
        fetchSkills()
      }
      else {
        message.error(res.message || '重载失败')
      }
    })
    .catch(() => message.error('重载失败'))
    .finally(() => (skillReloading.value = false))
}

function handleSubmitSkill(data: CreateSkillDTO | (UpdateSkillDTO & { name?: string })) {
  if (skillEditMode.value && currentSkillDetail.value.name) {
    updateSkill(currentSkillDetail.value.name, data as UpdateSkillDTO)
      .then((res) => {
        if (res.code === 0) {
          message.success('更新成功')
          fetchSkills()
        }
        else {
          message.error(res.message || '更新失败')
        }
      })
      .catch(() => message.error('更新失败'))
  }
  else {
    createSkill(data as CreateSkillDTO)
      .then((res) => {
        if (res.code === 0) {
          message.success('创建成功')
          fetchSkills()
        }
        else {
          message.error(res.message || '创建失败')
        }
      })
      .catch(() => message.error('创建失败'))
  }
}

const executionModeLabel: Record<string, string> = {
  direct: 'Direct',
  plan: 'Plan',
  workflow: 'Workflow',
}
const executionModeType: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  direct: 'default',
  plan: 'info',
  workflow: 'success',
}

const skillColumns: DataTableColumns<SkillMeta> = [
  { title: '技能名称', key: 'id', width: 180 },
  {
    title: '描述',
    key: 'frontmatter.description',
    ellipsis: { tooltip: true },
    render: row => row.frontmatter.description,
  },
  {
    title: '执行模式',
    key: 'frontmatter.executionMode',
    width: 120,
    render: (row) => {
      const mode = row.frontmatter.executionMode ?? 'direct'
      return h(NTag, { type: executionModeType[mode] ?? 'default', size: 'small' }, { default: () => executionModeLabel[mode] ?? mode })
    },
  },
  {
    title: '只读',
    key: 'frontmatter.readonly',
    width: 70,
    render: row => row.frontmatter.readonly
      ? h(NTag, { type: 'warning', size: 'small' }, { default: () => '只读' })
      : '',
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => {
      const readonly = row.frontmatter.readonly
      return h(NFlex, { gap: 6 }, {
        default: () => [
          h(NButton, {
            size: 'small', type: 'primary', tertiary: true,
            onClick: () => handleEditSkill(row),
            disabled: readonly,
          }, { default: () => '编辑' }),
          h(NButton, {
            size: 'small', type: 'info', tertiary: true,
            onClick: () => handleRunSkill(row),
            disabled: row.frontmatter.executionMode === 'direct',
          }, { default: () => '运行' }),
          h(NPopconfirm, {
            onPositiveClick: () => handleDeleteSkill(row),
          }, {
            trigger: () => h(NButton, {
              size: 'small', type: 'error', tertiary: true,
              disabled: readonly,
            }, { default: () => '删除' }),
            default: () => `确认删除技能 "${row.id}"？`,
          }),
        ],
      })
    },
  },
]

// ─── MCP Servers ──────────────────────────────────────────────────────────────

const mcpData = ref<McpServerConfig[]>([])
const mcpLoading = ref(false)
const showMcpModal = ref(false)
const mcpEditMode = ref(false)
const currentMcp = ref<Partial<McpServerConfig>>({})
const mcpTestingId = ref<string | null>(null)

function fetchMcpServers() {
  mcpLoading.value = true
  fetchMcpServerList({ pageSize: 100 })
    .then((res) => {
      if (res.code === 0)
        mcpData.value = res.data.items
      else
        message.error(res.message || '加载 MCP 服务器失败')
    })
    .catch(() => message.error('加载 MCP 服务器失败'))
    .finally(() => (mcpLoading.value = false))
}

function handleAddMcp() {
  mcpEditMode.value = false
  currentMcp.value = {}
  showMcpModal.value = true
}

function handleEditMcp(row: McpServerConfig) {
  mcpEditMode.value = true
  currentMcp.value = { ...row }
  showMcpModal.value = true
}

function handleDeleteMcp(row: McpServerConfig) {
  deleteMcpServer(row.id)
    .then((res) => {
      if (res.code === 0) {
        message.success('删除成功')
        fetchMcpServers()
      }
      else {
        message.error(res.message || '删除失败')
      }
    })
    .catch(() => message.error('删除失败'))
}

function handleTestMcp(row: McpServerConfig) {
  mcpTestingId.value = row.id
  testMcpServer(row.id)
    .then((res) => {
      if (res.code === 0)
        { message.success(`连接成功，发现并缓存 ${res.data.cachedToolCount ?? res.data.toolCount} 个工具：${res.data.tools.slice(0, 8).map(tool => tool.name).join('、')}${res.data.toolCount > 8 ? '…' : ''}`); fetchMcpServers() }
      else
        message.error(res.message || '连接失败')
    })
    .catch(() => message.error('连接测试失败'))
    .finally(() => (mcpTestingId.value = null))
}

function handleSubmitMcp(data: Parameters<typeof createMcpServer>[0]) {
  const action = mcpEditMode.value && currentMcp.value.id
    ? updateMcpServer(currentMcp.value.id, data)
    : createMcpServer(data)
  action
    .then((res) => {
      if (res.code === 0) {
        message.success(mcpEditMode.value ? '更新成功' : '添加成功')
        fetchMcpServers()
      }
      else {
        message.error(res.message || '操作失败')
      }
    })
    .catch(() => message.error('操作失败'))
}

const mcpColumns: DataTableColumns<McpServerConfig> = [
  { title: '名称', key: 'name', width: 160 },
  {
    title: '地址',
    key: 'endpoint',
    ellipsis: { tooltip: true },
    render: row => h('span', { style: 'font-family: monospace; font-size: 12px' }, row.transport === 'stdio' ? `${row.command || ''} ${(row.args || []).join(' ')}` : row.url || row.baseUrl || ''),
  },
  {
    title: '状态',
    key: 'enabled',
    width: 80,
    render: row => h(NTag, {
      type: row.enabled ? 'success' : 'default',
      size: 'small',
    }, { default: () => row.enabled ? '启用' : '禁用' }),
  },
  {
    title: '已缓存工具',
    key: 'tools',
    width: 100,
    render: row => row.tools?.length ?? 0,
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: { tooltip: true },
  },
  {
    title: '操作',
    key: 'actions',
    width: 240,
    render: (row) => {
      const isTesting = mcpTestingId.value === row.id
      return h(NFlex, { gap: 6 }, {
        default: () => [
          h(NButton, {
            size: 'small', type: 'success', tertiary: true,
            loading: isTesting, disabled: isTesting,
            onClick: () => handleTestMcp(row),
          }, { default: () => '连接测试' }),
          h(NButton, {
            size: 'small', type: 'info', tertiary: true,
            onClick: () => handleEditMcp(row),
          }, { default: () => '编辑' }),
          h(NPopconfirm, {
            onPositiveClick: () => handleDeleteMcp(row),
          }, {
            trigger: () => h(NButton, { size: 'small', type: 'error', tertiary: true }, { default: () => '删除' }),
            default: () => `确认删除 "${row.name}"？`,
          }),
        ],
      })
    },
  },
]

// ─── Background Jobs ──────────────────────────────────────────────────────────

const jobsData = ref<BackgroundJob[]>([])
const jobsLoading = ref(false)
const jobSearch = reactive({ userId: '', status: undefined as BackgroundJob['status'] | undefined })

function fetchJobs() {
  jobsLoading.value = true
  fetchJobList({ pageSize: 50, userId: jobSearch.userId || undefined, status: jobSearch.status })
    .then((res) => {
      if (res.code === 0)
        jobsData.value = res.data.items
      else
        message.error(res.message || '加载任务列表失败')
    })
    .catch(() => message.error('加载任务列表失败'))
    .finally(() => (jobsLoading.value = false))
}

function formatTs(ts?: number) {
  if (!ts)
    return '-'
  return new Date(ts).toLocaleString()
}

const jobStatusTag: Record<string, { type: 'default' | 'info' | 'success' | 'warning' | 'error'; label: string }> = {
  pending: { type: 'default', label: '等待中' },
  running: { type: 'info', label: '运行中' },
  completed: { type: 'success', label: '已完成' },
  failed: { type: 'error', label: '失败' },
}

const jobColumns: DataTableColumns<BackgroundJob> = [
  { title: 'Job ID', key: 'id', width: 220, ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render: row => h(NTag, {
      type: jobStatusTag[row.status]?.type ?? 'default',
      size: 'small',
    }, { default: () => jobStatusTag[row.status]?.label ?? row.status }),
  },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  { title: '用户', key: 'userId', width: 120 },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160,
    render: row => formatTs(row.createdAt),
  },
  {
    title: '错误信息',
    key: 'error',
    ellipsis: { tooltip: true },
    render: row => row.error
      ? h(NTooltip, {}, { trigger: () => h('span', { style: 'color: var(--n-error-color); cursor: pointer' }, '查看错误'), default: () => row.error })
      : '',
  },
]

const jobStatusOptions = [
  { label: '全部', value: undefined },
  { label: '等待中', value: 'pending' },
  { label: '运行中', value: 'running' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' },
]

// ─── Scheduled Tasks ──────────────────────────────────────────────────────────

const tasksData = ref<ScheduledTask[]>([])
const tasksLoading = ref(false)

function fetchTasks() {
  tasksLoading.value = true
  fetchScheduledTaskList({ pageSize: 100 })
    .then((res) => {
      if (res.code === 0)
        tasksData.value = res.data.items
      else
        message.error(res.message || '加载定时任务失败')
    })
    .catch(() => message.error('加载定时任务失败'))
    .finally(() => (tasksLoading.value = false))
}

function handleCancelTask(row: ScheduledTask) {
  cancelScheduledTask(row.id)
    .then((res) => {
      if (res.code === 0) {
        message.success('已取消')
        fetchTasks()
      }
      else {
        message.error(res.message || '取消失败')
      }
    })
    .catch(() => message.error('取消失败'))
}

const taskStatusTag: Record<string, { type: 'default' | 'info' | 'success' | 'warning' | 'error'; label: string }> = {
  active: { type: 'success', label: '活跃' },
  paused: { type: 'warning', label: '暂停' },
  completed: { type: 'default', label: '已完成' },
  failed: { type: 'error', label: '失败' },
}

const taskColumns: DataTableColumns<ScheduledTask> = [
  { title: '任务 ID', key: 'id', width: 220, ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render: row => h(NTag, {
      type: taskStatusTag[row.status]?.type ?? 'default',
      size: 'small',
    }, { default: () => taskStatusTag[row.status]?.label ?? row.status }),
  },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  { title: 'Cron', key: 'cronExpression', width: 160 },
  {
    title: '下次执行',
    key: 'nextRunAt',
    width: 160,
    render: row => formatTs(row.nextRunAt),
  },
  {
    title: '最后执行',
    key: 'lastRunAt',
    width: 160,
    render: row => formatTs(row.lastRunAt),
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render: (row) => {
      return h(NPopconfirm, { onPositiveClick: () => handleCancelTask(row) }, {
        trigger: () => h(NButton, {
          size: 'small', type: 'error', tertiary: true,
          disabled: row.status !== 'active',
        }, { default: () => '取消' }),
        default: () => '确认取消此定时任务？',
      })
    },
  },
]

// ─── Init ─────────────────────────────────────────────────────────────────────

function loadPresets() {
  fetchPresetList({}).then((res) => {
    if (res.code === 0) {
      presetOptions.value = res.data.map(p => ({ label: p.name, value: p.name }))
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchSkills()
  fetchMcpServers()
  loadPresets()
})

function handleTabChange(tab: string) {
  if (tab === 'jobs')
    fetchJobs()
  if (tab === 'tasks')
    fetchTasks()
}
</script>

<template>
  <NSpace vertical size="large">
    <!-- 技能搜索栏（仅在 skills tab 显示） -->
    <n-card v-if="activeTab === 'skills'">
      <n-form label-placement="left" inline :show-feedback="false">
        <NGrid cols="1 s:2 m:4" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <NGridItem span="1">
            <n-form-item label="名称">
              <n-input
                v-model:value="skillSearchName"
                placeholder="搜索技能名称或描述"
                clearable
                @keydown.enter="fetchSkills"
              />
            </n-form-item>
          </NGridItem>
          <NGridItem span="1">
            <NFlex>
              <NButton type="primary" @click="fetchSkills">
                <template #icon>
                  <icon-park-outline-search />
                </template>
                搜索
              </NButton>
              <NButton secondary @click="skillSearchName = ''; fetchSkills()">
                <template #icon>
                  <icon-park-outline-redo />
                </template>
                重置
              </NButton>
            </NFlex>
          </NGridItem>
        </NGrid>
      </n-form>
    </n-card>

    <!-- Jobs 搜索栏 -->
    <n-card v-if="activeTab === 'jobs'">
      <n-form label-placement="left" inline :show-feedback="false">
        <NGrid cols="1 s:2 m:4" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <NGridItem span="1">
            <n-form-item label="状态">
              <n-select
                v-model:value="jobSearch.status"
                :options="jobStatusOptions"
                style="min-width: 120px"
                @update:value="fetchJobs"
              />
            </n-form-item>
          </NGridItem>
          <NGridItem span="1">
            <NButton type="primary" @click="fetchJobs">
              <template #icon>
                <icon-park-outline-redo />
              </template>
              刷新
            </NButton>
          </NGridItem>
        </NGrid>
      </n-form>
    </n-card>

    <n-card>
      <n-tabs v-model:value="activeTab" type="line" animated @update:value="handleTabChange">
        <!-- ── 技能管理 ── -->
        <n-tab-pane name="skills" tab="技能管理">
          <NSpace vertical size="large">
            <NFlex gap="8">
              <NButton type="primary" @click="handleAddSkill">
                <template #icon>
                  <icon-park-outline-add-one />
                </template>
                新建技能
              </NButton>
              <NButton
                secondary
                :loading="skillReloading"
                @click="handleReloadSkills"
              >
                <template #icon>
                  <icon-park-outline-redo />
                </template>
                重载技能
              </NButton>
            </NFlex>
            <n-data-table
              :columns="skillColumns"
              :data="skillsData"
              :loading="skillsLoading"
              :pagination="{ pageSize: 20 }"
              striped
            />
          </NSpace>
        </n-tab-pane>

        <!-- ── MCP 服务器 ── -->
        <n-tab-pane name="mcp" tab="MCP 服务器">
          <NSpace vertical size="large">
            <NButton type="primary" @click="handleAddMcp">
              <template #icon>
                <icon-park-outline-add-one />
              </template>
              添加 MCP 服务器
            </NButton>
            <n-data-table
              :columns="mcpColumns"
              :data="mcpData"
              :loading="mcpLoading"
              striped
            />
          </NSpace>
        </n-tab-pane>

        <!-- ── 后台任务 ── -->
        <n-tab-pane name="jobs" tab="后台任务">
          <n-data-table
            :columns="jobColumns"
            :data="jobsData"
            :loading="jobsLoading"
            :pagination="{ pageSize: 20 }"
            striped
          />
        </n-tab-pane>

        <!-- ── 定时任务 ── -->
        <n-tab-pane name="tasks" tab="定时任务">
          <NSpace vertical size="large">
            <NButton secondary @click="fetchTasks">
              <template #icon>
                <icon-park-outline-redo />
              </template>
              刷新
            </NButton>
            <n-data-table
              :columns="taskColumns"
              :data="tasksData"
              :loading="tasksLoading"
              striped
            />
          </NSpace>
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <SkillFormModal
      v-model:show="showSkillModal"
      :edit-mode="skillEditMode"
      :initial-data="currentSkillDetail"
      :preset-options="presetOptions"
      :mcp-server-options="mcpData.map(server => ({ label: server.name, value: server.id }))"
      @submit="handleSubmitSkill"
    />

    <McpServerFormModal
      v-model:show="showMcpModal"
      :edit-mode="mcpEditMode"
      :initial-data="currentMcp"
      @submit="handleSubmitMcp"
    />
  </NSpace>
</template>
