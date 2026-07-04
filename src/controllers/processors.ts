import express, { Router, Request, Response } from 'express'
import { Chaite, ChaiteResponse, Filter, ProcessorDTO, SearchOption } from '../index'

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

/** GET /api/processors/list?name=xxx&type=pre|post&page=1&pageSize=20 */
router.get('/list', (req: Request, res: Response) => {
  wrap(res, async () => {
    let items = await Chaite.getInstance().getProcessorsManager().listInstances()
    const name = req.query['name'] as string | undefined
    const type = req.query['type'] as string | undefined
    if (name) items = items.filter(p => p.name.includes(name))
    if (type) items = items.filter(p => p.type === type)
    return paginate(items, req)
  })
})

/** POST /api/processors — create */
router.post('/', (req: Request<object, object, ProcessorDTO>, res: Response) => {
  wrap(res, async () => {
    const id = await Chaite.getInstance().getProcessorsManager().addInstance(req.body)
    return { ...req.body, id }
  })
})

/** PUT /api/processors/:id — full update */
router.put('/:id', (req: Request<{ id: string }, object, ProcessorDTO>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getProcessorsManager()
    const existing = await mgr.getInstanceT(req.params.id)
    if (!existing) { res.status(404).json(ChaiteResponse.fail(null, 'Processor not found')); return null }
    const body: ProcessorDTO = { ...req.body, id: req.params.id } as ProcessorDTO
    const id = await mgr.upsertInstanceT(body)
    return { ...body, id }
  })
})

/** GET /api/processors/:id */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const processor = await Chaite.getInstance().getProcessorsManager().getInstanceT(req.params.id)
    if (!processor) { res.status(404).json(ChaiteResponse.fail(null, 'Processor not found')); return null }
    return processor
  })
})

/** DELETE /api/processors/:id */
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getProcessorsManager()
    const existing = await mgr.getInstanceT(req.params.id)
    if (!existing) { res.status(404).json(ChaiteResponse.fail(null, 'Processor not found')); return null }
    await mgr.deleteInstance(req.params.id)
    return { deleted: true }
  })
})

// ─── Cloud sync ───────────────────────────────────────────────────────────────

router.post('/upload', (req: Request<object, object, { id: string }>, res: Response) => {
  wrap(res, () => Chaite.getInstance().getProcessorsManager().shareToCloud(req.body.id))
})

router.post('/download', (req: Request<object, object, { id: string }>, res: Response) => {
  wrap(res, async () => {
    const manager = Chaite.getInstance().getProcessorsManager()
    const processor = await manager.getFromCloud(req.body.id)
    if (!processor) { res.status(404).json(ChaiteResponse.fail(null, 'Processor not found in cloud')); return null }
    processor.cloudId = processor.id
    const existing = await manager.getInstanceTByCloudId(processor.cloudId)
    if (existing.length > 0) {
      if (existing[0].code === processor.code) { res.status(400).json(ChaiteResponse.fail(null, '处理器已是最新版本')); return null }
      processor.id = existing[0].id
    } else {
      processor.id = ''
    }
    const id = await manager.upsertInstanceT(processor)
    return { ...processor, id }
  })
})

router.post('/list-cloud', (req: Request<object, object, { filter?: Filter; options?: SearchOption; query: string }>, res: Response) => {
  wrap(res, () => Chaite.getInstance().getProcessorsManager().listFromCloud(req.body.filter || {}, req.body.query, req.body.options || {}))
})

export default router
