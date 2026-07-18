<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
const router = useRouter()
import { NButton, NFlex, NGrid, NPopover, NSpace, NTag, useMessage } from 'naive-ui'
import { h, onMounted, reactive, ref } from 'vue'
import type { ListToolModels } from '@/service/api/tools'
import { createTool, deleteTool, fetchAllToolList, fetchToolList, updateTool, uploadToolToCloud } from '@/service/api/tools'
import ToolFormModal from './ToolFormModal.vue'
import ToolTestModal from './ToolTestModal.vue'
import { createToolGroup, deleteToolGroup, fetchAllToolGroupList, updateToolGroup } from '@/service/api/toolGroup'
import ToolGroupFormModal from '@/views/tools/ToolGroupFormModal.vue'
import IconLinkCloudSuccess from '~icons/icon-park-outline/cloudy'
import type { Shareable } from '@/typings/entities/shareable'

function createColumns({
  upload,
  edit,
  test,
  remove,
}: {
  upload: (row: Shareable.ToolModel) => void
  edit: (row: Shareable.ToolModel) => void
  test: (row: Shareable.ToolModel) => void
  remove: (row: Shareable.ToolModel) => void
}): DataTableColumns<Shareable.ToolModel> {
  return [
    {
      title: 'ID',
      key: 'id',
      resizable: true,
    },
    {
      title: '云端ID',
      key: 'cloudId',
      resizable: true,
    },
    {
      title: '名称',
      key: 'name',
      render(row: Shareable.ToolModel) {
        const children = [row.name] as any[]
        if (row.uploader) {
          children.push(h(NPopover, { trigger: 'hover' }, { trigger: () => h(IconLinkCloudSuccess, { style: { color: 'green' } }), default: () => '云端工具' }))
        }
        return h(NFlex, { align: 'center' }, { default: () => children })
      },
      resizable: true,
    },
    {
      title: '状态',
      key: 'status',
      render(row: Shareable.ToolModel) {
        return row.status === 'disabled'
          ? h(NPopover, { trigger: 'hover' }, { trigger: h(NTag, { type: 'error' }, { default: () => '禁用' }), default: () => '已禁用，不会被任何工具组使用' })
          : h(NTag, { type: 'success' }, { default: () => '正常' })
      },
    },
    {
      title: '描述',
      key: 'description',
      width: 500,
    },
    {
      title: '创建日期',
      key: 'createdAt',
      resizable: true,
    },
    {
      title: '操作',
      key: 'actions',
      render(row) {
        return [
          h(
            NButton,
            {
              type: 'primary',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => upload(row),
              disabled: !!row.uploader?.username,
            },
            { default: () => '上传' },
          ),
          h(
            NButton,
            {
              type: 'info',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => edit(row),
            },
            { default: () => '修改' },
          ),
          h(NButton, { type: 'success', strong: true, tertiary: true, size: 'small', onClick: () => test(row) }, { default: () => '测试' }),
          h(
            NButton,
            {
              type: 'error',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => remove(row),
            },
            { default: () => '删除' },
          ),
        ]
      },
    },
  ]
}

// 工具组列定义
function createGroupColumns({
  upload,
  edit,
  remove,
}: {
  upload: (row: Shareable.ToolsGroupModel) => void
  edit: (row: Shareable.ToolsGroupModel) => void
  remove: (row: Shareable.ToolsGroupModel) => void
}): DataTableColumns<Shareable.ToolsGroupModel> {
  return [
    {
      title: 'ID',
      key: 'id',
      resizable: true,
    },
    {
      title: '组名称',
      key: 'name',
      render(row) {
        return h('div', {}, row.name)
      },
      resizable: true,
    },
    {
      title: '描述',
      key: 'description',
      width: 500,
    },
    {
      title: '工具数量',
      key: 'toolCount',
      render(row) {
        return h('div', {}, row.isDefault ? '-' : (row.toolIds?.length || 0))
      },
    },
    {
      title: '创建日期',
      key: 'createdAt',
      resizable: true,
    },
    {
      title: '操作',
      key: 'actions',
      render(row) {
        return [
          // h(
          //   NButton,
          //   {
          //     type: 'primary',
          //     strong: true,
          //     tertiary: true,
          //     size: 'small',
          //     onClick: () => view(row),
          //   },
          //   { default: () => '查看' },
          // ),
          h(
            NButton,
            {
              type: 'info',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => edit(row),
              disabled: row.isDefault,
            },
            { default: () => '修改' },
          ),
          h(
            NButton,
            {
              type: 'error',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => remove(row),
              disabled: row.isDefault,
            },
            { default: () => '删除' },
          ),
        ]
      },
    },
  ]
}

const message = useMessage()
const data = reactive({ value: [] as Shareable.ToolModel[] })
const availableTools = ref([] as Shareable.ToolModel[])
const showModal = ref(false)
const editMode = ref(false)
const defaultTool = {
  modelType: 'settings',
  name: '',
  code: '',
  description: '',
  uploader: undefined,
} as Shareable.ToolModel
const currentTool = ref<Shareable.ToolModel>(JSON.parse(JSON.stringify(defaultTool)))
const loading = ref(false)
const showTestModal = ref(false)
const testingTool = ref<Shareable.ToolModel>()

// 工具组相关状态
const groupData = reactive({ value: [] as Shareable.ToolsGroupModel[] })
const showGroupModal = ref(false)
const editGroupMode = ref(false)
const defaultGroup = {
  name: '',
  description: '',
  toolIds: [],
  modelType: 'settings',
  embedded: false,
} as Shareable.ToolsGroupModel
const currentGroup = ref<Shareable.ToolsGroupModel>(JSON.parse(JSON.stringify(defaultGroup)))
const groupLoading = ref(false)
const toolPage = ref(1)
const toolPageSize = ref(20)
const toolTotal = ref(0)
const activeTab = ref('tools') // 默认显示工具管理标签

interface BuiltinToolRow {
  name: string
  description: string
  visibility: string
  source: string
}

const builtinTools: BuiltinToolRow[] = [
  { name: 'search_skills', description: '搜索精简的 Skill 能力目录，不加载 MCP 工具 schema。', visibility: '所有启用 MCP 的对话', source: 'Skill / MCP 运行时' },
  { name: 'activate_skill_tools', description: '按 Skill 激活少量 MCP 工具；仅激活后的下一轮才会看见真实工具。', visibility: '所有启用 MCP 的对话', source: 'Skill / MCP 运行时' },
  { name: 'list_mcp_servers', description: '查看 MCP Server 及已缓存工具数，不返回密钥。', visibility: '仅机器人主人', source: 'MCP 管理' },
  { name: 'draft_mcp_server', description: '生成 MCP 配置草案；主人 QQ 确认后才会保存。', visibility: '仅机器人主人', source: 'MCP 管理' },
  { name: 'list_skills', description: '列出已加载 Skill。', visibility: '仅机器人主人', source: 'Skill 管理' },
  { name: 'create_skill / update_skill / delete_skill', description: '创建、修改或删除 Skill 文件。', visibility: '仅机器人主人', source: 'Skill 管理' },
  { name: 'create_workflow / run_skill', description: '维护工作流或按需运行 Skill。', visibility: '仅机器人主人', source: 'Skill 管理' },
]

const builtinColumns: DataTableColumns<BuiltinToolRow> = [
  { title: '工具', key: 'name', width: 250 },
  { title: '作用', key: 'description' },
  { title: '可见范围', key: 'visibility', width: 180 },
  { title: '来源', key: 'source', width: 150 },
]

function fetchTools(filter?: any) {
  loading.value = true
  fetchToolList({
    ...filter,
    page: toolPage.value,
    pageSize: toolPageSize.value,
  }).then((res) => {
    data.value = res.data.items
    toolTotal.value = res.data.total
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

function fetchAvailableTools() {
  fetchAllToolList().then((items) => {
    availableTools.value = items
  }).catch(() => {})
}

function handleRemoveTool(row: Shareable.ToolModel) {
  window.$dialog.warning({
    title: '确认删除',
    content: `确定要删除工具 "${row.name}" 吗？此操作不可恢复`,
    positiveText: '确认删除',
    onPositiveClick: () => {
      deleteTool(row.id as string).then((res) => {
        if (res.code === 0) {
          message.success('删除成功')
          fetchTools()
        }
      }).finally(() => (loading.value = false))
    },
  })
}

function handleSubmitTool(toolData: Shareable.ToolModel) {
  loading.value = true
  const action = editMode.value && toolData.id
    ? updateTool(toolData.id, toolData)
    : createTool(toolData)
  action.then((res) => {
    if (res.code === 0) {
      message.success(editMode.value ? '修改成功' : '创建成功')
      fetchTools()
    }
    else {
      message.error(res.message || '操作失败')
    }
  }).finally(() => {
    loading.value = false
    showModal.value = false
  })
}

const columns = createColumns({
  upload(row) {
    // message.warning(`暂未实现`)
    uploadToolToCloud(row as { id: string }).then((res) => {
      if (res.code === 0) {
        message.success('上传成功')
      }
    })
  },
  edit(row) {
    editMode.value = true
    currentTool.value = { ...row }
    showModal.value = true
  },
  test(row) {
    testingTool.value = row
    showTestModal.value = true
  },
  remove: handleRemoveTool,
})

function handleAddTool() {
  editMode.value = false
  currentTool.value = JSON.parse(JSON.stringify(defaultTool)) as Shareable.ToolModel
  showModal.value = true
}

// 工具组相关函数
function fetchToolGroups(filter?: any) {
  groupLoading.value = true
  // 这里替换为实际的API调用
  fetchAllToolGroupList(filter).then((items) => {
    groupData.value = items
    groupLoading.value = false
  }).catch(() => {
    groupLoading.value = false
  })
}

function handleViewToolGroup(row: Shareable.ToolsGroupModel) {
  message.info(`查看工具组: ${row.name}，包含 ${row.toolIds?.length || 0} 个工具`)
}

function handleRemoveToolGroup(row: Shareable.ToolsGroupModel) {
  window.$dialog.warning({
    title: '确认删除',
    content: `确定要删除工具组 "${row.name}" 吗？此操作不可恢复`,
    positiveText: '确认删除',
    onPositiveClick: () => {
      groupLoading.value = true
      deleteToolGroup(row.id as string).then((res) => {
        if (res.code === 0) {
          message.success('删除成功')
          fetchToolGroups()
        }
      }).finally(() => (groupLoading.value = false))
    },
  })
}

function handleSubmitToolGroup(gData: Shareable.ToolsGroupModel) {
  groupLoading.value = true
  const action = editGroupMode.value && gData.id
    ? updateToolGroup(gData.id, gData)
    : createToolGroup(gData)
  action.then((res) => {
    if (res.code === 0) {
      message.success(editGroupMode.value ? '修改成功' : '创建成功')
      fetchToolGroups()
    }
    else {
      message.error(res.message || '操作失败')
    }
  }).finally(() => {
    groupLoading.value = false
    showGroupModal.value = false
  })
}

const groupColumns = createGroupColumns({
  upload: handleViewToolGroup,
  edit(row) {
    fetchAvailableTools()
    editGroupMode.value = true
    currentGroup.value = { ...row }
    showGroupModal.value = true
  },
  remove: handleRemoveToolGroup,
})

function handleAddToolGroup() {
  fetchAvailableTools()
  editGroupMode.value = false
  currentGroup.value = JSON.parse(JSON.stringify(defaultGroup)) as Shareable.ToolsGroupModel
  showGroupModal.value = true
}

onMounted(() => {
  fetchTools()
  fetchAvailableTools()
  fetchToolGroups()
})

// 搜索相关
const searchModel = reactive({
  name: undefined,
} as ListToolModels)

function handleResetSearch() {
  searchModel.name = undefined
  toolPage.value = 1
  fetchTools(searchModel)
}

function handleToolSearch() {
  toolPage.value = 1
  fetchTools(searchModel)
}

function handleToolPageChange(page: number) {
  toolPage.value = page
  fetchTools(searchModel)
}

function handleToolPageSizeChange(pageSize: number) {
  toolPageSize.value = pageSize
  toolPage.value = 1
  fetchTools(searchModel)
}
</script>

<template>
  <div class="chaite-page">
    <header class="chaite-page-header" data-tour="tools"><div><h1>工具与分组</h1><p>维护模型可调用的能力，并通过工具组快速关联到预设。</p></div><NSpace><NButton secondary @click="router.push('/agent?tab=mcp')"><template #icon><icon-park-outline-connection /></template>MCP 服务器</NButton><NButton type="primary" @click="handleAddTool"><template #icon><icon-park-outline-add-one /></template>创建工具</NButton></NSpace></header>
  <NSpace vertical size="large">
    <n-card class="chaite-panel" :bordered="false">
      <n-form :model="searchModel" label-placement="left" inline :show-feedback="false">
        <NGrid cols="1 s:2 m:3 l:6" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
          <NFormItemGridItem span="1" label="名称" path="name">
            <n-input v-model:value="searchModel.name" placeholder="请输入要搜索的名称关键词" />
          </NFormItemGridItem>
          <NGridItem span="1">
            <NFlex class="ml-auto">
              <NButton type="primary" @click="handleToolSearch">
                <template #icon>
                  <icon-park-outline-search />
                </template>
                搜索
              </NButton>
              <NButton strong secondary @click="handleResetSearch">
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
    <n-card class="chaite-panel" :bordered="false">
      <n-tabs v-model:value="activeTab" type="line" animated>
        <n-tab-pane name="tools" tab="工具管理">
          <NSpace vertical size="large">
            <div class="flex gap-4">
              <NButton type="primary" @click="handleAddTool">
                <template #icon>
                  <icon-park-outline-add-one />
                </template>
                新建工具
              </NButton>
            </div>
            <n-data-table :columns="columns" :data="data.value" :loading="loading" />
            <n-pagination
              :page="toolPage"
              :page-size="toolPageSize"
              :item-count="toolTotal"
              show-size-picker
              :page-sizes="[10, 20, 50, 100]"
              @update:page="handleToolPageChange"
              @update:page-size="handleToolPageSizeChange"
            />
          </NSpace>
        </n-tab-pane>

        <n-tab-pane name="groups" tab="工具组管理">
          <NSpace vertical size="large">
            <div class="flex gap-4">
              <NButton type="primary" @click="handleAddToolGroup">
                <template #icon>
                  <icon-park-outline-add-one />
                </template>
                新建工具组
              </NButton>
            </div>
            <n-data-table :columns="groupColumns" :data="groupData.value" :loading="groupLoading" />
          </NSpace>
        </n-tab-pane>
        <n-tab-pane name="builtins" tab="内置工具">
          <NSpace vertical size="large">
            <n-alert type="info" :show-icon="false">
              内置工具由 Chaite 在运行时按权限注入，不会写入本地工具数据库，也无需加入工具组。MCP 的真实工具只有在对应 Skill 被激活后才会临时出现。
            </n-alert>
            <n-data-table :columns="builtinColumns" :data="builtinTools" />
          </NSpace>
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <ToolFormModal
      v-model:show="showModal"
      :edit-mode="editMode"
      :initial-data="currentTool"
      @submit="handleSubmitTool"
    />
    <ToolTestModal v-model:show="showTestModal" :tool="testingTool" />

    <ToolGroupFormModal
      v-model:show="showGroupModal"
      :edit-mode="editGroupMode"
      :initial-data="currentGroup"
      :available-tools="availableTools"
      @submit="handleSubmitToolGroup"
    />
  </NSpace>
  </div>
</template>
