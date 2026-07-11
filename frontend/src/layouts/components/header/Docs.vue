<script setup lang="ts">
function openDocs() {
  window.open('https://docs.chaite.cloud/', '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <n-tooltip trigger="hover">
    <template #trigger>
      <n-button text circle aria-label="打开 Chaite 文档" @click="openDocs">
        <template #icon>
          <icon-park-outline-book-open />
        </template>
      </n-button>
    </template>
    Chaite 文档
  </n-tooltip>
</template>
