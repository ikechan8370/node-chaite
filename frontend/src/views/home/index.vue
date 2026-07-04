<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import {
  fetchAllRepositoryData,
  fetchRepositoryCommits,
  getRepositoryCacheStatus,
} from './github'
import { NAvatar, NButton, NCard, NEmpty, NIcon, NResult, NSpin, NTag } from 'naive-ui'
import {
  BrushOutline,
  ChatbubblesOutline,
  CodeSlashOutline,
  EyeOutline,
  FlaskOutline,
  GitBranchOutline,
  LogoGithub,
  PeopleOutline,
  PricetagOutline,
  RefreshOutline,
  ServerOutline,
  SettingsOutline,
  StarOutline,
  StatsChartOutline,
  TimeOutline,
} from '@vicons/ionicons5'
import { useAuthStore } from '@/store/auth'
import DOMPurify from 'dompurify'
import { fetchSystemInfo } from '@/service'

const router = useRouter()
const authStore = useAuthStore()
const username = computed(() => authStore.userInfo?.userName || '管理员')

// GitHub repositories data
const repositories = [
  {
    owner: 'ikechan8370',
    name: 'chatgpt-plugin',
    displayName: 'ChatGPT Plugin',
    branch: 'v3',
  },
  {
    owner: 'ikechan8370',
    name: 'node-chaite',
    displayName: 'Chaite',
    branch: 'main',
  },
]

const loading = ref(false)
const error = ref('')
const activeRepoIndex = ref(0)
const repoCommits = ref<Record<string, any[]>>({})
const repoReleases = ref<Record<string, any[]>>({})
const refreshingCommits = ref(false)
const repoData = ref<Record<string, any>>({})

const currentRepo = computed(() => {
  const repo = repositories[activeRepoIndex.value]
  return repo ? repoData.value[repo.name] : null
})

// Format markdown
function formatMarkdown(text: string) {
  if (!text)
    return ''
  const html: string = marked.parse(text) as string
  return DOMPurify.sanitize(html)
}

// Time and date management
const currentTime = ref('')
const currentDate = ref('')
const greeting = ref('')
let clockInterval: number

function updateClock() {
  const now = new Date()
  const hours = now.getHours()

  // Update time
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Update date
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  currentDate.value = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  // Set greeting based on time
  if (hours < 12) {
    greeting.value = '早上好'
  }
  else if (hours < 18) {
    greeting.value = '下午好'
  }
  else {
    greeting.value = '晚上好'
  }
}

// Navigation items
const navigationItems = [
  {
    title: '系统配置',
    description: '配置系统参数和行为',
    route: '/config',
    icon: SettingsOutline,
    primary: true,
  },
  {
    title: '渠道管理',
    description: '查看和管理模型渠道',
    route: '/channels',
    icon: ChatbubblesOutline,
  },
  {
    title: '工具管理',
    description: '管理工具Agent',
    route: '/tools',
    icon: PeopleOutline,
  },
  {
    title: '预设管理',
    description: '创建和编辑对话预设',
    route: '/chat-preset',
    icon: BrushOutline,
  },
  {
    title: '处理器管理',
    description: '配置和管理前后处理器',
    route: '/processors',
    icon: FlaskOutline,
  },
  {
    title: '适配器管理',
    description: '配置和管理适配器',
    route: '/adapters',
    icon: StatsChartOutline,
  },
]

function navigateTo(route: string) {
  router.push(route)
}

// Format date
function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const day = 24 * 60 * 60 * 1000

  if (diff < day) {
    return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }
  else if (diff < 2 * day) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }
  else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`
  }
  else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
}
async function refreshCommits() {
  if (refreshingCommits.value)
    return

  refreshingCommits.value = true
  const currentRepo = repositories[activeRepoIndex.value]

  try {
    const commits = await fetchRepositoryCommits(currentRepo, true)
    repoCommits.value[currentRepo.name] = commits
  }
  catch (error) {
    console.error('Failed to refresh commits:', error)
  }
  finally {
    refreshingCommits.value = false
  }
}

// For loading initial data
async function loadAllRepoData(refresh = false) {
  loading.value = true
  error.value = ''

  try {
    for (const repo of repositories) {
      const { repository, commits, releases } = await fetchAllRepositoryData(repo, refresh)
      repoData.value[repo.name] = repository
      repoCommits.value[repo.name] = commits
      repoReleases.value[repo.name] = releases
    }
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
  }
  finally {
    loading.value = false
  }
}

// Get cache status for displaying in UI
function getCurrentRepoCacheStatus() {
  const repo = repositories[activeRepoIndex.value]
  if (!repo)
    return ''
  return getRepositoryCacheStatus(repo)
}

const systemInfo = ref<Entity.SystemInfo>()
async function getSystemInfo() {
  const infoRsp = await fetchSystemInfo()
  if (infoRsp.isSuccess) {
    systemInfo.value = infoRsp.data
  }
}

onMounted(() => {
  updateClock()
  getSystemInfo()
  clockInterval = window.setInterval(updateClock, 1000)
  loadAllRepoData()
})

onBeforeUnmount(() => {
  clearInterval(clockInterval)
})
</script>

<template>
  <div class="dashboard-container">
    <!-- Header with welcome message and time -->
    <div class="welcome-header">
      <div class="time-container">
        <div class="time">
          {{ currentTime }}
        </div>
        <div class="date">
          {{ currentDate }}
        </div>
      </div>
      <div class="greeting-container">
        <h1 class="greeting">
          {{ greeting }}, {{ systemInfo?.user?.username || username }}
        </h1>
        <p class="welcome-message">
          欢迎回到 ChatGPT 管理系统
          <span v-if="systemInfo?.version" class="version-badge">v{{ systemInfo.version }}</span>
        </p>
      </div>
    </div>

    <!-- Main content area -->
    <div class="content-container">
      <!-- Left panel with quick navigation -->
      <div class="nav-panel">
        <h2 class="panel-title">
          快捷导航
        </h2>

        <div class="nav-grid">
          <NCard
            v-for="nav in navigationItems"
            :key="nav.title"
            class="nav-card"
            :class="{ primary: nav.primary }"
            hoverable
            @click="navigateTo(nav.route)"
          >
            <div class="nav-icon">
              <NIcon :component="nav.icon" size="28" />
            </div>
            <div class="nav-title">
              {{ nav.title }}
            </div>
            <div class="nav-description">
              {{ nav.description }}
            </div>
          </NCard>
        </div>

        <!-- System status cards -->
        <div class="status-section">
          <div class="status-card online">
            <div class="status-icon">
              <NIcon :component="ServerOutline" size="20" />
            </div>
            <div class="status-text">
              系统状态: 在线
            </div>
          </div>
          <div class="status-card version">
            <div class="status-icon">
              <NIcon :component="CodeSlashOutline" size="20" />
            </div>
            <div class="status-text">
              当前版本: {{ systemInfo?.version || '3.0.0' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Right panel with GitHub updates -->
      <div class="content-panel">
        <h2 class="panel-title">
          GitHub 项目动态
        </h2>

        <div class="repo-tabs">
          <div
            v-for="(repo, index) in repositories"
            :key="repo.name"
            class="repo-tab"
            :class="{ active: activeRepoIndex === index }"
            @click="activeRepoIndex = index"
          >
            {{ repo.displayName }}
          </div>
        </div>

        <NSpin v-if="loading" :show="loading" class="repo-spinner">
          <template #description>
            加载中...
          </template>
        </NSpin>

        <div v-if="!loading && currentRepo" class="repo-container">
          <!-- Repository header -->
          <div class="repo-header">
            <NIcon :component="LogoGithub" size="24" class="repo-icon" />
            <a :href="currentRepo.html_url" target="_blank" class="repo-title">
              {{ currentRepo.full_name }}
            </a>
            <NTag :type="currentRepo.private ? 'warning' : 'success'" size="small" class="repo-tag">
              {{ currentRepo.private ? '私有' : '公开' }}
            </NTag>
            <div class="cache-indicator">
              <NIcon :component="TimeOutline" size="14" class="cache-icon" />
              <span>{{ getCurrentRepoCacheStatus() }}</span>
            </div>
            <div class="repo-stats">
              <div class="repo-stat">
                <NIcon :component="StarOutline" size="16" />
                <span>{{ currentRepo.stargazers_count }}</span>
              </div>
              <div class="repo-stat">
                <NIcon :component="GitBranchOutline" size="16" />
                <span>{{ currentRepo.forks_count }}</span>
              </div>
              <div class="repo-stat">
                <NIcon :component="EyeOutline" size="16" />
                <span>{{ currentRepo.watchers_count }}</span>
              </div>
            </div>
          </div>

          <!-- Repository description -->
          <p class="repo-description">
            {{ currentRepo.description || '暂无描述' }}
          </p>

          <!-- Latest commits -->
          <div class="commit-section">
            <div class="section-header">
              <h3>最新提交</h3>
              <NButton
                text
                size="small"
                :disabled="refreshingCommits"
                @click="refreshCommits"
              >
                <template #icon>
                  <NIcon :component="RefreshOutline" :class="{ 'icon-spin': refreshingCommits }" />
                </template>
                刷新
              </NButton>
            </div>

            <NCard
              v-for="commit in repoCommits[currentRepo.name] || []"
              :key="commit.sha"
              class="commit-card"
            >
              <div class="commit-header">
                <NAvatar
                  round
                  size="small"
                  :src="commit.author?.avatar_url"
                  fallback-src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                />
                <div class="commit-author">
                  <div class="author-name">
                    {{ commit.author?.login || commit.commit.author.name }}
                  </div>
                  <div class="commit-date">
                    {{ formatDate(commit.commit.author.date) }}
                  </div>
                </div>
              </div>

              <div class="commit-message">
                <a :href="commit.html_url" target="_blank">{{ commit.commit.message }}</a>
              </div>

              <div class="commit-stats">
                <div v-if="commit.stats" class="stats-item">
                  <div class="stats-label">
                    新增
                  </div>
                  <div class="stats-value addition">
                    +{{ commit.stats.additions }}
                  </div>
                </div>
                <div v-if="commit.stats" class="stats-item">
                  <div class="stats-label">
                    删除
                  </div>
                  <div class="stats-value deletion">
                    -{{ commit.stats.deletions }}
                  </div>
                </div>
              </div>
            </NCard>

            <div v-if="(repoCommits[currentRepo.name] || []).length === 0" class="empty-state">
              <NEmpty description="暂无提交记录" />
            </div>

            <NButton
              v-if="(repoCommits[currentRepo.name] || []).length > 0"
              class="view-more-btn"
              text
              type="primary"
              block
              tag="a"
              :href="`${currentRepo.html_url}/commits`"
              target="_blank"
            >
              查看更多提交记录
            </NButton>
          </div>

          <!-- Latest releases -->
          <div class="release-section">
            <div class="section-header">
              <h3>最新发布</h3>
            </div>

            <NCard
              v-for="release in repoReleases[currentRepo.name]?.slice(0, 2) || []"
              :key="release.id"
              class="release-card"
            >
              <div class="release-name">
                <NIcon :component="PricetagOutline" size="16" />
                <a :href="release.html_url" target="_blank">{{ release.name || release.tag_name }}</a>
                <NTag v-if="release.prerelease" size="small" type="warning">
                  预发布
                </NTag>
                <NTag v-else-if="release.draft" size="small" type="info">
                  草稿
                </NTag>
              </div>
              <div class="release-date">
                发布于 {{ formatDate(release.published_at) }}
              </div>
              <div v-if="release.body" class="release-body" v-html="formatMarkdown(release.body)" />
            </NCard>

            <div v-if="(repoReleases[currentRepo.name] || []).length === 0" class="empty-state">
              <NEmpty description="暂无发布记录" />
            </div>

            <NButton
              v-if="(repoReleases[currentRepo.name] || []).length > 0"
              class="view-more-btn"
              text
              type="primary"
              block
              tag="a"
              :href="`${currentRepo.html_url}/releases`"
              target="_blank"
            >
              查看更多发布
            </NButton>
          </div>
        </div>

        <div v-if="!loading && error" class="error-message">
          <NResult status="error" title="获取数据失败" :description="error">
            <template #footer>
              <NButton @click="loadAllRepoData(true)">
                重试
              </NButton>
            </template>
          </NResult>
        </div>
      </div>
    </div>

    <!-- Decorative elements -->
    <div class="decorative-circle circle-1" />
    <div class="decorative-circle circle-2" />
    <div class="decorative-dots" />
    <div class="floating-shape shape-1" />
    <div class="floating-shape shape-2" />
  </div>
</template>

<style scoped>
.dashboard-container {
  position: relative;
  min-height: 100%;
  padding: 24px;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%);
}

.welcome-header {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  position: relative;
  z-index: 10;
}

.time-container {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(10px);
  margin-right: 24px;
  min-width: 180px;
  border-left: 4px solid #18a058;
}

.time {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  letter-spacing: -0.5px;
}

.date {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.greeting-container {
  flex: 1;
}

.greeting {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(90deg, #18a058, #36ad6a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-message {
  font-size: 16px;
  color: #666;
  margin: 4px 0 0 0;
}

.content-container {
  display: grid;
  grid-template-columns: minmax(300px, 2fr) 3fr;
  gap: 24px;
  position: relative;
  z-index: 10;
}

.nav-panel, .content-panel {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  padding: 24px;
  overflow: hidden;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #333;
  display: flex;
  align-items: center;
}

.panel-title::after {
  content: "";
  display: block;
  height: 2px;
  margin-left: 12px;
  background: linear-gradient(90deg, #18a058, transparent);
  flex: 1;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.nav-card {
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
}

.nav-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.nav-card.primary {
  background: linear-gradient(135deg, rgba(24, 160, 88, 0.1), rgba(54, 173, 106, 0.1));
  border-left: 3px solid #18a058;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: rgba(24, 160, 88, 0.1);
  margin-bottom: 12px;
  color: #18a058;
}

.nav-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
  color: #333;
}

.nav-description {
  font-size: 12px;
  color: #666;
}

.status-section {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.status-card {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 8px;
  min-width: 140px;
}

.status-card.online {
  background: rgba(24, 160, 88, 0.1);
  color: #18a058;
}

.status-card.version {
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.status-icon {
  margin-right: 8px;
}

.iframe-container {
  position: relative;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
  transition: opacity 0.3s;
}

.iframe-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Decorative elements */
.decorative-circle {
  position: absolute;
  border-radius: 50%;
  z-index: 1;
  opacity: 0.5;
}

.circle-1 {
  top: -100px;
  right: -100px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(24, 160, 88, 0.1), transparent 70%);
}

.circle-2 {
  bottom: -50px;
  left: -50px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.1), transparent 70%);
}

.decorative-dots {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(#ddd 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.3;
  z-index: 1;
  pointer-events: none;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .content-container {
    grid-template-columns: 1fr;
  }

  .welcome-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .time-container {
    margin-right: 0;
    margin-bottom: 16px;
  }
}

/* GitHub repo tabs styles */
.repo-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 8px;
}

.repo-tab {
  padding: 8px 16px;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
}

.repo-tab:hover {
  background: rgba(24, 160, 88, 0.05);
  color: #18a058;
}

.repo-tab.active {
  color: #18a058;
}

.repo-tab.active::after {
  content: '';
  position: absolute;
  bottom: -9px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #18a058;
}

/* GitHub repo content styles */
.repo-spinner {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.repo-container {
  padding: 8px 0;
}

.repo-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.repo-icon {
  margin-right: 10px;
  color: #333;
}

.repo-title {
  font-size: 18px;
  font-weight: 600;
  color: #18a058;
  text-decoration: none;
  margin-right: 10px;
}

.repo-title:hover {
  text-decoration: underline;
}

.repo-tag {
  margin-right: 12px;
}

.repo-stats {
  display: flex;
  gap: 16px;
  margin-left: auto;
}

.repo-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
}

.repo-description {
  color: #555;
  margin-bottom: 24px;
  line-height: 1.6;
}

/* Section styles */
.commit-section, .release-section {
  margin-bottom: 24px;
  position: relative;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* Commit styles */
.commit-card {
  margin-bottom: 12px;
}

.commit-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.commit-author {
  margin-left: 10px;
}

.author-name {
  font-size: 14px;
  font-weight: 500;
}

.commit-date {
  font-size: 12px;
  color: #666;
}

.commit-message {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 8px;
  word-break: break-word;
}

.commit-message a {
  color: #333;
  text-decoration: none;
}

.commit-message a:hover {
  color: #18a058;
  text-decoration: underline;
}

.commit-stats {
  display: flex;
  gap: 12px;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.stats-label {
  color: #666;
}

.stats-value.addition {
  color: #28a745;
}

.stats-value.deletion {
  color: #d73a49;
}

/* Release styles */
.release-card {
  margin-bottom: 12px;
}

.release-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.release-name a {
  color: #18a058;
  text-decoration: none;
}

.release-name a:hover {
  text-decoration: underline;
}

.release-date {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.release-body :deep(p) {
  margin-bottom: 12px;
}

.release-body :deep(a) {
  color: #18a058;
  text-decoration: none;
}

.release-body :deep(a:hover) {
  text-decoration: underline;
}

.release-body :deep(ul), .release-body :deep(ol) {
  padding-left: 20px;
  margin-bottom: 12px;
}

.release-body :deep(li) {
  margin-bottom: 4px;
}

.release-body :deep(pre), .release-body :deep(code) {
  background-color: #f6f8fa;
  border-radius: 4px;
  font-family: monospace;
  padding: 2px 4px;
  font-size: 13px;
}

.release-body :deep(pre) {
  padding: 10px;
  overflow-x: auto;
  margin-bottom: 12px;
}

.release-body :deep(blockquote) {
  border-left: 4px solid #dfe2e5;
  padding-left: 16px;
  color: #6a737d;
  margin: 0 0 12px 0;
}

.release-body :deep(h1), .release-body :deep(h2),
.release-body :deep(h3), .release-body :deep(h4) {
  margin-bottom: 12px;
  margin-top: 20px;
  font-weight: 600;
}

/* Empty state */
.empty-state {
  padding: 24px;
}

/* View more button */
.view-more-btn {
  margin-top: 12px;
}

/* Error message */
.error-message {
  padding: 24px 0;
}

/* Animation for refresh icon */
.icon-spin {
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Floating shapes - additional decorative elements */
.floating-shape {
  position: absolute;
  z-index: 1;
  opacity: 0.4;
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  filter: blur(30px);
  pointer-events: none;
}

.shape-1 {
  top: 30%;
  right: 10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(24, 160, 88, 0.15), transparent 70%);
  animation: float 20s ease-in-out infinite;
}

.shape-2 {
  bottom: 10%;
  left: 5%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.15), transparent 70%);
  animation: float 15s ease-in-out infinite reverse;
}

@keyframes float {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(10px, -10px) rotate(3deg); }
  50% { transform: translate(0, 15px) rotate(0deg); }
  75% { transform: translate(-10px, -5px) rotate(-3deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

.cache-indicator {
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  font-size: 12px;
  color: #666;
  background-color: rgba(0, 0, 0, 0.03);
  padding: 2px 8px;
  border-radius: 12px;
}

.cache-icon {
  margin-right: 4px;
}

.system-info-card {
  margin-top: 20px;
}

.card-header {
  margin-bottom: 16px;
}

.version-badge {
  display: inline-block;
  background-color: rgba(24, 160, 88, 0.1);
  color: #18a058;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
  font-weight: 500;
}
</style>
