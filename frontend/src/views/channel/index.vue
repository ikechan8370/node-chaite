<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import { NButton, NCheckbox, NDropdown, NFlex, NGrid, NModal, NPopover, NSpace, NTag, NText, useMessage } from 'naive-ui'
import { h, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import IconLinkCloudSuccess from '~icons/icon-park-outline/cloudy'
import type { ListChannels } from '@/service/api/channels'
import { createChanel, deleteChanel, fetchAllChannelList, updateChannel, testChannel, autoDetectFeatures, type TestChannelResult } from '@/service/api/channels'
import ChannelFormModal from './ChannelFormModal.vue'
import ChannelModel = Shareable.ChannelModel

function createColumns({
  play,
  edit,
  clone,
  continueSetup,
  remove,
}: {
  play: (row: ChannelModel, model?: string) => void
  edit: (row: ChannelModel) => void
  clone: (row: ChannelModel) => void
  continueSetup: (row: ChannelModel) => void
  remove: (row: ChannelModel) => void
}): DataTableColumns<ChannelModel> {
  return [
    { type: 'selection' },
    {
      title: 'ID',
      key: 'id',
    },
    {
      title: '名称',
      key: 'name',
      render(row: ChannelModel) {
        const children = [row.name] as any[]
        if (row.uploader) {
          children.push(h(NPopover, { trigger: 'hover' }, { trigger: () => h(IconLinkCloudSuccess, { style: { color: 'green' } }), default: () => '云端预设' }))
        }
        return h(NFlex, { align: 'center' }, { default: () => children })
      },
    },
    {
      title: '状态',
      key: 'status',
      render(row: ChannelModel) {
        return row.status === 'enabled'
          ? h(NTag, { type: 'success' }, { default: () => '启用' })
          : h(NPopover, { trigger: 'hover' }, { trigger: h(NTag, { type: 'error' }, { default: () => '禁用' }), default: () => row.disabledReason })
      },
    },
    // {
    //   title: '描述',
    //   key: 'description',
    // },
    {
      title: '类型',
      key: 'adapterType',
      render(row: ChannelModel) {
        const iconMap = {
          openai: h('div', { style: { display: 'flex', alignItems: 'center', userSelect: 'none' } }, [
            h('img', {
              src: new URL('@/assets/svg/openai.svg', import.meta.url).href,
              alt: 'OpenAI',
              style: 'width: 13px; -webkit-user-drag: none',
            }),
            h('img', {
              src: new URL('@/assets/svg/openai-text.svg', import.meta.url).href,
              alt: 'OpenAI',
              style: 'width: 50px; margin-left: 5px; margin-top: 2px; -webkit-user-drag: none',
            }),
          ]),
          gemini: h('img', {
            src: new URL('@/assets/svg/gemini-full.png', import.meta.url).href,
            alt: 'Gemini',
            style: 'width: 69px; -webkit-user-drag: none',
          }),
          claude: h('img', {
            src: new URL('@/assets/svg/claude-full.svg', import.meta.url).href,
            alt: 'Claude',
            style: 'width: 69px; -webkit-user-drag: none',
          }),
        }

        // const nameMap = {
        //   openai: 'OpenAI',
        //   gemini: 'Gemini',
        //   claude: 'Claude',
        // }

        return h('div', {}, {
          default: () => [
            iconMap[row.adapterType as keyof typeof iconMap] || '',
            // h('span', { style: 'margin-left: 8px;' }, nameMap[row.adapterType as keyof typeof nameMap] || row.adapterType),
          ],
        })
      },
    },
    {
      title: '优先级',
      key: 'priority',
    },
    {
      title: '权重',
      key: 'weight',
    },
    {
      title: '上传者',
      key: 'uploader',
      render(row: ChannelModel) {
        return row.uploader ? h(NTag, { type: 'info' }, { default: () => row.uploader?.username }) : ''
      },
    },
    {
      title: '更新日期',
      key: 'updatedAt',
    },
    {
      title: '创建日期',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'actions',
      render(row: ChannelModel) {
        return [
          h(
            NDropdown,
            {
              trigger: 'hover',
              options: row.models.map((model) => {
                return {
                  label: model.name || model,
                  key: model.name || model,
                }
              }),
              onSelect: (key: string) => play(row, key),
            },
            { default: () => h(
              NButton,
              {
                type: 'primary',
                strong: true,
                tertiary: true,
                size: 'small',
                onClick: () => play(row),
              },
              { default: () => '测试' },
            ) },
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
          h(NButton, { strong: true, tertiary: true, size: 'small', onClick: () => clone(row) }, { default: () => '复制' }),
          h(NButton, { strong: true, tertiary: true, size: 'small', type: 'success', onClick: () => continueSetup(row) }, { default: () => '创建预设' }),
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

const message = useMessage()
const router = useRouter()
const data = reactive({ value: [] as ChannelModel[] })
const filter = reactive({ value: {} as ListChannels })
const loading = ref(false)
const checkedRowKeys = ref<Array<string | number>>([])
const showModal = ref(false)
const editMode = ref(false)
const defaultChannel = {
  modelType: 'settings',
  name: '',
  embedded: false,
  description: '',
  options: {
    baseUrl: '',
    apiKey: [],
  },
  adapterType: 'openai',
  models: [],
  weight: 1,
  priority: 0,
  status: 'enabled',
} as ChannelModel
const currentChannel = ref<ChannelModel>(JSON.parse(JSON.stringify(defaultChannel)) as ChannelModel)

// 处理器选项 - 这里用空数据，后续会通过API获取
const preProcessorOptions = ref([])
const postProcessorOptions = ref([])

// 搜索相关
const searchModel = reactive({
  name: undefined,
  type: undefined,
  status: undefined,
  model: undefined,
} as ListChannels)

function fetchChannels(filter: ListChannels) {
  loading.value = true
  fetchAllChannelList(filter).then((items) => {
    data.value = items
    loading.value = false
  }).catch((err) => {
    console.error(err)
    loading.value = false
  })
}

function handleResetSearch() {
  searchModel.name = undefined
  searchModel.type = undefined
  searchModel.model = undefined
  searchModel.status = undefined
  fetchChannels(searchModel)
}

function handleAddChannel() {
  editMode.value = false
  currentChannel.value = JSON.parse(JSON.stringify(defaultChannel)) as ChannelModel
  showModal.value = true
}

function handleEditChannel(row: ChannelModel) {
  editMode.value = true
  console.error(row)
  currentChannel.value = { ...row }
  showModal.value = true
}

function handleCloneChannel(row: ChannelModel) {
  editMode.value = false
  const copy = JSON.parse(JSON.stringify(row)) as ChannelModel
  delete copy.id
  copy.name = `${row.name} 副本`
  currentChannel.value = copy
  showModal.value = true
}

function handleRemoveChannel(row: ChannelModel) {
  window.$dialog.warning({
    title: '确认删除',
    content: `确定要删除渠道 "${row.name}" 吗？此操作不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: () => {
      loading.value = true
      // 假设这里是后端 API 调用，需要实际添加 API 函数
      deleteChanel(row.id as string)
        .then((res) => {
          if (res.code === 0) {
            message.success('删除成功')
            fetchChannels(searchModel) // 刷新列表
          }
          else {
            message.error(res.message || '删除失败')
          }
        })
        .catch((err) => {
          message.error(err.message || '删除操作发生错误')
        })
        .finally(() => {
          loading.value = false
        })
    },
  })
}

function handleSubmitChannel(channelData: Partial<Shareable.ChannelModel>) {
  loading.value = true
  const action = editMode.value && channelData.id
    ? updateChannel(channelData.id, channelData)
    : createChanel(channelData as ChannelModel)
  action.then((res) => {
    if (res.code === 0) {
      message.success(editMode.value ? '更新成功' : '创建成功')
      fetchChannels(searchModel)
    }
    else {
      message.error(res.message)
    }
    loading.value = false
    showModal.value = false
  }).catch((err) => {
    message.error(err.message || '操作失败')
    loading.value = false
  })
}

const columns = createColumns({
  play(row, model?: string) {
    handleTestChannel(row, model || row.models[0]?.name || '')
  },
  edit(row) {
    handleEditChannel(row)
  },
  clone(row) {
    handleCloneChannel(row)
  },
  continueSetup(row) {
    router.push({ path: '/quick-setup', query: { channelId: row.id } })
  },
  remove(row) {
    handleRemoveChannel(row)
  },
})

// ─── Test channel ───
const testLoading = ref(false)
const testResult = ref<TestChannelResult | null>(null)
const showTestModal = ref(false)
const testedChannelName = ref('')
const testedModel = ref('')

async function handleTestChannel(row: ChannelModel, model: string) {
  if (!row.id) return
  testedChannelName.value = row.name
  testedModel.value = model
  testLoading.value = true
  testResult.value = null
  showTestModal.value = true
  try {
    const res = await testChannel({ id: row.id, model })
    testResult.value = res.data
  } catch (e: any) {
    testResult.value = { success: false, model, elapsed: 0, error: e?.message || 'Request failed' }
  } finally {
    testLoading.value = false
  }
}

async function handleBatchTest() {
  const selected = data.value.filter(row => row.id && checkedRowKeys.value.includes(row.id))
  if (!selected.length) { message.warning('请先选择渠道'); return }
  loading.value = true
  let passed = 0
  let cursor = 0
  const worker = async () => {
    while (cursor < selected.length) {
      const row = selected[cursor++]
      const model = row.models[0]?.name
      if (!model || !row.id) continue
      try { const rsp = await testChannel({ id: row.id, model }); if (rsp.data?.success) passed++ } catch {}
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, selected.length) }, worker))
  loading.value = false
  message[passed === selected.length ? 'success' : 'warning'](`测试完成：${passed}/${selected.length} 个渠道可用`)
}

async function handleBatchStatus(status: 'enabled' | 'disabled') {
  const selected = data.value.filter(row => row.id && checkedRowKeys.value.includes(row.id))
  if (!selected.length) { message.warning('请先选择渠道'); return }
  loading.value = true
  await Promise.all(selected.map(row => updateChannel(row.id as string, { ...row, status })))
  checkedRowKeys.value = []
  await fetchChannels(searchModel)
  message.success(`已${status === 'enabled' ? '启用' : '停用'} ${selected.length} 个渠道`)
}

// ─── Auto-detect features ───
const autoDetectLoading = ref(false)

async function handleAutoDetect(row: ChannelModel, model?: string) {
  if (!row.id) return
  const m = model || row.models[0]
  if (!m) { message.warning('请先添加模型'); return }
  autoDetectLoading.value = true
  try {
    const res = await autoDetectFeatures({ id: row.id, model: m })
    if (res.code === 0) {
      // Open edit modal with auto-detected features
      const detectedFeatures: string[] = []
      for (const [key, val] of Object.entries(res.data.features)) {
        if (val.supported) detectedFeatures.push(key)
      }
      currentChannel.value = { ...row, options: { ...row.options, features: detectedFeatures as any } }
      editMode.value = true
      showModal.value = true
      message.success(`自动探测完成: ${detectedFeatures.join(', ') || '无'}`)
    } else {
      message.error(res.message || '探测失败')
    }
  } catch (e: any) {
    message.error(e?.message || '探测失败')
  } finally {
    autoDetectLoading.value = false
  }
}

onMounted(() => {
  fetchChannels(filter.value)
})

const filterAdapterOptions = computed(() => {
  return [
    {
      label: '全部',
      value: undefined,
    },
    {
      label: 'OpenAI',
      value: 'openai',
    },
    {
      label: 'Gemini',
      value: 'gemini',
    },
    {
      label: 'Claude',
      value: 'claude',
    },
  ]
})

const filterStatusOptions = computed(() => {
  return [
    {
      label: '全部',
      value: undefined,
    },
    {
      label: '正常',
      value: 'enabled',
    },
    {
      label: '禁用',
      value: 'disabled',
    },
  ]
})
</script>

<template>
  <div class="chaite-page">
    <header class="chaite-page-header" data-tour="channels">
      <div><h1>渠道池</h1><p>集中管理模型连接、优先级、权重和可用状态。</p></div>
      <NButton type="primary" size="large" @click="handleAddChannel"><template #icon><icon-park-outline-add-one /></template>添加渠道</NButton>
    </header>
    <NSpace vertical size="large">
      <n-card class="chaite-panel" :bordered="false">
        <n-form ref="formRef" :model="searchModel" label-placement="left" inline :show-feedback="false">
          <NGrid cols="1 s:2 m:3 l:6" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
            <NFormItemGridItem span="1" label="名称" path="name">
              <n-input v-model:value="searchModel.name" placeholder="请输入要搜索的名称关键词" />
            </NFormItemGridItem>
            <NFormItemGridItem span="1" label="适配器" path="type">
              <n-select v-model:value="searchModel.type" :options="filterAdapterOptions" />
            </NFormItemGridItem>
            <NFormItemGridItem span="1" label="状态" path="status">
              <n-select v-model:value="searchModel.status" :options="filterStatusOptions" />
            </NFormItemGridItem>
            <NFormItemGridItem span="1" label="模型" path="model">
              <n-input v-model:value="searchModel.model" placeholder="请输入要搜索的模型" />
            </NFormItemGridItem>
            <NGridItem span="1">
              <NFlex class="ml-auto">
                <NButton type="primary" @click="fetchChannels(searchModel)">
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
        <NSpace vertical size="large">
          <div class="flex gap-4">
            <NButton type="primary" @click="handleAddChannel">
              <template #icon>
                <icon-park-outline-add-one />
              </template>
              新建渠道
            </NButton>
            <NButton secondary :disabled="!checkedRowKeys.length" @click="handleBatchTest">批量测试</NButton>
            <NButton secondary type="success" :disabled="!checkedRowKeys.length" @click="handleBatchStatus('enabled')">批量启用</NButton>
            <NButton secondary type="warning" :disabled="!checkedRowKeys.length" @click="handleBatchStatus('disabled')">批量停用</NButton>
            <NButton strong secondary type="info">
              <template #icon>
                <icon-park-outline-thunderstorm />
              </template>
              测试全部渠道
            </NButton>
            <NButton strong secondary type="error">
              <template #icon>
                <icon-park-outline-delete-five />
              </template>
              删除禁用渠道
            </NButton>
          </div>
          <n-data-table v-model:checked-row-keys="checkedRowKeys" :row-key="row => row.id" :columns="columns" :data="data.value" :loading="loading" :pagination="{ pageSize: 20, showSizePicker: true, pageSizes: [20, 50, 100] }" />
        </NSpace>
      </n-card>
    </NSpace>

    <!-- Channel Form Modal -->
    <ChannelFormModal
      v-model:show="showModal"
      :edit-mode="editMode"
      :initial-data="currentChannel"
      :pre-processor-options="preProcessorOptions"
      :post-processor-options="postProcessorOptions"
      @submit="handleSubmitChannel"
    />

    <!-- Test Result Modal -->
    <NModal v-model:show="showTestModal" preset="card" title="渠道测试" style="width: 500px; max-width: 90vw">
      <div v-if="testLoading" style="text-align: center; padding: 20px;">
        <NSpace vertical align="center">
          <NText>正在测试渠道 "{{ testedChannelName }}" 模型 "{{ testedModel }}"...</NText>
        </NSpace>
      </div>
      <div v-else-if="testResult" style="padding: 8px 0;">
        <NSpace vertical>
          <div>
            <NText strong>渠道: </NText>
            <NText>{{ testedChannelName }}</NText>
          </div>
          <div>
            <NText strong>模型: </NText>
            <NText>{{ testResult.model }}</NText>
          </div>
          <div>
            <NText strong>耗时: </NText>
            <NText>{{ testResult.elapsed }}ms</NText>
          </div>
          <div>
            <NText strong>状态: </NText>
            <NTag :type="testResult.success ? 'success' : 'error'">
              {{ testResult.success ? '✓ 成功' : '✗ 失败' }}
            </NTag>
          </div>
          <div v-if="testResult.success && testResult.response">
            <NText strong>响应: </NText>
            <NText depth="3">{{ testResult.response }}</NText>
          </div>
          <div v-if="!testResult.success && testResult.error">
            <NText strong>错误: </NText>
            <NText type="error">{{ testResult.error }}</NText>
          </div>
          <div v-if="testResult.success && testResult.usage">
            <NText strong>Token用量: </NText>
            <NText>{{ testResult.usage.totalTokens }}</NText>
          </div>
        </NSpace>
      </div>
    </NModal>
  </div>
</template>

<style scoped>
.ml-auto {
  margin-left: auto;
}
.flex {
  display: flex;
}
.gap-4 {
  gap: 1rem;
}
</style>
