<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import { NButton, NFlex, NGrid, NSpace, useMessage } from 'naive-ui'
import { h, onMounted, reactive, ref } from 'vue'
import { createTrigger, deleteTrigger, fetchTriggerList, updateTrigger, uploadTriggerToCloud } from '@/service/api/triggers'
import TriggerFormModal from './TriggerFormModal.vue'

function createColumns({
  upload,
  edit,
  remove,
}: {
  upload: (row: Shareable.TriggerModel) => void
  edit: (row: Shareable.TriggerModel) => void
  remove: (row: Shareable.TriggerModel) => void
}): DataTableColumns<Shareable.TriggerModel> {
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
      title: '描述',
      key: 'description',
      width: 300,
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render(row) {
        return h(
          'div',
          {
            class: row.status === 'enabled' ? 'text-success' : 'text-error',
          },
          row.status === 'enabled' ? '启用' : '禁用',
        )
      },
    },
    {
      title: '一次性触发',
      key: 'isOneTime',
      width: 100,
      render(row) {
        return h('div', {}, row.isOneTime ? '是' : '否')
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
const data = reactive({ value: [] as Shareable.TriggerModel[] })
const showModal = ref(false)
const editMode = ref(false)
const defaultTrigger: Shareable.TriggerModel = {
  modelType: 'settings',
  name: '',
  code: '',
  description: '',
  embedded: false,
  status: 'enabled',
  isOneTime: false,
}
const currentTrigger = ref<Shareable.TriggerModel>(JSON.parse(JSON.stringify(defaultTrigger)))
const loading = ref(false)

function fetchTriggers(filter?: any) {
  loading.value = true
  fetchTriggerList(filter).then((res) => {
    data.value = res.data.items || res.data
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

function handleRemoveTrigger(row: Shareable.TriggerModel) {
  window.$dialog.warning({
    title: '确认删除',
    content: `确定要删除触发器 "${row.name}" 吗？此操作不可恢复`,
    positiveText: '确认删除',
    onPositiveClick: () => {
      deleteTrigger(row.id as string).then((res) => {
        if (res.code === 0) {
          message.success('删除成功')
          fetchTriggers()
        }
      }).finally(() => (loading.value = false))
    },
  })
}

function handleSubmitTrigger(triggerData: Shareable.TriggerModel) {
  loading.value = true
  const action = editMode.value && triggerData.id
    ? updateTrigger(triggerData.id, triggerData)
    : createTrigger(triggerData)
  action.then((res) => {
    if (res.code === 0) {
      message.success(editMode.value ? '修改成功' : '创建成功')
      fetchTriggers()
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
    uploadTriggerToCloud(row as { id: string }).then((res) => {
      if (res.code === 0) {
        message.success('上传成功')
        fetchTriggers()
      }
    })
  },
  edit(row) {
    editMode.value = true
    currentTrigger.value = { ...row }
    showModal.value = true
  },
  remove: handleRemoveTrigger,
})

function handleAddTrigger() {
  editMode.value = false
  currentTrigger.value = JSON.parse(JSON.stringify(defaultTrigger)) as Shareable.TriggerModel
  showModal.value = true
}

onMounted(() => {
  fetchTriggers()
})

// 搜索相关
const searchModel = reactive<Shareable.ListTriggerDTO>({
  name: undefined,
  status: undefined,
  isOneTime: undefined,
})

function handleResetSearch() {
  searchModel.name = undefined
  searchModel.status = undefined
  searchModel.isOneTime = undefined
  fetchTriggers(searchModel)
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
          <NFormItemGridItem span="1" label="状态" path="status">
            <n-select
              v-model:value="searchModel.status"
              placeholder="请选择状态"
              :options="[
                { label: '启用', value: 'enabled' },
                { label: '禁用', value: 'disabled' },
              ]"
              clearable
            />
          </NFormItemGridItem>
          <NFormItemGridItem span="1" label="一次性" path="isOneTime">
            <n-select
              v-model:value="searchModel.isOneTime"
              placeholder="请选择是否一次性"
              :options="[
                { label: '是', value: true },
                { label: '否', value: false },
              ]"
              clearable
            />
          </NFormItemGridItem>
          <NGridItem span="1">
            <NFlex class="ml-auto">
              <NButton type="primary" @click="fetchTriggers(searchModel)">
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
          <NButton type="primary" @click="handleAddTrigger">
            <template #icon>
              <icon-park-outline-add-one />
            </template>
            新建触发器
          </NButton>
        </div>
        <n-data-table :columns="columns" :data="data.value" :loading="loading" />
      </NSpace>
    </n-card>

    <TriggerFormModal
      v-model:show="showModal"
      :edit-mode="editMode"
      :initial-data="currentTrigger"
      @submit="handleSubmitTrigger"
    />
  </NSpace>
</template>
