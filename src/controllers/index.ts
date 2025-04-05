import express from 'express'
import AuthRouter from './auth'
import ChannelsRouter from './channels'
import ToolsRouter from './tools'
import ChatPresetRouter from './preset'
import StateRouter from './state'
import ConfigRouter from './config'
import ProcessorsRouter from './processors'
import OpenAIRouter from './openai'
import ToolGroupsRouter from './toolsGroup'
import SystemRouter from './basic'
import cors from 'cors'
import { authenticateToken } from './middlewares'
import { getLogger } from '../utils'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


export function runServer (host: string, port: number) {
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
  app.use('/api/toolGroups', authenticateToken, ToolGroupsRouter)
  app.use('/v1', authenticateToken, OpenAIRouter)
  app.use(express.static(path.join(__dirname, './frontend/build')))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, './frontend/build/index.html'))
  })
  app.listen(port, host, () => {
    getLogger().info(`Chaite server is running at http://${host}:${port}`)
  })
}