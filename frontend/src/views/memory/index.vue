<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import {
  NButton,
  NCard,
  NDataTable,
  NEmpty,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NModal,
  NPopconfirm,
  NSpace,
  NTabPane,
  NTabs,
  useMessage,
} from 'naive-ui'
import { h, onMounted, reactive, ref } from 'vue'
import type { GroupFact, UserMemory } from '@/service/api/memory'
import {
  deleteGroupFact,
  deleteUserMemory,
  fetchGroupFacts,
  fetchUserMemories,
  queryGroupFacts,
  deleteMemoryById,
  queryUserMemories,
  saveGroupFacts,
  upsertUserMemories,
} from '@/service/api/memory'

const message = useMessage()
const activeTab = ref('group-facts')

// Group Facts Management
const groupFactsState = reactive({
  groupId: '',
  facts: [] as GroupFact[],
  loading: false,
  limit: 50,
  offset: 0,
  queryText: '',
  queryLimit: 10,
  queryMinImportance: undefined as number | undefined,
})

const groupFactsColumns: DataTableColumns<GroupFact> = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
  },
  {
    title: 'Fact',
    key: 'fact',
    ellipsis: { tooltip: true },
  },
  {
    title: 'Topic',
    key: 'topic',
    width: 120,
    ellipsis: { tooltip: true },
  },
  {
    title: 'Importance',
    key: 'importance',
    width: 100,
    render(row: GroupFact) {
      return row.importance.toFixed(2)
    },
  },
  {
    title: 'Created At',
    key: 'created_at',
    width: 180,
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render(row: GroupFact) {
      return h(
        NPopconfirm,
        {
          onPositiveClick: () => handleDeleteGroupFact(row.id!),
        },
        {
          default: () => '确认删除这条记忆吗？',
          trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => '删除' }),
        },
      )
    },
  },
]

async function loadGroupFacts() {
  if (!groupFactsState.groupId) {
    message.warning('请输入Group ID')
    return
  }
  groupFactsState.loading = true
  try {
    const res = await fetchGroupFacts({
      groupId: groupFactsState.groupId,
      limit: groupFactsState.limit,
      offset: groupFactsState.offset,
    })
    if (res.isSuccess) {
      groupFactsState.facts = res.data
      message.success('加载成功')
    }
    else {
      message.error(res.message || '加载失败')
    }
  }
  catch (error) {
    console.error('Failed to load group facts:', error)
    message.error('加载失败')
  }
  finally {
    groupFactsState.loading = false
  }
}

async function handleQueryGroupFacts() {
  if (!groupFactsState.groupId) {
    message.warning('请输入Group ID')
    return
  }
  if (!groupFactsState.queryText) {
    message.warning('请输入查询文本')
    return
  }
  groupFactsState.loading = true
  try {
    const res = await queryGroupFacts({
      groupId: groupFactsState.groupId,
      query: groupFactsState.queryText,
      limit: groupFactsState.queryLimit,
      minImportance: groupFactsState.queryMinImportance,
    })
    if (res.isSuccess) {
      groupFactsState.facts = res.data
      message.success('查询成功')
    }
    else {
      message.error(res.message || '查询失败')
    }
  }
  catch (error) {
    console.error('Failed to query group facts:', error)
    message.error('查询失败')
  }
  finally {
    groupFactsState.loading = false
  }
}

const showAddFactModal = ref(false)
const newFactsInput = ref('')

async function handleSaveGroupFacts() {
  if (!groupFactsState.groupId) {
    message.warning('请输入Group ID')
    return
  }
  if (!newFactsInput.value.trim()) {
    message.warning('请输入要添加的facts')
    return
  }

  // Parse facts from textarea, each line is a fact
  const facts = newFactsInput.value.split('\n').filter(f => f.trim()).map(f => ({
    fact: f.trim(),
    importance: 0.5,
  }))

  try {
    const res = await saveGroupFacts({
      groupId: groupFactsState.groupId,
      facts,
    })
    if (res.isSuccess) {
      message.success('保存成功')
      showAddFactModal.value = false
      newFactsInput.value = ''
      await loadGroupFacts()
    }
    else {
      message.error(res.message || '保存失败')
    }
  }
  catch (error) {
    console.error('Failed to save group facts:', error)
    message.error('保存失败')
  }
}

async function handleDeleteGroupFact(factId: number) {
  try {
    const res = await deleteGroupFact(groupFactsState.groupId, String(factId))
    if (res.isSuccess) {
      message.success('删除成功')
      await loadGroupFacts()
    }
    else {
      message.error(res.message || '删除失败')
    }
  }
  catch (error) {
    console.error('Failed to delete group fact:', error)
    message.error('删除失败')
  }
}

// User Memories Management
const userMemoriesState = reactive({
  userId: '',
  groupId: '' as string | null,
  memories: [] as UserMemory[],
  loading: false,
  limit: 50,
  offset: 0,
  total: 0,
  queryText: '',
  queryTotalLimit: 5,
  querySearchLimit: 3,
  queryMinImportance: undefined as number | undefined,
})

function normalizeGroupId(value: string | null) {
  if (!value) {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const userMemoriesColumns: DataTableColumns<UserMemory> = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
  },
  {
    title: 'User ID',
    key: 'user_id',
    width: 150,
    ellipsis: { tooltip: true },
  },
  {
    title: 'Group ID',
    key: 'group_id',
    width: 150,
    ellipsis: { tooltip: true },
  },
  {
    title: '记忆内容',
    key: 'value',
    ellipsis: { tooltip: true },
  },
  {
    title: '重要度',
    key: 'importance',
    width: 100,
    render(row: UserMemory) {
      return row.importance.toFixed(2)
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render(row: UserMemory) {
      return h(
        NPopconfirm,
        {
          onPositiveClick: () => handleDeleteUserMemory(row.id!),
        },
        {
          default: () => '确认删除这条记忆吗？',
          trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => '删除' }),
        },
      )
    },
  },
]

async function loadUserMemories() {
  userMemoriesState.loading = true
  try {
    const groupId = normalizeGroupId(userMemoriesState.groupId)
    const res = await fetchUserMemories({
      userId: userMemoriesState.userId,
      groupId,
      limit: userMemoriesState.limit,
      offset: userMemoriesState.offset,
    })
    if (res.isSuccess) {
      userMemoriesState.memories = res.data
      userMemoriesState.total = res.data.length
      if (!res.data.length) {
        message.info('未找到记忆记录')
      }
    }
    else {
      message.error(res.message || '加载失败')
      userMemoriesState.total = 0
    }
  }
  catch (error) {
    console.error('Failed to load user memories:', error)
    message.error('加载失败')
    userMemoriesState.total = 0
  }
  finally {
    userMemoriesState.loading = false
  }
}

async function handleLoadUserMemories(reset = false) {
  if (reset) {
    userMemoriesState.offset = 0
  }
  await loadUserMemories()
}

const showAddMemoryModal = ref(false)
const newMemoriesInput = ref('')

async function handleUpsertUserMemories() {
  if (!userMemoriesState.userId) {
    message.warning('请输入User ID')
    return
  }
  if (!newMemoriesInput.value.trim()) {
    message.warning('请输入要添加的memories')
    return
  }

  // Parse memories from textarea, each line is either "记忆文本" or "记忆文本|重要度"
  const memories = newMemoriesInput.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((line) => {
      const [textPart, importancePart] = line.split('|').map(part => part.trim())
      if (!textPart) {
        return null
      }
      if (importancePart) {
        const parsedImportance = Number(importancePart)
        if (!Number.isNaN(parsedImportance) && parsedImportance >= 0 && parsedImportance <= 1) {
          return {
            value: textPart,
            importance: parsedImportance,
          }
        }
      }
      return textPart
    })
    .filter(Boolean) as Array<string | { value: string, importance: number }>

  if (memories.length === 0) {
    message.warning('请按行输入记忆内容，可选格式：记忆文本 或 记忆文本|重要度(0-1)')
    return
  }

  try {
    const groupId = normalizeGroupId(userMemoriesState.groupId)
    const res = await upsertUserMemories({
      userId: userMemoriesState.userId,
      groupId,
      memories,
    })
    if (res.isSuccess) {
      message.success(`成功更新 ${res.data.updated} 条记忆`)
      showAddMemoryModal.value = false
      newMemoriesInput.value = ''
      await loadUserMemories()
    }
    else {
      message.error(res.message || '保存失败')
    }
  }
  catch (error) {
    console.error('Failed to upsert user memories:', error)
    message.error('保存失败')
  }
}

async function handleDeleteUserMemory(memoryId: number) {
  try {
    const userId = userMemoriesState.userId?.trim()
    const res = userId
      ? await deleteUserMemory(userId, String(memoryId))
      : await deleteMemoryById(String(memoryId))
    if (res.isSuccess) {
      message.success('删除成功')
      await loadUserMemories()
    }
    else {
      message.error(res.message || '删除失败')
    }
  }
  catch (error) {
    console.error('Failed to delete user memory:', error)
    message.error('删除失败')
  }
}

async function handleQueryUserMemories() {
  if (!userMemoriesState.userId) {
    message.warning('请输入User ID')
    return
  }
  if (!userMemoriesState.queryText) {
    message.warning('请输入查询文本')
    return
  }
  userMemoriesState.loading = true
  try {
    const groupId = normalizeGroupId(userMemoriesState.groupId)
    const res = await queryUserMemories({
      userId: userMemoriesState.userId,
      groupId,
      query: userMemoriesState.queryText,
      totalLimit: userMemoriesState.queryTotalLimit,
      searchLimit: userMemoriesState.querySearchLimit,
      minImportance: userMemoriesState.queryMinImportance,
    })
    if (res.isSuccess) {
      userMemoriesState.memories = res.data
      message.success('查询成功')
    }
    else {
      message.error(res.message || '查询失败')
    }
  }
  catch (error) {
    console.error('Failed to query user memories:', error)
    message.error('查询失败')
  }
  finally {
    userMemoriesState.loading = false
  }
}

onMounted(() => {
  handleLoadUserMemories(true)
})
</script>

<template>
  <div class="chaite-page memory-container">
    <header class="chaite-page-header"><div><h1>记忆</h1><p>按群和用户查询、检索与维护聊天记忆。</p></div></header>
    <NCard class="chaite-panel" :bordered="false">
      <NTabs v-model:value="activeTab" type="line" animated>
        <!-- Group Facts Tab -->
        <NTabPane name="group-facts" tab="群组事实记忆">
          <NSpace vertical :size="16">
            <NCard title="查询条件" size="small">
              <NForm label-placement="left" label-width="100">
                <NGrid :cols="24" :x-gap="12">
                  <NGridItem :span="8">
                    <NFormItem label="Group ID">
                      <NInput v-model:value="groupFactsState.groupId" placeholder="输入群组ID" />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem :span="4">
                    <NFormItem label="Limit">
                      <NInputNumber v-model:value="groupFactsState.limit" :min="1" :max="200" />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem :span="4">
                    <NFormItem label="Offset">
                      <NInputNumber v-model:value="groupFactsState.offset" :min="0" />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem :span="8">
                    <NFormItem label=" ">
                      <NSpace>
                        <NButton type="primary" @click="loadGroupFacts">
                          加载列表
                        </NButton>
                        <NButton @click="showAddFactModal = true">
                          添加Facts
                        </NButton>
                      </NSpace>
                    </NFormItem>
                  </NGridItem>
                </NGrid>
              </NForm>
            </NCard>

            <NCard title="语义查询" size="small">
              <NForm label-placement="left" label-width="100">
                <NGrid :cols="24" :x-gap="12">
                  <NGridItem :span="10">
                    <NFormItem label="查询文本">
                      <NInput v-model:value="groupFactsState.queryText" placeholder="输入查询文本" />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem :span="4">
                    <NFormItem label="返回数量">
                      <NInputNumber v-model:value="groupFactsState.queryLimit" :min="1" :max="100" />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem :span="4">
                    <NFormItem label="最小重要度">
                      <NInputNumber v-model:value="groupFactsState.queryMinImportance" :min="0" :max="1" :step="0.1" />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem :span="6">
                    <NFormItem label=" ">
                      <NButton type="primary" @click="handleQueryGroupFacts">
                        查询
                      </NButton>
                    </NFormItem>
                  </NGridItem>
                </NGrid>
              </NForm>
            </NCard>

            <NCard title="Facts列表" size="small">
              <NDataTable
                :columns="groupFactsColumns"
                :data="groupFactsState.facts"
                :loading="groupFactsState.loading"
                :scroll-x="1000"
              >
                <template #empty>
                  <NEmpty description="暂无数据" />
                </template>
              </NDataTable>
            </NCard>
          </NSpace>
        </NTabPane>

        <!-- User Memories Tab -->
        <NTabPane name="user-memories" tab="用户记忆">
          <NSpace vertical :size="16">
            <NCard title="查询条件" size="small">
              <NForm label-placement="left" label-width="100">
                <NGrid :cols="24" :x-gap="12">
                    <NGridItem :span="8">
                      <NFormItem label="用户 ID">
                        <NInput v-model:value="userMemoriesState.userId" placeholder="留空表示全部用户" />
                      </NFormItem>
                    </NGridItem>
                    <NGridItem :span="8">
                      <NFormItem label="群组 ID">
                        <NInput v-model:value="userMemoriesState.groupId" placeholder="可选，筛选特定群组" />
                      </NFormItem>
                    </NGridItem>
                    <NGridItem :span="4">
                      <NFormItem label="每页条数">
                        <NInputNumber v-model:value="userMemoriesState.limit" :min="1" :max="200" />
                      </NFormItem>
                    </NGridItem>
                    <NGridItem :span="4">
                      <NFormItem label="偏移量">
                        <NInputNumber v-model:value="userMemoriesState.offset" :min="0" />
                      </NFormItem>
                    </NGridItem>
                    <NGridItem :span="8">
                      <NFormItem label="操作">
                        <NSpace>
                          <NButton type="primary" @click="handleLoadUserMemories(true)">
                            查询
                          </NButton>
                          <NButton @click="showAddMemoryModal = true">
                            添加记忆
                          </NButton>
                        </NSpace>
                      </NFormItem>
                    </NGridItem>
                  </NGrid>
                </NForm>
              </NCard>
              <NCard v-if="userMemoriesState.total > 0" size="small" title="统计">
                <NSpace>
                  <span>当前条数：{{ userMemoriesState.total }}</span>
                  <span v-if="userMemoriesState.userId">当前用户：{{ userMemoriesState.userId }}</span>
                  <span v-if="userMemoriesState.groupId">当前群组：{{ userMemoriesState.groupId }}</span>
                </NSpace>
              </NCard>

            <NCard title="语义检索" size="small">
              <NForm label-placement="left" label-width="100">
                <NGrid :cols="24" :x-gap="12">
                  <NGridItem :span="10">
                    <NFormItem label="查询文本">
                      <NInput v-model:value="userMemoriesState.queryText" placeholder="输入查询文本" />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem :span="4">
                    <NFormItem label="注入上限">
                      <NInputNumber v-model:value="userMemoriesState.queryTotalLimit" :min="1" :max="100" />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem :span="4">
                    <NFormItem label="检索数量">
                      <NInputNumber v-model:value="userMemoriesState.querySearchLimit" :min="0" :max="100" />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem :span="4">
                    <NFormItem label="最低重要度">
                      <NInputNumber v-model:value="userMemoriesState.queryMinImportance" :min="0" :max="1" :step="0.1" />
                    </NFormItem>
                  </NGridItem>
                  <NGridItem :span="6">
                    <NFormItem label=" ">
                      <NButton type="primary" @click="handleQueryUserMemories">
                        查询
                      </NButton>
                    </NFormItem>
                  </NGridItem>
                </NGrid>
              </NForm>
            </NCard>

            <NCard title="Memories列表" size="small">
              <NDataTable
                :columns="userMemoriesColumns"
                :data="userMemoriesState.memories"
                :loading="userMemoriesState.loading"
                :scroll-x="1000"
              >
                <template #empty>
                  <NEmpty description="暂无数据" />
                </template>
              </NDataTable>
            </NCard>
          </NSpace>
        </NTabPane>
      </NTabs>
    </NCard>

    <!-- Add Group Facts Modal -->
    <NModal
      v-model:show="showAddFactModal"
      preset="dialog"
      title="添加Group Facts"
      positive-text="保存"
      negative-text="取消"
      @positive-click="handleSaveGroupFacts"
    >
      <NSpace vertical>
        <div>每行一个fact</div>
        <NInput
          v-model:value="newFactsInput"
          type="textarea"
          placeholder="输入facts，每行一个"
          :rows="10"
        />
      </NSpace>
    </NModal>

    <!-- Add User Memories Modal -->
    <NModal
      v-model:show="showAddMemoryModal"
      preset="dialog"
      title="添加User Memories"
      positive-text="保存"
      negative-text="取消"
      @positive-click="handleUpsertUserMemories"
    >
      <NSpace vertical>
        <div>每行一个记忆，可选格式：记忆文本 或 记忆文本|重要度(0-1)</div>
        <NInput
          v-model:value="newMemoriesInput"
          type="textarea"
          placeholder="例如：我喜欢喝咖啡 或 我喜欢喝咖啡|0.8"
          :rows="10"
        />
      </NSpace>
    </NModal>
  </div>
</template>

<style scoped>
.memory-container {
  max-width: 1600px;
}
</style>
