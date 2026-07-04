import express, { Request, Response, Router } from 'express'
import { Chaite, ChaiteResponse } from '../index'

const router: Router = express.Router()

function paginate<T>(items: T[], req: Request) {
  const page = Math.max(1, parseInt(req.query['page'] as string) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query['pageSize'] as string) || 20))
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize }
}

async function wrap(res: Response, fn: () => Promise<unknown>) {
  try {
    const data = await fn()
    if (!res.headersSent) res.status(200).json(ChaiteResponse.ok(data))
  } catch (e) {
    if (!res.headersSent) {
      Chaite.getInstance().getLogger().error(e as object)
      res.status(500).json(ChaiteResponse.fail(null, e instanceof Error ? e.message : 'Unknown error'))
    }
  }
}

/** GET /api/state/list?page=1&pageSize=20 */
router.get('/list', (req: Request, res: Response) => {
  wrap(res, async () => {
    const items = await Chaite.getInstance().getUserStateStorage().listItems()
    return paginate(items, req)
  })
})

/** GET /api/state/:userId */
router.get('/:userId', (req: Request, res: Response) => {
  wrap(res, async () => {
    const state = await Chaite.getInstance().getUserStateStorage().getItem(req.params.userId)
    if (!state) { res.status(404).json(ChaiteResponse.fail(null, 'User state not found')); return null }
    return state
  })
})

/** DELETE /api/state/:userId */
router.delete('/:userId', (req: Request, res: Response) => {
  wrap(res, async () => {
    await Chaite.getInstance().getUserStateStorage().removeItem(req.params.userId)
    return { deleted: true }
  })
})

/**
 * GET /api/state/history/:conversationId?messageId=xxx
 * Fixed: req.params.messageId was undefined (param not in route).
 * messageId is now an optional query parameter.
 */
router.get('/history/:conversationId', (req: Request, res: Response) => {
  wrap(res, async () => {
    const messageId = req.query['messageId'] as string | undefined
    const history = await Chaite.getInstance().getHistoryManager().getHistory(messageId, req.params.conversationId)
    return history
  })
})

export default router
