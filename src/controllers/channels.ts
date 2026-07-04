import express, { Router, Request, Response } from 'express'
import { Chaite, ChaiteResponse, Channel, Filter, SearchOption } from '../index'

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

/** GET /api/channels/list?name=&type=&status=&model=&page=1&pageSize=20 */
router.get('/list', (req: Request, res: Response) => {
  wrap(res, async () => {
    let items = await Chaite.getInstance().getChannelsManager().listInstances()
    const { name, type, status, model } = req.query as Record<string, string | undefined>
    if (name) items = items.filter(c => c.name.includes(name))
    if (type) items = items.filter(c => c.adapterType === type)
    if (status) items = items.filter(c => c.status === status)
    if (model) items = items.filter(c => c.models.includes(model))
    return paginate(items, req)
  })
})

/** POST /api/channels — create */
router.post('/', (req: Request<object, object, Channel>, res: Response) => {
  wrap(res, async () => {
    const id = await Chaite.getInstance().getChannelsManager().addInstance(req.body)
    return { ...req.body, id }
  })
})

/** PUT /api/channels/:id — full update */
router.put('/:id', (req: Request<{ id: string }, object, Channel>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getChannelsManager()
    const existing = await mgr.getInstance(req.params.id)
    if (!existing) { res.status(404).json(ChaiteResponse.fail(null, 'Channel not found')); return null }
    const body = { ...req.body, id: req.params.id } as Channel
    const id = await mgr.upsertInstance(body)
    return { ...body, id }
  })
})

/** GET /api/channels/:id */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const channel = await Chaite.getInstance().getChannelsManager().getInstance(req.params.id)
    if (!channel) { res.status(404).json(ChaiteResponse.fail(null, 'Channel not found')); return null }
    return channel
  })
})

/** DELETE /api/channels/:id */
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getChannelsManager()
    const existing = await mgr.getInstance(req.params.id)
    if (!existing) { res.status(404).json(ChaiteResponse.fail(null, 'Channel not found')); return null }
    await mgr.deleteInstance(req.params.id)
    return { deleted: true }
  })
})

// ─── Cloud sync ───────────────────────────────────────────────────────────────

router.post('/upload', (req: Request<object, object, { id: string }>, res: Response) => {
  wrap(res, () => Chaite.getInstance().getChannelsManager().shareToCloud(req.body.id))
})

router.post('/download', (req: Request<object, object, { id: string }>, res: Response) => {
  wrap(res, async () => {
    const manager = Chaite.getInstance().getChannelsManager()
    const channel = await manager.getFromCloud(req.body.id)
    if (!channel) { res.status(404).json(ChaiteResponse.fail(null, 'Channel not found in cloud')); return null }
    channel.cloudId = channel.id
    const existing = await manager.getInstanceByCloudId(channel.cloudId)
    if (existing.length > 0) {
      if (existing[0].toString() === channel.toString()) { res.status(400).json(ChaiteResponse.fail(null, '渠道已是最新版本')); return null }
      channel.id = existing[0].id
    } else {
      channel.id = ''
    }
    const id = await manager.upsertInstance(channel)
    return { ...channel, id }
  })
})

router.post('/list-cloud', (req: Request<object, object, { filter?: Filter; options?: SearchOption; query: string }>, res: Response) => {
  wrap(res, () => Chaite.getInstance().getChannelsManager().listFromCloud(req.body.filter || {}, req.body.query, req.body.options || {}))
})

export default router
