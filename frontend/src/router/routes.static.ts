export const staticRoutes: AppRoute.RowRoute[] = [
  { name: 'dashboard', path: '/dashboard', title: '驾驶台', requiresAuth: true, icon: 'icon-park-outline:dashboard-one', menuType: 'page', componentPath: '/home/index.vue', id: 1, pid: null },
  { name: 'quick-setup', path: '/quick-setup', title: '快速接入', requiresAuth: true, icon: 'icon-park-outline:rocket-one', menuType: 'page', componentPath: '/quick-setup/index.vue', id: 2, pid: null },

  { name: 'conversation-resources', path: '/resources', title: '对话资源', requiresAuth: true, icon: 'icon-park-outline:layers', menuType: 'dir', componentPath: null, id: 10, pid: null },
  { name: 'channels', path: '/channels', title: '渠道', requiresAuth: true, icon: 'icon-park-outline:connection', menuType: 'page', componentPath: '/channel/index.vue', id: 11, pid: 10 },
  { name: 'chat-preset', path: '/chat-preset', title: '预设库', requiresAuth: true, icon: 'icon-park-outline:message-emoji', menuType: 'page', componentPath: '/presets/index.vue', id: 12, pid: 10 },
  { name: 'tools', path: '/tools', title: '工具与分组', requiresAuth: true, icon: 'icon-park-outline:tool', menuType: 'page', componentPath: '/tools/index.vue', id: 13, pid: 10 },
  { name: 'processors', path: '/processors', title: '处理器', requiresAuth: true, icon: 'icon-park-outline:filter', menuType: 'page', componentPath: '/processors/index.vue', id: 14, pid: 10 },

  { name: 'chat-features', path: '/chat-features', title: '群聊能力', requiresAuth: true, icon: 'icon-park-outline:peoples', menuType: 'dir', componentPath: null, id: 20, pid: null },
  { name: 'memory', path: '/memory', title: '记忆', requiresAuth: true, icon: 'icon-park-outline:brain', menuType: 'page', componentPath: '/memory/index.vue', id: 21, pid: 20 },
  { name: 'triggers', path: '/triggers', title: '触发器', requiresAuth: true, icon: 'icon-park-outline:alarm', menuType: 'page', componentPath: '/triggers/index.vue', id: 22, pid: 20 },
  { name: 'user-state', path: '/user-state', title: '用户与会话', requiresAuth: true, icon: 'icon-park-outline:user', menuType: 'page', componentPath: '/user/index.vue', id: 23, pid: 20 },

  { name: 'observability', path: '/observability', title: '运行与记录', requiresAuth: true, icon: 'icon-park-outline:chart-line', menuType: 'dir', componentPath: null, id: 30, pid: null },
  { name: 'logs', path: '/logs', title: '使用记录', requiresAuth: true, icon: 'icon-park-outline:list-view', menuType: 'page', componentPath: '/logs/index.vue', id: 31, pid: 30 },

  { name: 'system', path: '/system', title: '系统', requiresAuth: true, icon: 'icon-park-outline:setting', menuType: 'dir', componentPath: null, id: 40, pid: null },
  { name: 'config', path: '/config', title: '配置', requiresAuth: true, icon: 'icon-park-outline:setting-config', menuType: 'page', componentPath: '/config/index.vue', id: 41, pid: 40 },
  { name: 'chaite', path: '/chaite', title: 'Chaite Cloud', requiresAuth: true, icon: 'icon-park-outline:cloudy', menuType: 'page', componentPath: '/chaite/index.vue', id: 42, pid: 40 },
  { name: 'agent', path: '/agent', title: '实验室', requiresAuth: true, icon: 'icon-park-outline:experiment-one', menuType: 'page', componentPath: '/agent/index.vue', id: 43, pid: 40 },
]
