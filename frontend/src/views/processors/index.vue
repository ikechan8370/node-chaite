<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import { NButton, NFlex, NGrid, NSpace, useMessage } from 'naive-ui'
import { h, onMounted, reactive, ref } from 'vue'
import type { ListProcessorDTO } from '@/service/api/processors'
import { createProcessor, deleteProcessor, fetchProcessorList, updateProcessor, uploadProcessorToCloud } from '@/service/api/processors'
import ProcessorFormModal from './ProcessorFormModal.vue'
import type { Shareable } from '@/typings/entities/shareable'

function createColumns({
  upload,
  edit,
  remove,
}: {
  upload: (row: Shareable.ProcessorModel) => void
  edit: (row: Shareable.ProcessorModel) => void
  remove: (row: Shareable.ProcessorModel) => void
}): DataTableColumns<Shareable.ProcessorModel> {
  return [
    {
      title: 'ID',
      key: 'id',
      resizable: true,
    },
    {
      title: '名称',
      key: 'name',
      render(row) {
        return h('div', {}, row.name)
      },
      resizable: true,
    },
    {
      title: '类型',
      key: 'type',
      width: 100,
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
const data = reactive({ value: [] as Shareable.ProcessorModel[] })
const showModal = ref(false)
const editMode = ref(false)
const defaultProcessor = {
  modelType: 'settings',
  name: '',
  code: '',
  description: '',
  uploader: undefined,
} as Shareable.ProcessorModel
const currentProcessor = ref<Shareable.ProcessorModel>(JSON.parse(JSON.stringify(defaultProcessor)))
const loading = ref(false)

function fetchProcessors(filter?: any) {
  loading.value = true
  fetchProcessorList(filter).then((res) => {
    data.value = res.data
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

function handleRemoveProcessor(row: Shareable.ProcessorModel) {
  window.$dialog.warning({
    title: '确认删除',
    content: `确定要删除处理器 "${row.name}" 吗？此操作不可恢复`,
    positiveText: '确认删除',
    onPositiveClick: () => {
      deleteProcessor(row.id as string).then((res) => {
        if (res.code === 0) {
          message.success('删除成功')
          fetchProcessors()
        }
      }).finally(() => (loading.value = false))
    },
  })
}

function handleSubmitProcessor(processorData: Shareable.ProcessorModel) {
  loading.value = true
  const action = editMode.value && processorData.id
    ? updateProcessor(processorData.id, processorData)
    : createProcessor(processorData)
  action.then((res) => {
    if (res.code === 0) {
      message.success(editMode.value ? '修改成功' : '创建成功')
      fetchProcessors()
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
    uploadProcessorToCloud(row as { id: string }).then((res) => {
      if (res.code === 0) {
        message.success('上传成功')
        fetchProcessors()
      }
    })
  },
  edit(row) {
    editMode.value = true
    currentProcessor.value = { ...row }
    showModal.value = true
  },
  remove: handleRemoveProcessor,
})

function handleAddProcessor() {
  editMode.value = false
  currentProcessor.value = JSON.parse(JSON.stringify(defaultProcessor)) as Shareable.ProcessorModel
  showModal.value = true
}

onMounted(() => {
  fetchProcessors()
})

// 搜索相关
const searchModel = reactive({
  name: undefined,
} as ListProcessorDTO)

function handleResetSearch() {
  searchModel.name = undefined
  fetchProcessors(searchModel)
}
</script>

<template>
  <NSpace vertical size="large">
    <n-card>
      <n-form :model="searchModel" label-placement="left" inline :show-feedback="false">
        <NGrid cols="1 s:2 m:3 l:6" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
          <NFormItemGridItem span="1" label="名称" path="name">
            <n-input v-model:value="searchModel.name" placeholder="请输入要搜索的名称关键词" />
          </NFormItemGridItem>
          <NGridItem span="1">
            <NFlex class="ml-auto">
              <NButton type="primary" @click="fetchProcessors(searchModel)">
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
          <NButton type="primary" @click="handleAddProcessor">
            <template #icon>
              <icon-park-outline-add-one />
            </template>
            新建处理器
          </NButton>
        </div>
        <n-data-table :columns="columns" :data="data.value" :loading="loading" />
      </NSpace>
    </n-card>

    <ProcessorFormModal
      v-model:show="showModal"
      :edit-mode="editMode"
      :initial-data="currentProcessor"
      @submit="handleSubmitProcessor"
    />
  </NSpace>
</template>
