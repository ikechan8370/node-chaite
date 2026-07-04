<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import { NButton, NDropdown, NFlex, NGrid, NPopover, NSpace, NTag, useMessage } from 'naive-ui'
import { h, onMounted, reactive, ref } from 'vue'
import IconLinkCloudSuccess from '~icons/icon-park-outline/cloudy'
import type { ListChannels } from '@/service/api/channels'
import { createChanel, deleteChanel, fetchChannelList, updateChannel } from '@/service/api/channels'
import ChannelFormModal from './ChannelFormModal.vue'
import ChannelModel = Shareable.ChannelModel

function createColumns({
  play,
  edit,
  remove,
}: {
  play: (row: ChannelModel) => void
  edit: (row: ChannelModel) => void
  remove: (row: ChannelModel) => void
}): DataTableColumns<ChannelModel> {
  return [
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
                  label: model,
                  key: model,
                }
              }),
              onSelect: () => play(row),
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
const data = reactive({ value: [] as ChannelModel[] })
const filter = reactive({ value: {} as ListChannels })
const loading = ref(false)
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
  fetchChannelList(filter).then((res) => {
    data.value = res.data
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
  play(row) {
    message.warning(`测试渠道: ${row.name}，暂未实现`)
  },
  edit(row) {
    handleEditChannel(row)
  },
  remove(row) {
    handleRemoveChannel(row)
  },
})

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
  <div>
    <NSpace vertical size="large">
      <n-card>
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
      <n-card>
        <NSpace vertical size="large">
          <div class="flex gap-4">
            <NButton type="primary" @click="handleAddChannel">
              <template #icon>
                <icon-park-outline-add-one />
              </template>
              新建渠道
            </NButton>
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
          <n-data-table :columns="columns" :data="data.value" :loading="loading" />
        </NSpace>
      </n-card>
    </NSpace>

    <!-- Use the extracted ChannelFormModal component -->
    <ChannelFormModal
      v-model:show="showModal"
      :edit-mode="editMode"
      :initial-data="currentChannel"
      :pre-processor-options="preProcessorOptions"
      :post-processor-options="postProcessorOptions"
      @submit="handleSubmitChannel"
    />
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
