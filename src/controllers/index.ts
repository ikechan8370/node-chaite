import express, { type Application } from 'express'
import AuthRouter from './auth'
import ChannelsRouter from './channels'
import ToolsRouter from './tools'
import ChatPresetRouter from './preset'
import StateRouter from './state'
import ConfigRouter from './config'
import ProcessorsRouter from './processors'
import OpenAIRouter from './openai'
import ToolGroupsRouter from './toolsGroup'
import TriggerRouter from './trigger'
import SystemRouter from './basic'
import AgentRouter from './agent'
import LogsRouter from './logs'
import cors from 'cors'
import { authenticateToken } from './middlewares'
import { getLogger } from '../utils'
import path from 'path'
import fs from 'node:fs'
import type { Server } from 'node:http'
import { __dirname } from '../__dirname'

export interface ApiServerOptions {
  /** Directory containing the built management panel (index.html + assets). */
  frontendDir?: string
}

export function createApp (configure?: (app: Application) => void, options: ApiServerOptions = {}): Application {
  const app = express()
  app.use(express.json())
  app.use(cors())
  app.use('/api/system', SystemRouter)
  app.use('/api/auth', AuthRouter)
  app.use('/api/channels', authenticateToken, ChannelsRouter)
  app.use('/api/tools', authenticateToken, ToolsRouter)
  app.use('/api/preset', authenticateToken, ChatPresetRouter)
  app.use('/api/state', authenticateToken, StateRouter)
  app.use('/api/config', authenticateToken, ConfigRouter)
  app.use('/api/processors', authenticateToken, ProcessorsRouter)
  app.use('/api/triggers', authenticateToken, TriggerRouter)
  app.use('/api/toolGroups', authenticateToken, ToolGroupsRouter)
  app.use('/api/agent', authenticateToken, AgentRouter)
  app.use('/api/logs', authenticateToken, LogsRouter)
  app.use('/v1', authenticateToken, OpenAIRouter)
  configure?.(app)
  const frontendDir = options.frontendDir
    ? path.resolve(options.frontendDir)
    : path.join(__dirname, '../frontend/build')
  const frontendEntry = path.join(frontendDir, 'index.html')
  if (fs.existsSync(frontendEntry)) {
    app.use(express.static(frontendDir))
    app.get('*', (_req, res) => {
      res.sendFile(frontendEntry)
    })
  }
  else {
    getLogger().warn(`Chaite management panel not found at ${frontendDir}`)
    app.get('*', (_req, res) => {
      res.status(404).json({ code: -1, data: null, message: 'Management panel is not installed' })
    })
  }
  return app
}

export function runServer (host: string, port: number, configure?: (app: Application) => void, options: ApiServerOptions = {}): { app: Application, server: Server } {
  const app = createApp(configure, options)
  const server = app.listen(port, host, () => {
    getLogger().info(`Chaite server is running at http://${host}:${port}`)
  })
  return { app, server }
}
