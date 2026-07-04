<script lang="ts" setup>
import { NCard, NCode, NCollapse, NCollapseItem, NImage, NTag, NText } from 'naive-ui'
import { computed } from 'vue'

interface Props {
  message: Model.HistoryMessage
}

const props = defineProps<Props>()

// Check for tool calls
const hasToolCalls = computed(() => {
  return props.message.toolCalls && props.message.toolCalls.length > 0
})

// Check for tool results
const hasToolResults = computed(() => {
  return props.message.role === 'tool' && props.message.content && props.message.content.length > 0
})

// Process the content based on its type
const processedContent = computed(() => {
  if (!props.message.content || !Array.isArray(props.message.content))
    return []

  return props.message.content.map((item) => {
    if (typeof item === 'string')
      return { type: 'text', text: item }
    return item
  })
})

// Role-based styling
const messageType = computed(() => {
  switch (props.message.role) {
    case 'user': return 'info'
    case 'assistant': return 'success'
    case 'system': return 'warning'
    case 'developer': return 'default'
    case 'tool': return 'error'
    default: return 'default'
  }
})

// Role display name
const roleDisplayName = computed(() => {
  switch (props.message.role) {
    case 'user': return '用户'
    case 'assistant': return 'AI助手'
    case 'system': return '系统'
    case 'developer': return '开发者'
    case 'tool': return '工具'
    default: return props.message.role
  }
})

const formattedDate = computed(() => {
  if (!props.message.createdAt)
    return ''
  return new Date(props.message.createdAt).toLocaleString()
})

// Check if a string is a valid image URL
function isImageUrl(str) {
  return /^(https?:\/\/|data:image\/)/.test(str)
}

// Check if a string is a base64 encoded image
function isBase64Image(str) {
  return /^data:image\/[a-zA-Z+]+;base64,/.test(str)
}

// Token count
const tokenCount = computed(() => {
  return props.message.token_count || 0
})
</script>

<template>
  <NCard :bordered="false" size="small" class="message-card">
    <template #header>
      <div class="flex justify-between">
        <NTag :type="messageType">
          {{ roleDisplayName }}
        </NTag>
        <div class="metadata">
          <NTag size="small">
            {{ formattedDate }}
          </NTag>
          <NTag v-if="tokenCount > 0" size="small">
            Token: {{ tokenCount }}
          </NTag>
        </div>
      </div>
    </template>

    <!-- Content rendering based on type -->
    <div class="message-content">
      <template v-for="(item, index) in processedContent" :key="index">
        <!-- Text content -->
        <div v-if="item.type === 'text'" class="text-content">
          <NText>{{ item.text }}</NText>
        </div>

        <!-- Image content -->
        <div v-else-if="item.type === 'image'" class="image-content">
          <NImage
            v-if="isImageUrl(item.image) || isBase64Image(item.image)"
            :src="item.image"
            :width="400"
            object-fit="contain"
            :preview-disabled="false"
            class="message-image"
          />
          <NText v-else type="info">
            [图像数据无法显示]
          </NText>
        </div>

        <!-- Reasoning content -->
        <div v-else-if="item.type === 'reasoning'" class="reasoning-content">
          <NCollapse>
            <NCollapseItem title="推理过程">
              <NText class="reasoning-text">
                {{ item.text }}
              </NText>
            </NCollapseItem>
          </NCollapse>
        </div>

        <!-- Tool content (when displayed as part of content) -->
        <div v-else-if="item.type === 'tool'" class="tool-content">
          <div class="tool-call-header">
            <NTag v-if="item.name" type="info">
              {{ item.name }}
            </NTag>
            <NTag v-else type="info">
              Tool Result
            </NTag>
          </div>
          <NCode
            :code="typeof item.content === 'string' ? item.content : JSON.stringify(item.content, null, 2)"
            language="json"
          />
        </div>

        <!-- Unsupported types -->
        <div v-else class="unsupported-content">
          <NText type="info">
            [{{ item.type }} 类型内容]
          </NText>
        </div>
      </template>
    </div>

    <!-- Tool calls section -->
    <NCollapse v-if="hasToolCalls">
      <NCollapseItem title="工具调用">
        <div v-for="(toolCall, index) in message.toolCalls" :key="index" class="tool-call">
          <div class="tool-call-header">
            <NTag type="info">
              {{ toolCall.function.name }}
            </NTag>
          </div>
          <NCode
            :code="typeof toolCall.function.arguments === 'string'
              ? JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2)
              : JSON.stringify(toolCall.function.arguments, null, 2)"
            language="json"
          />
        </div>
      </NCollapseItem>
    </NCollapse>

    <!-- Tool results section -->
    <NCollapse v-if="hasToolResults">
      <NCollapseItem title="工具结果">
        <div v-for="(result, index) in message.content" :key="index" class="tool-result">
          <div v-if="result.name || result.tool_call_id" class="tool-result-header">
            <NTag v-if="result.name" type="info">
              {{ result.name }}
            </NTag>
            <NTag v-if="result.tool_call_id" type="warning">
              ID: {{ result.tool_call_id }}
            </NTag>
          </div>
          <NCode
            :code="typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2)"
            language="json"
          />
        </div>
      </NCollapseItem>
    </NCollapse>
  </NCard>
</template>

<style scoped>
.message-card {
  margin-bottom: 12px;
  width: 100%;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.metadata {
  display: flex;
  gap: 8px;
}

.message-content {
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.text-content, .image-content, .reasoning-content, .tool-content {
  margin-bottom: 8px;
}

.reasoning-text {
  font-family: monospace;
  background-color: rgba(0, 0, 0, 0.03);
  padding: 8px;
  border-radius: 4px;
  display: block;
}

.message-image {
  max-width: 100%;
  border-radius: 4px;
}

.tool-call, .tool-result {
  margin-bottom: 12px;
}

.tool-call-header, .tool-result-header {
  margin-bottom: 4px;
  display: flex;
  gap: 8px;
}
</style>
