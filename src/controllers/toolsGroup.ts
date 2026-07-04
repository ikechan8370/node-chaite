import express, { Router, Request, Response } from 'express'
import { Chaite, ChaiteResponse, Filter, SearchOption, ToolsGroupDTO } from '../index'

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

/** GET /api/toolGroups/list?name=xxx&page=1&pageSize=20 */
router.get('/list', (req: Request, res: Response) => {
  wrap(res, async () => {
    let items = await Chaite.getInstance().getToolsGroupManager().listInstances()
    const name = req.query['name'] as string | undefined
    if (name) items = items.filter(g => g.name.includes(name))
    return paginate(items, req)
  })
})

/** POST /api/toolGroups — create */
router.post('/', (req: Request<object, object, ToolsGroupDTO>, res: Response) => {
  wrap(res, async () => {
    const id = await Chaite.getInstance().getToolsGroupManager().addInstance(req.body)
    return { ...req.body, id }
  })
})

/** PUT /api/toolGroups/:id — full update */
router.put('/:id', (req: Request<{ id: string }, object, ToolsGroupDTO>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getToolsGroupManager()
    const existing = await mgr.getInstance(req.params.id)
    if (!existing) { res.status(404).json(ChaiteResponse.fail(null, 'Tool group not found')); return null }
    const body: ToolsGroupDTO = { ...req.body, id: req.params.id } as ToolsGroupDTO
    const id = await mgr.addInstance(body)
    return { ...body, id }
  })
})

/** GET /api/toolGroups/:id */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const group = await Chaite.getInstance().getToolsGroupManager().getInstance(req.params.id)
    if (!group) { res.status(404).json(ChaiteResponse.fail(null, 'Tool group not found')); return null }
    return group
  })
})

/** DELETE /api/toolGroups/:id */
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getToolsGroupManager()
    const existing = await mgr.getInstance(req.params.id)
    if (!existing) { res.status(404).json(ChaiteResponse.fail(null, 'Tool group not found')); return null }
    await mgr.deleteInstance(req.params.id)
    return { deleted: true }
  })
})

// ─── Cloud sync ───────────────────────────────────────────────────────────────

router.post('/upload', (req: Request<object, object, { id: string }>, res: Response) => {
  wrap(res, () => Chaite.getInstance().getToolsGroupManager().shareToCloud(req.body.id))
})

// Fixed: was GET /download (body ignored by most clients) → now POST /download
router.post('/download', (req: Request<object, object, { id: string }>, res: Response) => {
  wrap(res, async () => {
    const group = await Chaite.getInstance().getToolsGroupManager().getFromCloud(req.body.id)
    if (!group) { res.status(404).json(ChaiteResponse.fail(null, 'Tool group not found in cloud')); return null }
    return group
  })
})

router.post('/list-cloud', (req: Request<object, object, { filter?: Filter; options?: SearchOption; query: string }>, res: Response) => {
  wrap(res, () => Chaite.getInstance().getToolsGroupManager().listFromCloud(req.body.filter || {}, req.body.query, req.body.options || {}))
})

export default router
