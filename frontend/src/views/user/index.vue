<script lang="ts" setup>
import { h, onMounted, ref } from 'vue'
import {
  NButton,
  NCard,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NFlex,
  NIcon,
  NList,
  NListItem,
  NPopconfirm,
  NSpin,
  NText,
  useMessage,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { deleteUserState, getHistory, listUserStates } from '@/service/api/history'
import type { Conversation, UserState } from '@/service/api/history'
import IconEye from '~icons/icon-park-outline/preview-open'
import IconDelete from '~icons/icon-park-outline/delete'
import IconChat from '~icons/icon-park-outline/message'
import ConversationDetailDrawer from './components/ConversationDetailDrawer.vue'

const message = useMessage()
const userStates = ref<UserState[]>([])
const loading = ref(false)
const drawerVisible = ref(false)
const selectedUserId = ref<string | number>('')
const selectedUserConversations = ref<Conversation[]>([])
const conversationDetailVisible = ref(false)
const selectedConversation = ref<Conversation | null>(null)
const conversationHistory = ref<Model.HistoryMessage[]>([])
const historyLoading = ref(false)

// Load all user states
async function loadUserStates() {
  loading.value = true
  try {
    const res = await listUserStates()
    if (res.code === 0) {
      userStates.value = res.data
    }
    else {
      message.error(res.message || '加载用户状态失败')
    }
  }
  catch (error: any) {
    message.error(error.message || '获取用户状态时发生错误')
  }
  finally {
    loading.value = false
  }
}

// Handle viewing a user's conversations
function handleViewUserConversations(userId: string | number) {
  selectedUserId.value = userId
  const user = userStates.value.find(u => u.userId === userId)
  if (user) {
    selectedUserConversations.value = user.conversations
    drawerVisible.value = true
  }
}

// Handle deleting a user state
async function handleDeleteUserState(userId: string) {
  try {
    const res = await deleteUserState(userId)
    if (res.code === 0) {
      message.success('删除用户状态成功')
      await loadUserStates()
    }
    else {
      message.error(res.message || '删除用户状态失败')
    }
  }
  catch (error: any) {
    message.error(error.message || '删除用户状态时发生错误')
  }
}

// View conversation details
async function handleViewConversation(conversation: Conversation) {
  selectedConversation.value = conversation
  conversationDetailVisible.value = true
  historyLoading.value = true

  try {
    const res = await getHistory(conversation.lastMessageId, conversation.id)
    if (res.code === 0) {
      conversationHistory.value = res.data
    }
    else {
      message.error(res.message || '获取对话历史失败')
    }
  }
  catch (error: any) {
    message.error(error.message || '获取对话历史时发生错误')
  }
  finally {
    historyLoading.value = false
  }
}

// Table columns
const columns: DataTableColumns<UserState> = [
  {
    title: '用户ID',
    key: 'userId',
  },
  {
    title: '昵称',
    key: 'nickname',
    render: row => row.nickname || '未设置',
  },
  {
    title: '对话数量',
    key: 'conversationCount',
    render: row => row.conversations?.length || 0,
  },
  {
    title: '当前对话',
    key: 'currentConversation',
    render: (row) => {
      const currentConv = row.conversations?.find(conv => conv.id === row.current.conversationId)
      return currentConv ? currentConv.name : '无'
    },
  },
  {
    title: '预设',
    key: 'settings.preset',
    render: row => row.settings?.preset || '默认',
  },
  {
    title: '模型',
    key: 'settings.model',
    render: row => row.settings?.model || '未设置',
  },
  {
    title: '操作',
    key: 'actions',
    render: row => [
      h(
        NButton,
        {
          quaternary: true,
          size: 'small',
          onClick: () => handleViewUserConversations(row.userId),
        },
        {
          default: () => '查看对话',
          icon: () => h(NIcon, null, { default: () => h(IconChat) }),
        },
      ),
      h(
        NPopconfirm,
        {
          onPositiveClick: () => handleDeleteUserState(row.userId.toString()),
        },
        {
          trigger: () => h(
            NButton,
            {
              quaternary: true,
              size: 'small',
              type: 'error',
            },
            {
              default: () => '删除',
              icon: () => h(NIcon, null, { default: () => h(IconDelete) }),
            },
          ),
          default: () => '确定要删除此用户状态吗？此操作不可撤销。',
        },
      ),
    ],
  },
]

onMounted(() => {
  loadUserStates()
})
</script>

<template>
  <div>
    <NCard title="用户状态管理">
      <template #header-extra>
        <NButton type="primary" @click="loadUserStates">
          刷新
        </NButton>
      </template>

      <NSpin :show="loading">
        <NDataTable
          :columns="columns"
          :data="userStates"
          :bordered="false"
          striped
        />
      </NSpin>
    </NCard>

    <!-- User Conversations Drawer -->
    <NDrawer v-model:show="drawerVisible" :width="500">
      <NDrawerContent title="用户对话列表" closable>
        <div v-if="selectedUserConversations.length === 0" class="flex justify-center items-center py-8">
          <NEmpty description="该用户没有对话记录" />
        </div>

        <NList v-else>
          <NListItem v-for="conversation in selectedUserConversations" :key="conversation.id">
            <NFlex justify="space-between" align="center">
              <div>
                <NText>{{ conversation.name }}</NText>
              </div>
              <div>
                <NButton
                  text
                  type="primary"
                  @click="handleViewConversation(conversation)"
                >
                  <template #icon>
                    <NIcon><IconEye /></NIcon>
                  </template>
                  查看详情
                </NButton>
              </div>
            </NFlex>
          </NListItem>
        </NList>
      </NDrawerContent>
    </NDrawer>

    <!-- Conversation Detail Drawer -->
    <ConversationDetailDrawer
      v-model:show="conversationDetailVisible"
      :conversation="selectedConversation"
      :history="conversationHistory"
      :loading="historyLoading"
    />
  </div>
</template>

<style scoped>
.flex {
  display: flex;
}
.justify-center {
  justify-content: center;
}
.items-center {
  align-items: center;
}
.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}
</style>
