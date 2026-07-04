import express, { Router, Request, Response } from 'express'
import { Chaite, ChaiteResponse, ToolDTO, Filter, SearchOption } from '../index'

const router: Router = express.Router()

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

/** GET /api/tools/list?name=xxx&page=1&pageSize=20 */
router.get('/list', (req: Request, res: Response) => {
  wrap(res, async () => {
    let items = await Chaite.getInstance().getToolsManager().listInstances()
    const name = req.query['name'] as string | undefined
    if (name) items = items.filter(t => t.name.includes(name))
    return paginate(items, req)
  })
})

/** POST /api/tools — create (no id) or update (with id in body) */
router.post('/', async (req: Request<object, object, ToolDTO>, res: Response) => {
  wrap(res, async () => {
    const body = req.body
    const mgr = Chaite.getInstance().getToolsManager()
    if (body.id) {
      const old = await mgr.getInstanceT(body.id)
      if (!old) { res.status(404).json(ChaiteResponse.fail(null, 'Tool not found')); return null }
      if (old.name !== body.name) await mgr.renameFile(body.id, old.name, body.name)
    }
    const id = await mgr.addInstance(body)
    body.id = id
    return body
  })
})

/** PUT /api/tools/:id — full update */
router.put('/:id', async (req: Request<{ id: string }, object, ToolDTO>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getToolsManager()
    const old = await mgr.getInstanceT(req.params.id)
    if (!old) { res.status(404).json(ChaiteResponse.fail(null, 'Tool not found')); return null }
    const body = Object.assign(req.body, { id: req.params.id })
    if (old.name !== body.name) await mgr.renameFile(req.params.id, old.name, body.name)
    const id = await mgr.addInstance(body)
    return { ...body, id }
  })
})

/** GET /api/tools/:id */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const tool = await Chaite.getInstance().getToolsManager().getInstanceT(req.params.id)
    if (!tool) { res.status(404).json(ChaiteResponse.fail(null, 'Tool not found')); return null }
    return tool
  })
})

/** DELETE /api/tools/:id */
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getToolsManager()
    const existing = await mgr.getInstanceT(req.params.id)
    if (!existing) { res.status(404).json(ChaiteResponse.fail(null, 'Tool not found')); return null }
    await mgr.deleteInstance(req.params.id)
    return { deleted: true }
  })
})

// ─── Cloud sync ───────────────────────────────────────────────────────────────

router.post('/upload', (req: Request<object, object, { id: string }>, res: Response) => {
  wrap(res, () => Chaite.getInstance().getToolsManager().shareToCloud(req.body.id))
})

router.post('/download', async (req: Request<object, object, { id: string }>, res: Response) => {
  wrap(res, async () => {
    const manager = Chaite.getInstance().getToolsManager()
    const tool = await manager.getFromCloud(req.body.id)
    if (!tool) { res.status(404).json(ChaiteResponse.fail(null, 'Tool not found in cloud')); return null }
    tool.cloudId = tool.id
    const existing = await manager.getInstanceTByCloudId(tool.cloudId)
    if (existing.length > 0) {
      if (existing[0].code === tool.code) { res.status(400).json(ChaiteResponse.fail(null, '工具已是最新版本')); return null }
      tool.id = existing[0].id
    } else {
      tool.id = ''
    }
    const id = await manager.upsertInstanceT(tool)
    return { ...tool, id }
  })
})

router.post('/list-cloud', (req: Request<object, object, { filter?: Filter; options?: SearchOption; query: string }>, res: Response) => {
  wrap(res, () => Chaite.getInstance().getToolsManager().listFromCloud(req.body.filter || {}, req.body.query, req.body.options || {}))
})

export default router
