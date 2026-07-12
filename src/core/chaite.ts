import { ChannelsManager, ChatPresetManager, DefaultCloudService, ProcessorsManager, ToolManager } from '../share'
import {
  ChaiteContext,
  CustomConfig,
  HistoryManager,
  ILogger,
  ModelResponse, ProcessorDTO,
  SendMessageOption,
  ToolDTO, ToolsGroupDTO,
  TriggerDTO,
  UserMessage,
} from '../types'
import { EventMessage, UserModeSelector } from '../types'
import { createClient } from '../adapters'
import { BasicStorage, UserState } from '../types'
import {
  asyncLocalStorage,
  DEFAULT_HOST,
  DEFAULT_PORT,
  FrontEndAuthHandler,
  GlobalConfig,
  InMemoryHistoryManager,
} from '../utils'
import { Channel, ChatPreset } from '../channels'
import { RAGManager } from '../rag'
import EventEmitter from 'node:events'
import { ApiServerOptions, runServer } from '../controllers'
import { ToolsGroupManager } from '../share'
import { TriggerManager } from '../share'
import type { Application } from 'express'
import type { SkillRegistry } from '../agent/skills/SkillRegistry'
import type { BackgroundJobManager } from '../agent/background/BackgroundJobManager'
import type { DynamicScheduler } from '../agent/scheduler/DynamicScheduler'
import type { McpServerManager } from '../agent/mcp/McpServerConfig'
import { McpCapabilityManager } from '../agent/mcp/McpCapabilityManager'
import type { AgentRunContext } from '../agent/contracts'
import type { WorkflowEngine } from '../agent/workflow/WorkflowEngine'
import type { PlanExecutor } from '../agent/planning/PlanExecutor'
import { McpToolExecutor } from '../agent/tool-executors/mcp'
import { OperationLogManager } from '../share/operation-log'
import type { AuditEvent } from '../agent/contracts'

/**
 * 入口
 */
export class Chaite extends EventEmitter {
  private static instance: Chaite

  private ragManager?: RAGManager

  private frontendAuthHandler!: FrontEndAuthHandler

  private globalConfig?: GlobalConfig

  private expressApp?: Application

  /** SkillRegistry loaded from SKILL.md directories */
  private skillRegistry?: SkillRegistry

  /** BackgroundJobManager for async task execution */
  private backgroundJobManager?: BackgroundJobManager

  /** Shared storage for agent state (plans, jobs, etc.) */
  private agentStorage?: BasicStorage<unknown>

  /** Dynamic scheduler for LLM-created scheduled tasks */
  private dynamicScheduler?: DynamicScheduler

  /** MCP server configuration manager */
  private mcpServerManager?: McpServerManager
  private mcpCapabilityManager?: McpCapabilityManager
  private mcpManagementGuard?: (context: ChaiteContext) => boolean

  /** Workflow engine for executing WorkflowDefinitions */
  private workflowEngine?: WorkflowEngine

  /** Plan executor for LLM-driven dynamic planning */
  private planExecutor?: PlanExecutor

  /** Operation log manager — records fine-grained AI activity */
  private operationLogManager: OperationLogManager

  private constructor(private channelsManager: ChannelsManager, private toolsManager: ToolManager,
                        private processorsManager: ProcessorsManager, private chatPresetManager: ChatPresetManager, private toolsGroupManager: ToolsGroupManager, private triggerManager: TriggerManager<TriggerDTO>,
                        private userModeSelector: UserModeSelector, private userStateStorage: BasicStorage<UserState>,
                        private historyManager: HistoryManager = new InMemoryHistoryManager(), private logger: ILogger) {
    super()
    this.operationLogManager = new OperationLogManager()
    this._subscribeOperationLogEvents(this.operationLogManager)
  }

  public static init(channelsManager: ChannelsManager, toolsManager: ToolManager,
    processorsManager: ProcessorsManager, chatPresetManager: ChatPresetManager, toolsGroupManager: ToolsGroupManager, triggerManager: TriggerManager<TriggerDTO>,
    userModeSelector: UserModeSelector, userStateStorage: BasicStorage<UserState>,
    historyManager: HistoryManager = new InMemoryHistoryManager(), logger: ILogger): Chaite {
    if (Chaite.instance) {
      return Chaite.instance
    }
    Chaite.instance = new Chaite(channelsManager, toolsManager, processorsManager, chatPresetManager, toolsGroupManager, triggerManager, userModeSelector, userStateStorage, historyManager, logger)
    Chaite.instance.setFrontendAuthHandler(new FrontEndAuthHandler())
    return Chaite.instance
  }

  public static getInstance(): Chaite {
    return Chaite.instance
  }

  onUpdateCustomConfig!: (config: CustomConfig) => Promise<CustomConfig>

  setUpdateConfigCallback(callback: (config: CustomConfig) => Promise<CustomConfig>) {
    this.onUpdateCustomConfig = callback
  }

  getCustomConfig!: () => Promise<CustomConfig>

  setGetConfig(callback: () => Promise<CustomConfig>) {
    this.getCustomConfig = callback
  }

  setRAGManager(ragManager: RAGManager) {
    this.ragManager = ragManager
  }

  getRAGManager() {
    return this.ragManager
  }

  setGlobalConfig(globalConfig: GlobalConfig) {
    this.globalConfig = globalConfig
    this.globalConfig.on('change', obj => {
      const { key, newVal, oldVal } = obj
      this.emit('config-change', { key, newVal, oldVal })
    })
  }

  getGlobalConfig() {
    if (!this.globalConfig) {
      this.setGlobalConfig(new GlobalConfig())
    }
    return this.globalConfig
  }

  setFrontendAuthHandler(frontendAuthHandler: FrontEndAuthHandler) {
    this.frontendAuthHandler = frontendAuthHandler
  }

  getFrontendAuthHandler() {
    return this.frontendAuthHandler
  }

  /**
     * 对话
     * @param message
     * @param e
     * @param options 包含对话id和消息id
     */
  async sendMessage(message: UserMessage, e: EventMessage, options: SendMessageOption & { chatPreset?: ChatPreset }): Promise<ModelResponse> {
    const context = new ChaiteContext(this.logger)
    context.setEvent(e)
    context.setChaite(this)

    // Inject agent context fields from options
    if (options.jobId) context.jobId = options.jobId
    if (options.planId) context.planId = options.planId
    if (options.skillName) context.skillName = options.skillName

    return asyncLocalStorage.run(context, async () => {
      if (!options.chatPreset) {
        options.chatPreset = await this.userModeSelector.getChatPreset(e)
      }

      // Skill selection: if no explicit preset provided, try skill-based routing
      const msgText = message?.content
        ?.filter(c => c.type === 'text')
        .map(c => (c as { text: string }).text)
        .join(' ') ?? ''

      if (!options.skillName && this.skillRegistry) {
        const matched = this.skillRegistry.matchSkill(msgText)
        if (matched) {
          context.skillName = matched.id
          options.skillName = matched.id
          // Apply skill's preset override if specified
          if (matched.frontmatter.preset && !options.chatPreset) {
            const skillPreset = await this.chatPresetManager.getInstance(matched.frontmatter.preset)
            if (skillPreset) options.chatPreset = skillPreset
          }
        }
      }

      // If the matched skill declares an executionMode, route accordingly
      if (options.skillName && this.skillRegistry) {
        const skill = this.skillRegistry.getSkillByName(options.skillName)
        const mode = skill?.frontmatter.executionMode

        if (mode === 'workflow' && this.workflowEngine && skill?.frontmatter.workflowRef) {
          const agentCtx = this.buildAgentRunContext({
            skillName: options.skillName,
            userId: String(e.sender.user_id),
            groupId: e.group ? String(e.group.group_id) : undefined,
          })
          try {
            const buf = await skill.readFile(skill.frontmatter.workflowRef)
            const workflowDef = JSON.parse(buf.toString('utf-8'))
            const result = await this.workflowEngine.run(workflowDef, agentCtx)
            return {
              contents: [{ type: 'text' as const, text: result.finalOutput ?? (result.status === 'failed' ? `Workflow failed: ${result.error}` : '') }],
            } as unknown as ModelResponse
          } catch (err) {
            this.logger.error(`[Chaite] Workflow execution failed for skill "${options.skillName}": ${String(err)}`)
            // Fall through to normal LLM path as degraded fallback
          }
        }

        if (mode === 'plan' && this.planExecutor) {
          const agentCtx = this.buildAgentRunContext({
            skillName: options.skillName,
            userId: String(e.sender.user_id),
            groupId: e.group ? String(e.group.group_id) : undefined,
          })
          try {
            const { output } = await this.planExecutor.execute(msgText, agentCtx)
            return {
              contents: [{ type: 'text' as const, text: output }],
            } as unknown as ModelResponse
          } catch (err) {
            this.logger.error(`[Chaite] Plan execution failed for skill "${options.skillName}": ${String(err)}`)
            // Fall through to normal LLM path as degraded fallback
          }
        }
      }

      const modelName = options.chatPreset.sendMessageOption.model || ''
      context.presetId = options.chatPreset.id
      context.presetName = options.chatPreset.name
      const channels = await this.channelsManager.getChannelByModel(modelName)
      if (channels.length > 0) {
        const channel = channels[0]
        context.channelId = channel.id
        context.channelName = channel.name
        const clientOptions = channel.getOptionsForModel(modelName)
        await clientOptions.ready()
        clientOptions.setHistoryManager(this.historyManager)
        clientOptions.setLogger(this.logger)
        const client = createClient(channel.adapterType, clientOptions, context)
        const newOptions = {
          ...options.chatPreset.sendMessageOption,
          builtinToolCategories: options.chatPreset.builtinToolCategories,
          ...Object.fromEntries(
            Object.entries(options)
              .filter(([_, value]) => value !== undefined),
          ),
        }
        // Keep only a compact server catalogue in the prompt. Actual MCP tool
        // schemas stay hidden until the model searches and selects tools.
        if (this.mcpServerManager) {
          const servers = await this.mcpServerManager.listEnabled()
          const catalogue = servers
            .slice(0, 20)
            .map(server => `- ${server.name}（${server.tools?.length ?? 0} 个工具）${server.description ? `：${server.description}` : ''}`)
            .join('\n')
          if (catalogue) {
            newOptions.systemOverride = [newOptions.systemOverride, `# 已配置的 MCP 服务\n${catalogue}\n当用户需要其中的外部能力时，先调用 search_mcp_tools 搜索所需工具，再调用 activate_mcp_tools 选择少量工具。不要一次加载全部 MCP 工具。`]
              .filter(Boolean)
              .join('\n\n')
          }
        }
        // A direct skill is progressive disclosure too: its full instructions
        // are loaded only after matching, never added to every chat prompt.
        if (options.skillName && this.skillRegistry) {
          const skill = this.skillRegistry.getSkillByName(options.skillName)
          if (skill) {
            const instructions = await skill.loadInstructions()
            if (instructions) {
              newOptions.systemOverride = [newOptions.systemOverride, `# Active skill: ${skill.id}\n${instructions}`]
                .filter(Boolean)
                .join('\n\n')
            }
          }
        }
        if (this.globalConfig?.getDebug()) {
          this.logger.debug(`sendMessage options: ${JSON.stringify(newOptions)}`)
        }
        return await client.sendMessage(message, newOptions)
      } else {
        throw new Error('No available channels')
      }
    })
  }

  // ─── Skill Registry ─────────────────────────────────────────────────────────

  setSkillRegistry(registry: SkillRegistry): void {
    this.skillRegistry = registry
  }

  getSkillRegistry(): SkillRegistry | undefined {
    return this.skillRegistry
  }

  // ─── Background Job Manager ──────────────────────────────────────────────────

  setBackgroundJobManager(manager: BackgroundJobManager): void {
    this.backgroundJobManager = manager
  }

  getBackgroundJobManager(): BackgroundJobManager | undefined {
    return this.backgroundJobManager
  }

  // ─── Agent Storage ───────────────────────────────────────────────────────────

  setAgentStorage(storage: BasicStorage<unknown>): void {
    this.agentStorage = storage
  }

  getAgentStorage(): BasicStorage<unknown> | undefined {
    return this.agentStorage
  }

  // ─── Dynamic Scheduler ───────────────────────────────────────────────────────

  setDynamicScheduler(scheduler: DynamicScheduler): void {
    this.dynamicScheduler = scheduler
  }

  getDynamicScheduler(): DynamicScheduler | undefined {
    return this.dynamicScheduler
  }

  // ─── MCP Server Manager ──────────────────────────────────────────────────────

  setMcpServerManager(manager: McpServerManager): void {
    this.mcpServerManager = manager
    this.mcpCapabilityManager = new McpCapabilityManager(() => this.mcpServerManager)
  }

  getMcpServerManager(): McpServerManager | undefined {
    return this.mcpServerManager
  }

  getMcpCapabilityManager(): McpCapabilityManager | undefined {
    return this.mcpCapabilityManager
  }

  setMcpManagementGuard(guard: (context: ChaiteContext) => boolean): void {
    this.mcpManagementGuard = guard
  }

  canManageMcp(context: ChaiteContext): boolean {
    return this.mcpManagementGuard?.(context) ?? false
  }

  // ─── Workflow Engine ─────────────────────────────────────────────────────────

  setWorkflowEngine(engine: WorkflowEngine): void {
    this.workflowEngine = engine
  }

  getWorkflowEngine(): WorkflowEngine | undefined {
    return this.workflowEngine
  }

  // ─── Plan Executor ───────────────────────────────────────────────────────────

  setPlanExecutor(executor: PlanExecutor): void {
    this.planExecutor = executor
  }

  getPlanExecutor(): PlanExecutor | undefined {
    return this.planExecutor
  }

  // ─── Operation Log Manager ───────────────────────────────────────────────────

  setOperationLogManager(mgr: OperationLogManager): void {
    this.operationLogManager = mgr
    this._subscribeOperationLogEvents(mgr)
  }

  getOperationLogManager(): OperationLogManager | undefined {
    return this.operationLogManager
  }

  /**
   * Subscribe to Chaite's EventEmitter to automatically capture
   * job lifecycle and plan/tool audit events into the operation log.
   */
  private _subscribeOperationLogEvents(mgr: OperationLogManager): void {
    const on = <T extends AuditEvent>(event: string, handler: (data: T) => void) => {
      this.on(event, handler)
    }

    // ── Background jobs ──────────────────────────────────────────────────────
    on('job:queued', (data: AuditEvent) => {
      mgr.addSync({ type: 'job.queued', level: 'info', summary: `Job queued`, jobId: data.jobId, userId: data.userId, metadata: data.data })
    })
    on('job:start', (data: AuditEvent) => {
      mgr.addSync({ type: 'job.start', level: 'info', summary: `Job started`, jobId: data.jobId, userId: data.userId, metadata: data.data })
    })
    on('job:complete', (data: AuditEvent) => {
      mgr.addSync({ type: 'job.complete', level: 'info', summary: `Job completed`, jobId: data.jobId, userId: data.userId, metadata: data.data })
    })
    on('job:failed', (data: AuditEvent) => {
      const errMsg = (data.data?.error as string) ?? ''
      mgr.addSync({ type: 'job.failed', level: 'error', summary: `Job failed${errMsg ? ': ' + errMsg : ''}`, jobId: data.jobId, userId: data.userId, detail: errMsg, metadata: data.data })
    })
    on('job:progress', (data: AuditEvent) => {
      mgr.addSync({ type: 'job.progress', level: 'info', summary: `Job progress`, jobId: data.jobId, userId: data.userId, metadata: data.data })
    })

    // ── Plans ────────────────────────────────────────────────────────────────
    on('plan:start', (data: AuditEvent) => {
      mgr.addSync({ type: 'plan.start', level: 'info', summary: `Plan started`, planId: data.planId, userId: data.userId, metadata: data.data })
    })
    on('plan:step:start', (data: AuditEvent) => {
      const stepDesc = (data.data?.description as string) ?? data.stepId ?? ''
      mgr.addSync({ type: 'plan.step.start', level: 'info', summary: `Plan step started${stepDesc ? ': ' + stepDesc : ''}`, planId: data.planId, stepId: data.stepId, userId: data.userId, metadata: data.data })
    })
    on('plan:step:end', (data: AuditEvent) => {
      mgr.addSync({ type: 'plan.step.end', level: 'info', summary: `Plan step completed`, planId: data.planId, stepId: data.stepId, userId: data.userId, metadata: data.data })
    })
    on('plan:complete', (data: AuditEvent) => {
      mgr.addSync({ type: 'plan.complete', level: 'info', summary: `Plan completed`, planId: data.planId, userId: data.userId, metadata: data.data })
    })
    on('plan:failed', (data: AuditEvent) => {
      const errMsg = (data.data?.error as string) ?? ''
      mgr.addSync({ type: 'plan.failed', level: 'error', summary: `Plan failed${errMsg ? ': ' + errMsg : ''}`, planId: data.planId, userId: data.userId, detail: errMsg, metadata: data.data })
    })

    // ── Tool events from emitAudit ────────────────────────────────────────────
    on('tool:start', (data: AuditEvent) => {
      const toolName = (data.data?.toolName as string) ?? ''
      mgr.addSync({ type: 'tool.call', level: 'info', summary: `Tool started: ${toolName}`, toolName, userId: data.userId, jobId: data.jobId, planId: data.planId, metadata: data.data })
    })
    on('tool:error', (data: AuditEvent) => {
      const toolName = (data.data?.toolName as string) ?? ''
      const errMsg = (data.data?.error as string) ?? ''
      mgr.addSync({ type: 'tool.error', level: 'error', summary: `Tool error: ${toolName}`, toolName, userId: data.userId, detail: errMsg, jobId: data.jobId, planId: data.planId, metadata: data.data })
    })
  }

  /**
   * Build a composite McpToolExecutor from all enabled MCP server configs.
   * Returns undefined if no MCP servers are configured.
   * Call this after init and assign to channel.options.toolExecutor if desired.
   *
   * Multiple MCP servers are chained as fallback: first server that has the tool wins.
   */
  async buildMcpExecutor(): Promise<McpToolExecutor | undefined> {
    if (!this.mcpServerManager) return undefined
    const servers = await this.mcpServerManager.listEnabled()
    if (servers.length === 0) return undefined

    // Chain executors: last one has no fallback, each wraps the next
    let executor: McpToolExecutor | undefined
    for (let i = servers.length - 1; i >= 0; i--) {
      const cfg = servers[i]
      executor = new McpToolExecutor(cfg, executor)
    }
    return executor
  }

  /**
   * Build an AgentRunContext bound to the current Chaite instance.
   * Used by BackgroundJobManager and PlanExecutor when running background tasks.
   */
  buildAgentRunContext(overrides?: {
    jobId?: string
    skillName?: string
    userId?: string
    groupId?: string
  }): AgentRunContext {
    const logger = this.logger
    const storage = this.agentStorage ?? (this.userStateStorage as unknown as BasicStorage<unknown>)
    const chaite = this

    return {
      sendMessage: async (goal: string, options?: Record<string, unknown>) => {
        const textContent = [{ type: 'text' as const, text: goal }]
        const userMsg = { role: 'user' as const, content: textContent }
        const fakeEvent = {
          sender: { user_id: overrides?.userId ?? 'agent', nickname: 'Agent' },
          group: overrides?.groupId ? { group_id: overrides.groupId } : undefined,
        } as EventMessage
        const mergedOptions = SendMessageOption.create({
          jobId: overrides?.jobId,
          skillName: overrides?.skillName,
          ...(options as Partial<SendMessageOption>),
        })
        return chaite.sendMessage(userMsg, fakeEvent, mergedOptions)
      },
      storage,
      logger,
      emitAudit: (event) => {
        chaite.emit(event.type, event)
        // Also re-emit job:progress and job:complete as top-level events
        if (event.type === 'job:progress' || event.type === 'job:complete' || event.type === 'job:failed') {
          chaite.emit(event.type, event.data)
        }
      },
      jobManager: this.backgroundJobManager,
    }
  }

  getChannelsManager() {
    return this.channelsManager
  }

  setChannelsManager(channelsManager: ChannelsManager) {
    this.channelsManager = channelsManager
  }

  getToolsManager() {
    return this.toolsManager
  }

  setToolsManager(toolsManager: ToolManager) {
    this.toolsManager = toolsManager
  }

  getProcessorsManager() {
    return this.processorsManager
  }

  setProcessorsManager(processorsManager: ProcessorsManager) {
    this.processorsManager = processorsManager
  }

  getChatPresetManager() {
    return this.chatPresetManager
  }

  setChatPresetManager(chatPresetManager: ChatPresetManager) {
    this.chatPresetManager = chatPresetManager
  }

  getToolsGroupManager() {
    return this.toolsGroupManager
  }

  setToolsGroupManager(toolsGroupManager: ToolsGroupManager) {
    this.toolsGroupManager = toolsGroupManager
  }

  getTriggerManager() {
    return this.triggerManager
  }

  setTriggerManager(triggerManager: TriggerManager<TriggerDTO>) {
    this.triggerManager = triggerManager
  }

  getUserModeSelector() {
    return this.userModeSelector
  }

  setUserModeSelector(userModeSelector: UserModeSelector) {
    this.userModeSelector = userModeSelector
  }

  getUserStateStorage() {
    return this.userStateStorage
  }

  setUserStateStorage(userStateStorage: BasicStorage<UserState>) {
    this.userStateStorage = userStateStorage
  }

  getHistoryManager() {
    return this.historyManager
  }

  setHistoryManager(historyManager: HistoryManager) {
    this.historyManager = historyManager
  }

  getLogger() {
    return this.logger
  }

  setLogger(logger: ILogger) {
    this.logger = logger
  }

  setCloudService(cloudServiceBaseUrl: string) {
    this.channelsManager.setCloudService(new DefaultCloudService<Channel>(cloudServiceBaseUrl, 'channel'))
    this.toolsManager.setCloudService(new DefaultCloudService<ToolDTO>(cloudServiceBaseUrl, 'tool'))
    this.processorsManager.setCloudService(new DefaultCloudService<ProcessorDTO>(cloudServiceBaseUrl, 'processor'))
    this.chatPresetManager.setCloudService(new DefaultCloudService<ChatPreset>(cloudServiceBaseUrl, 'chat-preset'))
    this.toolsGroupManager.setCloudService(new DefaultCloudService<ToolsGroupDTO>(cloudServiceBaseUrl, 'tool-group'))
    this.triggerManager.setCloudService(new DefaultCloudService<TriggerDTO>(cloudServiceBaseUrl, 'trigger'))
  }
  async auth(apiKey: string) {
    if (!this.toolsManager.cloudService) {
      throw new Error('Cloud service is not initialized')
    }
    const user = await this.toolsManager.cloudService.authenticate(apiKey)
    if (user) {
      user.api_key = apiKey
      this.channelsManager.cloudService?.setUser(user)
      this.toolsManager.cloudService?.setUser(user)
      this.processorsManager.cloudService?.setUser(user)
      this.triggerManager.cloudService?.setUser(user)
      this.chatPresetManager.cloudService?.setUser(user)
    }
  }

  getExpressApp(): Application | undefined {
    return this.expressApp
  }

  runApiServer(configureApp?: (app: Application) => void, options: ApiServerOptions = {}): Application {
    const { app } = runServer(
      this.globalConfig?.getHost() || DEFAULT_HOST,
      this.globalConfig?.getPort() || DEFAULT_PORT,
      configureApp,
      options,
    )
    this.expressApp = app
    return app
  }

}
