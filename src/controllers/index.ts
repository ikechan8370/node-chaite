import express from 'express'
import AuthRouter from './auth'
import ChannelsRouter from './channels'
import ToolsRouter from './tools'
import ChatPresetRouter from './preset'
import StateRouter from './state'
import ConfigRouter from './config'
import { authenticateToken } from './middlewares'

export function runServer (host: string, port: number) {
  const app = express()
  app.use(express.json())

  app.use('/auth', AuthRouter)
  app.use('/channels', authenticateToken, ChannelsRouter)
  app.use('/tools', authenticateToken, ToolsRouter)
  app.use('/preset', authenticateToken, ChatPresetRouter)
  app.use('/state', authenticateToken, StateRouter)
  app.use('/config', authenticateToken, ConfigRouter)

  app.listen(port, host, () => {
    console.log(`Server is running at http://${host}:${port}`)
  })
}