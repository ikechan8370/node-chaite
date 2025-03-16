import express from 'express'
import AuthRouter from './auth.js'
import ChannelsRouter from './channels.js'
import ToolsRouter from './tools.js'
import ChatPresetRouter from './preset.js'
import StateRouter from './state.js'
import ConfigRouter from './config.js'
import ProcessorsRouter from './processors.js'
import OpenAIRouter from './openai.js'
import cors from 'cors'
import { authenticateToken } from './middlewares.js'
import { getLogger } from '../utils/index.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


export function runServer (host: string, port: number) {
  const app = express()
  app.use(express.json())
  app.use(cors())
  app.use('/api/auth', AuthRouter)
  app.use('/api/channels', authenticateToken, ChannelsRouter)
  app.use('/api/tools', authenticateToken, ToolsRouter)
  app.use('/api/preset', authenticateToken, ChatPresetRouter)
  app.use('/api/state', authenticateToken, StateRouter)
  app.use('/api/config', authenticateToken, ConfigRouter)
  app.use('/api/processors', authenticateToken, ProcessorsRouter)
  app.use('/v1', authenticateToken, OpenAIRouter)
  app.use(express.static(path.join(__dirname, '../frontend/build')))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'))
  })
  app.listen(port, host, () => {
    getLogger().info(`Chaite server is running at http://${host}:${port}`)
  })
}