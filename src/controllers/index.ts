import express from 'express'
import AuthRouter from './auth.js'
import ChannelsRouter from './channels.js'
import ToolsRouter from './tools.js'
import ChatPresetRouter from './preset.js'
import StateRouter from './state.js'
import ConfigRouter from './config.js'
import ProcessorsRouter from './processors.js'
import cors from 'cors'
import { authenticateToken } from './middlewares.js'

export function runServer (host: string, port: number) {
  const app = express()
  app.use(express.json())
  app.use(cors())
  app.use('/auth', AuthRouter)
  app.use('/channels', authenticateToken, ChannelsRouter)
  app.use('/tools', authenticateToken, ToolsRouter)
  app.use('/preset', authenticateToken, ChatPresetRouter)
  app.use('/state', authenticateToken, StateRouter)
  app.use('/config', authenticateToken, ConfigRouter)
  app.use('/processors', authenticateToken, ProcessorsRouter)

  app.listen(port, host, () => {
    console.log(`Server is running at http://${host}:${port}`)
  })
}