<script lang="ts" setup>
import { NDivider, NDrawer, NDrawerContent, NEmpty, NSpin, NTimeline, NTimelineItem } from 'naive-ui'
import type { Conversation } from '@/service/api/history'
import { computed } from 'vue'
import MessageContentCard from './MessageContentCard.vue'

// Define HistoryMessage interface directly
interface HistoryMessage {
  id: string
  role: 'user' | 'assistant' | string
  content: string
  createdAt?: string
}

interface Props {
  show: boolean
  conversation: Conversation | null
  history: HistoryMessage[] // Using direct interface instead of Model namespace
  loading: boolean
}

interface Emits {
  (e: 'update:show', value: boolean): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()

function updateShow(value: boolean) {
  emits('update:show', value)
}

const sortedHistory = computed(() => {
  return [...props.history].sort((a, b) => {
    return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
  })
})
</script>

<template>
  <NDrawer :show="props.show" :width="800" @update:show="updateShow">
    <NDrawerContent
      :title="conversation ? `对话详情: ${conversation.name}` : '对话详情'"
      closable
    >
      <NSpin :show="loading">
        <div v-if="!conversation || history.length === 0" class="flex justify-center items-center py-8">
          <NEmpty description="无对话记录" />
        </div>

        <NTimeline v-else>
          <NTimelineItem
            v-for="(message, index) in sortedHistory"
            :key="message.id"
            :type="message.role === 'user' ? 'info' : 'success'"
            :title="message.role === 'user' ? '用户' : 'AI'"
            :time="message.createdAt"
          >
            <MessageContentCard :message="message" />

            <NDivider v-if="index < history.length - 1" />
          </NTimelineItem>
        </NTimeline>
      </NSpin>
    </NDrawerContent>
  </NDrawer>
</template>
