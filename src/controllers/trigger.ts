import express, { Router, Request, Response } from 'express'
import { Chaite, ChaiteResponse, Filter, TriggerDTO, SearchOption } from '../index'

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

// ─── Local CRUD ───────────────────────────────────────────────────────────────

/** GET /api/triggers/list?name=xxx&status=enabled|disabled&page=1&pageSize=20 */
router.get('/list', (req: Request, res: Response) => {
  wrap(res, async () => {
    let items = await Chaite.getInstance().getTriggerManager().listInstances()
    const name = req.query['name'] as string | undefined
    const status = req.query['status'] as string | undefined
    if (name) items = items.filter(t => t.name.includes(name))
    if (status) items = items.filter(t => t.status === status)
    return paginate(items, req)
  })
})

/** POST /api/triggers — create a new trigger */
router.post('/', (req: Request<object, object, TriggerDTO>, res: Response) => {
  wrap(res, async () => {
    const body = req.body
    const mgr = Chaite.getInstance().getTriggerManager()
    const id = await mgr.addInstance(body)
    if (body.status === 'enabled') await mgr.registerTrigger(body.name)
    return { ...body, id }
  })
})

/** PUT /api/triggers/:id — full update (handles re-registration if status changes) */
router.put('/:id', (req: Request<{ id: string }, object, TriggerDTO>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getTriggerManager()
    const existing = await mgr.getInstanceT(req.params.id)
    if (!existing) { res.status(404).json(ChaiteResponse.fail(null, 'Trigger not found')); return null }
    const body: TriggerDTO = { ...req.body, id: req.params.id } as TriggerDTO
    const id = await mgr.upsertInstanceT(body)
    return { ...body, id }
  })
})

/** GET /api/triggers/:id */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const trigger = await Chaite.getInstance().getTriggerManager().getInstanceT(req.params.id)
    if (!trigger) { res.status(404).json(ChaiteResponse.fail(null, 'Trigger not found')); return null }
    return trigger
  })
})

/** DELETE /api/triggers/:id */
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getTriggerManager()
    const existing = await mgr.getInstanceT(req.params.id)
    if (!existing) { res.status(404).json(ChaiteResponse.fail(null, 'Trigger not found')); return null }
    await mgr.deleteInstance(req.params.id)
    return { deleted: true }
  })
})

// ─── Cloud sync ───────────────────────────────────────────────────────────────

router.post('/upload', (req: Request<object, object, { id: string }>, res: Response) => {
  wrap(res, () => Chaite.getInstance().getTriggerManager().shareToCloud(req.body.id))
})

router.post('/download', (req: Request<object, object, { id: string }>, res: Response) => {
  wrap(res, async () => {
    const manager = Chaite.getInstance().getTriggerManager()
    const trigger = await manager.getFromCloud(req.body.id)
    if (!trigger) { res.status(404).json(ChaiteResponse.fail(null, 'Trigger not found in cloud')); return null }
    trigger.cloudId = trigger.id
    const existing = await manager.getInstanceTByCloudId(trigger.cloudId)
    if (existing.length > 0) {
      if (existing[0].code === trigger.code) { res.status(400).json(ChaiteResponse.fail(null, '触发器已是最新版本')); return null }
      trigger.id = existing[0].id
    } else {
      trigger.id = ''
    }
    const id = await manager.upsertInstanceT(trigger)
    return { ...trigger, id }
  })
})

router.post('/list-cloud', (req: Request<object, object, { filter?: Filter; options?: SearchOption; query: string }>, res: Response) => {
  wrap(res, () => Chaite.getInstance().getTriggerManager().listFromCloud(req.body.filter || {}, req.body.query, req.body.options || {}))
})

export default router
