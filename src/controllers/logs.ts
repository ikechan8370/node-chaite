import express, { Router, Request, Response } from 'express'
import { Chaite, ChaiteResponse } from '../index'
import type { ListLogsFilter, OperationLogType, OperationLogLevel } from '../types/operation-log'

const router: Router = express.Router()

function notConfigured(res: Response) {
  res.status(503).json(ChaiteResponse.fail(null, 'OperationLogManager is not configured. Call chaite.setOperationLogManager(mgr) to enable operation logs.'))
}

function handle(res: Response, fn: () => Promise<unknown>) {
  fn()
    .then(data => { if (!res.headersSent) res.status(200).json(ChaiteResponse.ok(data)) })
    .catch((e: unknown) => {
      if (!res.headersSent) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        Chaite.getInstance().getLogger().error(e as object)
        res.status(500).json(ChaiteResponse.fail(null, msg))
      }
    })
}

/**
 * GET /api/logs
 * Query params: type, level, userId, from (ms), to (ms), keyword, page, pageSize
 */
router.get('/', (req: Request, res: Response) => {
  const mgr = Chaite.getInstance().getOperationLogManager()
  if (!mgr) return notConfigured(res)

  handle(res, async () => {
    const filter: ListLogsFilter = {
      type: req.query['type'] as OperationLogType | undefined,
      level: req.query['level'] as OperationLogLevel | undefined,
      userId: req.query['userId'] as string | undefined,
      keyword: req.query['keyword'] as string | undefined,
      from: req.query['from'] ? Number(req.query['from']) : undefined,
      to: req.query['to'] ? Number(req.query['to']) : undefined,
      page: req.query['page'] ? Math.max(1, Number(req.query['page'])) : 1,
      pageSize: req.query['pageSize'] ? Math.min(200, Math.max(1, Number(req.query['pageSize']))) : 50,
    }
    return mgr.list(filter)
  })
})

/**
 * GET /api/logs/stats
 * Returns aggregate statistics for all logs.
 */
router.get('/stats', (req: Request, res: Response) => {
  const mgr = Chaite.getInstance().getOperationLogManager()
  if (!mgr) return notConfigured(res)
  handle(res, () => mgr.getStats())
})

/**
 * DELETE /api/logs
 * Clear logs. Optionally filtered by: type, level, userId, from (ms), to (ms).
 */
router.delete('/', (req: Request, res: Response) => {
  const mgr = Chaite.getInstance().getOperationLogManager()
  if (!mgr) return notConfigured(res)

  handle(res, async () => {
    const filter = {
      type: req.query['type'] as OperationLogType | undefined,
      level: req.query['level'] as OperationLogLevel | undefined,
      userId: req.query['userId'] as string | undefined,
      from: req.query['from'] ? Number(req.query['from']) : undefined,
      to: req.query['to'] ? Number(req.query['to']) : undefined,
    }
    const count = await mgr.clear(filter)
    return { deleted: count }
  })
})

export default router
