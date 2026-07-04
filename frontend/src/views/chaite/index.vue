<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  CloudOutline as IconParkOutlineCloud,
  DownloadOutline as IconParkOutlineDownload,
  LinkOutline as IconParkOutlineLink,
  SearchOutline as IconParkOutlineSearch,
} from '@vicons/ionicons5'
import type { Ref } from 'vue'
import {
  NButton,
  NCard,
  NCode,
  NDivider,
  NEllipsis,
  NEmpty,
  NGrid,
  NGridItem,
  NH2,
  NH3,
  NImage,
  NInput,
  NInputGroup,
  NModal,
  NPagination,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpace,
  NTag,
  NText,
} from 'naive-ui'
import { format } from 'date-fns'
import { downloadToolFromCloud, listToolsFromCloud } from '@/service/api/tools.js'
import { downloadProcessorFromCloud, listProcessorsFromCloud } from '@/service/api/processors.js'
import { downloadChannelFromCloud, listChannelsFromCloud } from '@/service/api/channels'
import { downloadPresetFromCloud, listPresetsFromCloud } from '@/service/api/presets'

const message = window.$message

// Resource types - removed 'all' option
const resourceTypes = [
  { label: '工具', value: 'tool' },
  { label: '处理器', value: 'processor' },
  { label: '预设', value: 'preset' },
  { label: '渠道', value: 'channel' },
]

// 配置
const defaultCoverImage = '/assets/default-resource.png'
const pageSize = ref(10)
const currentPage = ref(1)
const searchQuery = ref('')
const selectedResourceType = ref(resourceTypes[0].value)
// const selectedUploader = ref(null)
// const selectedTags = ref([])
const sortOption = ref('newest')
const showToolModal = ref(false)
const showProcessorModal = ref(false)
const showPresetModal = ref(false)
const showChannelModal = ref(false)
// const selectedResource = ref(null)

const totalTools = ref(0)
const totalProcessors = ref(0)
const totalPresets = ref(0)
const totalChannels = ref(0)

const selectedTool: Ref<Shareable.ToolModel | null> = ref(null)
const selectedProcessor: Ref<Shareable.ProcessorModel | null> = ref(null)
const selectedPreset: Ref<Shareable.PresetModel | null> = ref(null)
const selectedChannel: Ref<Shareable.ChannelModel | null> = ref(null)

// State for each resource type
const toolItems = ref([] as Shareable.ToolModel[])
const processorItems = ref([] as Shareable.ProcessorModel[])
const presetItems = ref([] as Shareable.PresetModel[])
const channelItems = ref([] as Shareable.ChannelModel[])

// Loading states
const toolsLoading = ref(false)
const processorsLoading = ref(false)
const presetsLoading = ref(false)
const channelsLoading = ref(false)

const totalItems = computed(() => {
  switch (selectedResourceType.value) {
    case 'tool':
      return totalTools.value
    case 'processor':
      return totalProcessors.value
    case 'preset':
      return totalPresets.value
    case 'channel':
      return totalChannels.value
    default:
      return 0
  }
})

const loading = computed(() => {
  switch (selectedResourceType.value) {
    case 'tool':
      return toolsLoading.value
    case 'processor':
      return processorsLoading.value
    case 'preset':
      return presetsLoading.value
    case 'channel':
      return channelsLoading.value
    default:
      return false
  }
})

function showResourceDetails(resource: Shareable.ToolModel | Shareable.ProcessorModel | Shareable.PresetModel | Shareable.ChannelModel) {
  switch (selectedResourceType.value) {
    case 'tool':
      selectedTool.value = resource as Shareable.ToolModel
      showToolModal.value = true
      break
    case 'processor':
      selectedProcessor.value = resource as Shareable.ProcessorModel
      showProcessorModal.value = true
      break
    case 'preset':
      selectedPreset.value = resource as Shareable.PresetModel
      showPresetModal.value = true
      break
    case 'channel':
      selectedChannel.value = resource as Shareable.ChannelModel
      showChannelModal.value = true
      break
    default:
      // Fallback to showing tool modal
      selectedTool.value = resource as Shareable.ToolModel
      showToolModal.value = true
  }
}

const sortOptions = [
  { label: '最新发布', value: 'newest' },
  { label: '热度最高', value: 'popular' },
  { label: '下载最多', value: 'downloads' },
]

const downloadedFilter = ref('all')

// 计算当前页要显示的资源
const displayedResources = computed(() => {
  let resources: any[] = []

  switch (selectedResourceType.value) {
    case 'tool':
      resources = toolItems.value
      break
    case 'processor':
      resources = processorItems.value
      break
    case 'preset':
      resources = presetItems.value
      break
    case 'channel':
      resources = channelItems.value
      break
    default:
      resources = []
  }

  // Apply downloaded filter
  if (downloadedFilter.value !== 'all') {
    const isDownloaded = downloadedFilter.value === 'downloaded'
    resources = resources.filter(item => Boolean(item.downloaded) === isDownloaded)
  }

  return resources
})

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / pageSize.value)
})

function formatDate(date: any) {
  if (!date)
    return 'Unknown'

  // If date is already formatted as a Chinese string
  if (typeof date === 'string' && (date.includes('年') || date.includes('月')))
    return date

  // Skip formatting for non-date values
  if (typeof date !== 'string' && !(date instanceof Date))
    return 'Invalid date'

  try {
    // Safe date parsing
    return format(new Date(date), 'yyyy-MM-dd')
  }
  catch {
    return String(date) || 'Invalid date'
  }
}

function getResourceTypeLabel(type: string) {
  switch (type) {
    case 'tool':
      return '工具'
    case 'processor':
      return '处理器'
    case 'preset':
      return '预设'
    case 'channel':
      return '渠道'
    default:
      return '未知类型'
  }
}

// function showResourceDetails(resource) {
//   selectedResource.value = resource
//   showModal.value = true
// }

function onPageSizeChange(size: number) {
  pageSize.value = size
  // 重置页码以防止超出范围
  if (currentPage.value > totalPages.value) {
    currentPage.value = 1
  }
}

function getResourceTypeTag(type: string) {
  switch (type) {
    case 'tool':
      return 'success'
    case 'processor':
      return 'info'
    case 'preset':
      return 'warning'
    case 'channel':
      return 'error'
    default:
      return 'default'
  }
}

// Download handlers for each resource type
async function handleDownloadTool(resource: Shareable.ToolModel) {
  try {
    const response = await downloadToolFromCloud({ id: resource.id as string })
    if (response.code === 0) {
      message.success('工具下载成功')
      showToolModal.value = false // Close modal
      fetchResourcesByType() // Refresh list
    }
    else {
      message.error(response.message || '下载失败')
    }
  }
  catch (error) {
    console.error('Failed to download tool:', error)
    message.error('下载失败')
  }
}

async function handleDownloadProcessor(resource: Shareable.ProcessorModel) {
  try {
    const response = await downloadProcessorFromCloud({ id: resource.id as string })
    if (response.code === 0) {
      message.success('处理器下载成功')
      showProcessorModal.value = false // Close modal
      fetchResourcesByType() // Refresh list
    }
    else {
      message.error(response.message || '下载失败')
    }
  }
  catch (error) {
    console.error('Failed to download processor:', error)
    message.error('下载失败')
  }
}

async function handleDownloadPreset(resource: Shareable.PresetModel) {
  try {
    const response = await downloadPresetFromCloud({ id: resource.id as string })
    if (response.code === 0) {
      message.success('预设下载成功')
      showPresetModal.value = false // Close modal
      fetchResourcesByType() // Refresh list
    }
    else {
      message.error(response.message || '下载失败')
    }
  }
  catch (error) {
    console.error('Failed to download preset:', error)
    message.error('下载失败')
  }
}

async function handleDownloadChannel(resource: Shareable.ChannelModel) {
  try {
    const response = await downloadChannelFromCloud({ id: resource.id as string })
    if (response.code === 0) {
      message.success('渠道下载成功')
      showChannelModal.value = false // Close modal
      fetchResourcesByType() // Refresh list
    }
    else {
      message.error(response.message || '下载失败')
    }
  }
  catch (error) {
    console.error('Failed to download channel:', error)
    message.error('下载失败')
  }
}

async function downloadResource(resource: Shareable.ToolModel | Shareable.ProcessorModel | Shareable.PresetModel | Shareable.ChannelModel) {
  try {
    await handleDownload(resource)

    // Refresh the list after downloading
    fetchResourcesByType()
  }
  catch (error) {
    console.error('Download failed:', error)
  }
}

// Generic download handler that routes to the appropriate type-specific handler
function handleDownload(resource: Shareable.ToolModel | Shareable.ProcessorModel | Shareable.PresetModel | Shareable.ChannelModel) {
  switch (selectedResourceType.value) {
    case 'tool':
      return handleDownloadTool(resource as Shareable.ToolModel)
    case 'processor':
      return handleDownloadProcessor(resource as Shareable.ProcessorModel)
    case 'preset':
      return handleDownloadPreset(resource as Shareable.PresetModel)
    case 'channel':
      return handleDownloadChannel(resource as Shareable.ChannelModel)
  }
}

// Fetch tools from cloud
async function fetchToolList() {
  toolsLoading.value = true
  try {
    const response = await listToolsFromCloud({
      filter: {},
      options: {
        page: currentPage.value,
        pageSize: pageSize.value,
        searchFields: ['name', 'description'],
      },
      query: searchQuery.value || '',
    })

    if (response.code === 0) {
      const result = response.data
      toolItems.value = result.items
      totalTools.value = result.pagination.totalItems
    }
    else {
      message.error(response.message || '获取工具列表失败')
    }
  }
  catch (error) {
    console.error('Failed to fetch tools:', error)
    message.error('获取工具列表失败')
  }
  finally {
    toolsLoading.value = false
  }
}

// Fetch processors from cloud
async function fetchProcessorList() {
  processorsLoading.value = true
  try {
    const response = await listProcessorsFromCloud({
      filter: {},
      options: {
        page: currentPage.value,
        pageSize: pageSize.value,
        searchFields: ['name', 'description'],
      },
      query: searchQuery.value || '',
    })

    if (response.code === 0) {
      const result = response.data
      processorItems.value = result.items
      totalProcessors.value = result.pagination.totalItems
    }
    else {
      message.error(response.message || '获取处理器列表失败')
    }
  }
  catch (error) {
    console.error('Failed to fetch processors:', error)
    message.error('获取处理器列表失败')
  }
  finally {
    processorsLoading.value = false
  }
}

// Fetch presets from cloud
async function fetchPresetList() {
  presetsLoading.value = true
  try {
    const response = await listPresetsFromCloud({
      filter: {},
      options: {
        page: currentPage.value,
        pageSize: pageSize.value,
        searchFields: ['name', 'description'],
      },
      query: searchQuery.value || '',
    })

    if (response.code === 0) {
      const result = response.data
      presetItems.value = result.items
      totalPresets.value = result.pagination.totalItems
    }
    else {
      message.error(response.message || '获取预设列表失败')
    }
  }
  catch (error) {
    console.error('Failed to fetch presets:', error)
    message.error('获取预设列表失败')
  }
  finally {
    presetsLoading.value = false
  }
}

function openExternalLink(url: string) {
  window?.open?.(url, '_blank')
}

// Fetch channels from cloud
async function fetchChannelList() {
  channelsLoading.value = true
  try {
    const response = await listChannelsFromCloud({
      filter: {},
      options: {
        page: currentPage.value,
        pageSize: pageSize.value,
        searchFields: ['name', 'description'],
      },
      query: searchQuery.value || '',
    })

    if (response.code === 0) {
      const result = response.data
      channelItems.value = result.items
      totalChannels.value = result.pagination.totalItems
    }
    else {
      message.error(response.message || '获取渠道列表失败')
    }
  }
  catch (error) {
    console.error('Failed to fetch channels:', error)
    message.error('获取渠道列表失败')
  }
  finally {
    channelsLoading.value = false
  }
}

function fetchResourcesByType() {
  switch (selectedResourceType.value) {
    case 'tool':
      fetchToolList()
      break
    case 'processor':
      fetchProcessorList()
      break
    case 'preset':
      fetchPresetList()
      break
    case 'channel':
      fetchChannelList()
      break
  }
}

function getDownloadStatusStyles(downloaded: string) {
  if (downloaded) {
    return {
      cardStyle: 'border: 2px solid var(--primary-color); box-shadow: 0 2px 8px rgba(0, 128, 255, 0.1);',
      tagType: 'success',
      tagText: '已下载',
      buttonText: '重新下载',
      buttonType: 'default',
    }
  }
  return {
    cardStyle: '',
    tagType: 'default',
    tagText: '未下载',
    buttonText: '下载资源',
    buttonType: 'primary',
  }
}

onMounted(() => {
  fetchResourcesByType()
})

watch([currentPage, pageSize, searchQuery, selectedResourceType, downloadedFilter], () => {
  // Reset to page 1 when filters change
  if (downloadedFilter.value !== 'all') {
    currentPage.value = 1
  }
  fetchResourcesByType()
})

// Top uploaders configuration
// const showAllUploaders = ref(false)

// Get top 5 uploaders based on number of uploads
// const topUploaders = computed(() => {
//   const uploaderCount = {}
//   mockResources.forEach((resource) => {
//     uploaderCount[resource.uploader] = (uploaderCount[resource.uploader] || 0) + 1
//   })
//
//   return Object.entries(uploaderCount)
//     .sort((a, b) => b[1] - a[1])
//     .slice(0, 5)
//     .map(([uploader]) => ({ label: uploader, value: uploader }))
// })
</script>

<template>
  <NSpace vertical size="large">
    <div style="display: flex; align-items: center; margin-bottom: 8px">
      <NH2 style="margin: 0; margin-right: 16px">
        资源社区
      </NH2>
      <div style="display: flex; align-items: center; gap: 8px">
        <NTag type="success" round size="small">
          <template #icon>
            <IconParkOutlineCloud />
          </template>
          api.chaite.cloud
        </NTag>
        <NTag
          type="info"
          round
          size="small"
          style="cursor: pointer"
          @click="openExternalLink('https://www.chaite.cloud')"
        >
          <template #icon>
            <IconParkOutlineLink />
          </template>
          www.chaite.cloud
        </NTag>
      </div>
    </div>

    <!-- Filter section - horizontal layout -->
    <NCard title="筛选条件">
      <NGrid :cols="4" :x-gap="16" :y-gap="16" responsive="screen">
        <!-- Resource Type Filter -->
        <NGridItem>
          <NSpace vertical size="small">
            <NText strong>
              资源类型
            </NText>
            <NRadioGroup v-model:value="selectedResourceType" name="resourceType">
              <NRadioButton v-for="type in resourceTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </NRadioButton>
            </NRadioGroup>
          </NSpace>
        </NGridItem>

        <!-- Download Status Filter -->
        <NGridItem>
          <NSpace vertical size="small">
            <NText strong>
              下载状态
            </NText>
            <NRadioGroup v-model:value="downloadedFilter" name="downloadedStatus">
              <NRadioButton value="all">
                全部
              </NRadioButton>
              <NRadioButton value="downloaded">
                已下载
              </NRadioButton>
              <NRadioButton value="notDownloaded">
                未下载
              </NRadioButton>
            </NRadioGroup>
          </NSpace>
        </NGridItem>

        <!-- Sort Option -->
        <NGridItem>
          <NSpace vertical size="small">
            <NText strong>
              排序方式
            </NText>
            <NSelect
              v-model:value="sortOption"
              :options="sortOptions"
              style="width: 100%"
            />
          </NSpace>
        </NGridItem>

        <!-- Search -->
        <NGridItem>
          <NSpace vertical size="small">
            <NText strong>
              搜索
            </NText>
            <NInputGroup>
              <NInput
                v-model:value="searchQuery"
                placeholder="搜索资源名称或描述..."
                clearable
              />
              <NButton type="primary" @click="fetchResourcesByType">
                <template #icon>
                  <IconParkOutlineSearch />
                </template>
                搜索
              </NButton>
            </NInputGroup>
          </NSpace>
        </NGridItem>
      </NGrid>
    </NCard>

    <!-- Resource display grid -->
    <NCard>
      <NSpace vertical>
        <NSpace vertical>
          <NGrid x-gap="16" y-gap="16" cols="1 s:2 m:3 l:4 xl:5" responsive="screen">
            <NGridItem v-for="resource in displayedResources" :key="resource.id">
              <NCard
                hoverable
                :style="getDownloadStatusStyles(resource.downloaded).cardStyle"
                @click="showResourceDetails(resource)"
              >
                <template #cover>
                  <div style="position: relative;">
                    <NImage
                      width="100%"
                      height="160"
                      :src="resource.coverImage || defaultCoverImage"
                      :fallback-src="defaultCoverImage"
                      :preview-disabled="true"
                      object-fit="cover"
                    />
                    <div
                      style="
            position: absolute;
            top: 8px;
            right: 8px;
            display: flex;
            gap: 4px;
            background-color: rgba(255,255,255,0.8);
            padding: 4px 8px;
            border-radius: 4px;
          "
                    >
                      <NTag :type="getResourceTypeTag(selectedResourceType)" size="small">
                        {{ getResourceTypeLabel(selectedResourceType) }}
                      </NTag>
                      <NTag v-if="resource.downloaded" type="success" size="small">
                        已下载
                      </NTag>
                    </div>
                  </div>
                </template>
                <NSpace vertical>
                  <NH3 style="margin-top: 0; margin-bottom: 4px">
                    <NEllipsis>{{ resource.name }}</NEllipsis>
                  </NH3>
                  <NEllipsis style="color: rgba(0, 0, 0, 0.6); min-height: 40px" :line-clamp="2">
                    {{ resource.description || '暂无描述' }}
                  </NEllipsis>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <NText depth="3" style="font-size: 0.85rem">
                      {{ resource.uploader.username }} · {{ formatDate(resource.updatedAt) }}
                    </NText>
                    <NButton
                      size="small"
                      :type="resource.downloaded ? 'default' : 'primary'"
                      @click.stop="downloadResource(resource)"
                    >
                      <template #icon>
                        <IconParkOutlineDownload />
                      </template>
                      {{ resource.downloaded ? '重新下载' : '下载' }}
                    </NButton>
                  </div>
                </NSpace>
              </NCard>
            </NGridItem>
          </NGrid>
        </NSpace>

        <!-- Empty state when no resources match filters -->
        <NEmpty v-if="!loading && displayedResources.length === 0" description="没有找到匹配的资源" />

        <!-- Pagination -->
        <NSpace justify="center" style="margin-top: 16px">
          <NPagination
            v-model:page="currentPage"
            :page-count="totalPages"
            :page-size="pageSize"
            show-size-picker
            :page-sizes="[10, 20, 30, 40]"
            @update:page-size="onPageSizeChange"
          />
        </NSpace>
      </NSpace>
    </NCard>

    <!-- Tool details modal -->
    <NModal
      v-model:show="showToolModal"
      preset="card"
      title="工具详情"
      style="width: 70%; max-width: 900px"
    >
      <template v-if="selectedTool">
        <NSpace vertical size="large">
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <div class="relative">
                <NImage
                  width="100%"
                  :src="defaultCoverImage"
                  :fallback-src="defaultCoverImage"
                />
                <div v-if="selectedTool.downloaded" class="absolute top-2 right-2">
                  <NTag type="success">
                    已下载
                  </NTag>
                </div>
              </div>
            </NGridItem>
            <NGridItem>
              <NSpace vertical>
                <NH2>{{ selectedTool.name }}</NH2>
                <NSpace>
                  <NTag size="large" :type="getResourceTypeTag('tool')">
                    {{ getResourceTypeLabel('tool') }}
                  </NTag>
                  <NTag v-if="selectedTool.downloaded" size="small" type="success">
                    已下载
                  </NTag>
                </NSpace>
                <NText>上传者: {{ selectedTool.uploader?.username }}</NText>
                <NText>上传日期: {{ selectedTool.updatedAt }}</NText>
                <NText>模型类型: {{ selectedTool.modelType || 'executable' }}</NText>
              </NSpace>
            </NGridItem>
          </NGrid>

          <NDivider />

          <NH3>资源描述</NH3>
          <div>{{ selectedTool.description }}</div>

          <NDivider />

          <NH3>代码</NH3>
          <NCode :code="selectedTool.code" language="javascript" word-wrap />
          <NSpace justify="end">
            <NButton
              :type="selectedTool.downloaded ? 'default' : 'primary'"
              @click="handleDownload(selectedTool)"
            >
              <template #icon>
                <IconParkOutlineDownload />
              </template>
              {{ selectedTool.downloaded ? '重新下载' : '下载工具' }}
            </NButton>
          </NSpace>
        </NSpace>
      </template>
    </NModal>

    <!-- Processor details modal -->
    <NModal
      v-model:show="showProcessorModal"
      preset="card"
      title="处理器详情"
      style="width: 70%; max-width: 900px"
    >
      <template v-if="selectedProcessor">
        <NSpace vertical size="large">
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NImage
                width="100%"
                :src="defaultCoverImage"
                :fallback-src="defaultCoverImage"
              />
            </NGridItem>
            <NGridItem>
              <NSpace vertical>
                <NH2>{{ selectedProcessor.name }}</NH2>
                <NSpace>
                  <NTag size="large" type="info">
                    处理器
                  </NTag>
                </NSpace>
                <NText>上传者: {{ selectedProcessor.uploader?.username }}</NText>
                <NText>更新日期: {{ selectedProcessor.updatedAt }}</NText>
                <NText v-if="selectedProcessor.type">
                  处理器类型: {{ selectedProcessor.type }}
                </NText>
              </NSpace>
            </NGridItem>
          </NGrid>

          <NDivider />

          <NH3>资源描述</NH3>
          <div>{{ selectedProcessor.description }}</div>

          <NDivider />

          <NH3>代码</NH3>
          <NCode :code="selectedProcessor.code" language="javascript" word-wrap />

          <NSpace justify="end">
            <NButton type="primary" @click="handleDownload(selectedProcessor)">
              <template #icon>
                <IconParkOutlineDownload />
              </template>
              下载资源
            </NButton>
          </NSpace>
        </NSpace>
      </template>
    </NModal>

    <!-- Preset details modal -->
    <NModal
      v-model:show="showPresetModal"
      preset="card"
      title="预设详情"
      style="width: 70%; max-width: 900px"
    >
      <template v-if="selectedPreset">
        <NSpace vertical size="large">
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NImage
                width="100%"
                :src="defaultCoverImage"
                :fallback-src="defaultCoverImage"
              />
            </NGridItem>
            <NGridItem>
              <NSpace vertical>
                <NH2>{{ selectedPreset.name }}</NH2>
                <NSpace>
                  <NTag size="large" type="warning">
                    预设
                  </NTag>
                  <NTag v-if="selectedPreset.modelType" size="small">
                    {{ selectedPreset.modelType }}
                  </NTag>
                </NSpace>
                <NText>上传者: {{ selectedPreset.uploader?.username }}</NText>
                <NText>更新日期: {{ selectedPreset.updatedAt }}</NText>
              </NSpace>
            </NGridItem>
          </NGrid>

          <NDivider />

          <NH3>资源描述</NH3>
          <div>{{ selectedPreset.description }}</div>

          <NDivider />

          <NH3>预设内容</NH3>
          <pre style="max-height: 300px; overflow: auto; background: #f5f5f5; padding: 12px; border-radius: 4px">{{ selectedPreset.sendMessageOption.systemOverride }}</pre>

          <NSpace justify="end">
            <NButton type="primary" @click="handleDownload(selectedPreset)">
              <template #icon>
                <IconParkOutlineDownload />
              </template>
              下载资源
            </NButton>
          </NSpace>
        </NSpace>
      </template>
    </NModal>

    <!-- Channel details modal -->
    <NModal
      v-model:show="showChannelModal"
      preset="card"
      title="渠道详情"
      style="width: 70%; max-width: 900px"
    >
      <template v-if="selectedChannel">
        <NSpace vertical size="large">
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NImage
                width="100%"
                :src="defaultCoverImage"
                :fallback-src="defaultCoverImage"
              />
            </NGridItem>
            <NGridItem>
              <NSpace vertical>
                <NH2>{{ selectedChannel.name }}</NH2>
                <NSpace>
                  <NTag size="large" type="error">
                    渠道
                  </NTag>
                  <NTag v-if="selectedChannel.adapterType" size="small">
                    {{ selectedChannel.adapterType }}
                  </NTag>
                </NSpace>
                <NText>上传者: {{ selectedChannel.uploader?.username }}</NText>
                <NText>更新日期: {{ selectedChannel.updatedAt }}</NText>
                <NText v-if="selectedChannel.options.baseUrl">
                  端点: {{ selectedChannel.options.baseUrl }}
                </NText>
              </NSpace>
            </NGridItem>
          </NGrid>

          <NDivider />

          <NH3>资源描述</NH3>
          <div>{{ selectedChannel.description }}</div>

          <NDivider />

          <NH3>配置信息</NH3>
          <pre style="max-height: 300px; overflow: auto; background: #f5f5f5; padding: 12px; border-radius: 4px">{{ JSON.stringify(selectedChannel.options || {}, null, 2) }}</pre>

          <NSpace justify="end">
            <NButton type="primary" @click="handleDownload(selectedChannel)">
              <template #icon>
                <IconParkOutlineDownload />
              </template>
              下载资源
            </NButton>
          </NSpace>
        </NSpace>
      </template>
    </NModal>
  </NSpace>
</template>
