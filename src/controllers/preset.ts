import express, { Router, Request, Response } from 'express'
import { Chaite, ChaiteResponse, ChatPreset, Filter, SearchOption } from '../index'

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

/** GET /api/preset/list?name=xxx&page=1&pageSize=20 */
router.get('/list', (req: Request, res: Response) => {
  wrap(res, async () => {
    let items = await Chaite.getInstance().getChatPresetManager().listInstances()
    const name = req.query['name'] as string | undefined
    const prompt = req.query['prompt'] as string | undefined
    if (name) items = items.filter(p => p.name.includes(name))
    if (prompt) items = items.filter(p => (p.sendMessageOption.systemOverride || '').includes(prompt))
    return paginate(items, req)
  })
})

/** POST /api/preset — create */
router.post('/', (req: Request<object, object, ChatPreset>, res: Response) => {
  wrap(res, async () => {
    const id = await Chaite.getInstance().getChatPresetManager().addInstance(req.body)
    return { ...req.body, id }
  })
})

/** PUT /api/preset/:id — full update */
router.put('/:id', (req: Request<{ id: string }, object, ChatPreset>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getChatPresetManager()
    const existing = await mgr.getInstance(req.params.id)
    if (!existing) { res.status(404).json(ChaiteResponse.fail(null, 'Preset not found')); return null }
    const body = { ...req.body, id: req.params.id } as ChatPreset
    const id = await mgr.upsertInstance(body)
    return { ...body, id }
  })
})

/** GET /api/preset/:id */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const preset = await Chaite.getInstance().getChatPresetManager().getInstance(req.params.id)
    if (!preset) { res.status(404).json(ChaiteResponse.fail(null, 'Preset not found')); return null }
    return preset
  })
})

/** DELETE /api/preset/:id */
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getChatPresetManager()
    const existing = await mgr.getInstance(req.params.id)
    if (!existing) { res.status(404).json(ChaiteResponse.fail(null, 'Preset not found')); return null }
    await mgr.deleteInstance(req.params.id)
    return { deleted: true }
  })
})

// ─── Cloud sync ───────────────────────────────────────────────────────────────

router.post('/upload', (req: Request<object, object, { id: string }>, res: Response) => {
  wrap(res, () => Chaite.getInstance().getChatPresetManager().shareToCloud(req.body.id))
})

router.post('/download', (req: Request<object, object, { id: string }>, res: Response) => {
  wrap(res, async () => {
    const manager = Chaite.getInstance().getChatPresetManager()
    const preset = await manager.getFromCloud(req.body.id)
    if (!preset) { res.status(404).json(ChaiteResponse.fail(null, 'Preset not found in cloud')); return null }
    preset.cloudId = preset.id
    const existing = await manager.getInstanceByCloudId(preset.cloudId)
    if (existing.length > 0) {
      if (existing[0].toString() === preset.toString()) { res.status(400).json(ChaiteResponse.fail(null, '预设已是最新版本')); return null }
      preset.id = existing[0].id
    } else {
      preset.id = ''
    }
    const id = await manager.upsertInstance(preset)
    return { ...preset, id }
  })
})

router.post('/list-cloud', (req: Request<object, object, { filter?: Filter; options?: SearchOption; query: string }>, res: Response) => {
  wrap(res, () => Chaite.getInstance().getChatPresetManager().listFromCloud(req.body.filter || {}, req.body.query, req.body.options || {}))
})

export default router
