import express, { Request, Response } from 'express'
import { Chaite, ChaiteResponse } from '../index'

const router = express.Router()

router.get('/list', async (req: Request, res: Response) => {
  const chaite = Chaite.getInstance()
  chaite.getUserStateStorage().listItems().then(userStates => {
    res.status(200)
      .json(ChaiteResponse.ok(userStates))
  })
})

router.get('/:userId', async (req: Request, res: Response) => {
  const chaite = Chaite.getInstance()
  chaite.getUserStateStorage().getItem(req.params.userId).then(userState => {
    res.status(200)
      .json(ChaiteResponse.ok(userState))
  })
})

router.delete('/:userId', async (req: Request, res: Response) => {
  const chaite = Chaite.getInstance()
  chaite.getUserStateStorage().removeItem(req.params.userId).then(() => {
    res.status(200)
      .json(ChaiteResponse.ok(null))
  })
})

router.get('/history/:conversationId', async (req: Request, res: Response) => {
  const chaite = Chaite.getInstance()
  const messageId = req.params.messageId
  chaite.getHistoryManager().getHistory(messageId, req.params.conversationId).then(history => {
    res.status(200)
      .json(ChaiteResponse.ok(history))
  })
})

export default router