import express, { Router, Request, Response } from 'express'
import { Chaite, ChaiteResponse, Channel, Filter, SearchOption } from '../index'
import { ChaiteContext, TextContent, ImageContent, UserMessage, BaseClientOptions, Tool } from '../types'
import { createClient } from '../adapters'

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
    if (model) items = items.filter(c => c.models.some(m => m.name.includes(model)))
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

// ─── Channel test ────────────────────────────────────────────────────────────

/** POST /api/channels/test — test channel connectivity */
router.post('/test', (req: Request<object, object, { id: string; model?: string }>, res: Response) => {
  wrap(res, async () => {
    const { id, model } = req.body
    const mgr = Chaite.getInstance().getChannelsManager()
    const channel = await mgr.getInstance(id)
    if (!channel) {
      res.status(404).json(ChaiteResponse.fail(null, 'Channel not found'))
      return null
    }

    const testModel = model || channel.models[0]?.name
    if (!testModel) {
      res.status(400).json(ChaiteResponse.fail(null, 'No model specified and channel has no models'))
      return null
    }

    const context = new ChaiteContext(Chaite.getInstance().getLogger())
    context.chaite = Chaite.getInstance()
    const client = createClient(channel.adapterType, channel.options, context)
    const startTime = Date.now()

    try {
      const result = await client.sendMessage(
        { role: 'user', content: [{ type: 'text', text: 'Hi! Reply with exactly: OK' }] } as UserMessage,
        { model: testModel, maxToken: 10, temperature: 0, stream: false }
      )
      const elapsed = Date.now() - startTime
      const content = result.contents
        ? result.contents.map((c: any) => c.text || '').join('')
        : ''

      return {
        success: true,
        model: testModel,
        elapsed,
        response: content.trim().substring(0, 200),
        usage: result.usage,
      }
    } catch (e) {
      const elapsed = Date.now() - startTime
      return {
        success: false,
        model: testModel,
        elapsed,
        error: e instanceof Error ? e.message : 'Unknown error',
      }
    }
  })
})

/** POST /api/channels/auto-features — auto-detect channel features */
router.post('/auto-features', (req: Request<object, object, { id: string; model?: string }>, res: Response) => {
  wrap(res, async () => {
    const { id, model } = req.body
    const mgr = Chaite.getInstance().getChannelsManager()
    const channel = await mgr.getInstance(id)
    if (!channel) {
      res.status(404).json(ChaiteResponse.fail(null, 'Channel not found'))
      return null
    }

    const testModel = model || channel.models[0]?.name
    if (!testModel) {
      res.status(400).json(ChaiteResponse.fail(null, 'No model specified'))
      return null
    }

    const context = new ChaiteContext(Chaite.getInstance().getLogger())
    context.chaite = Chaite.getInstance()
    const client = createClient(channel.adapterType, channel.options, context)
    const results: Record<string, { supported: boolean; detail?: string }> = {}

    // Test chat
    try {
      await client.sendMessage(
        { role: 'user', content: [{ type: 'text', text: 'Say just HELLO' }] } as UserMessage,
        { model: testModel, maxToken: 10, temperature: 0, stream: false }
      )
      results.chat = { supported: true, detail: 'OK' }
    } catch (e: any) {
      results.chat = { supported: false, detail: e?.message || 'failed' }
    }

    // Test visual (send a tiny 1x1 base64 png)
    try {
      const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const visualMsg: UserMessage = {
        role: 'user',
        content: [
          { type: 'text', text: 'Say exactly one word describing this image' } as TextContent,
          { type: 'image', image: tinyPng, mimeType: 'image/png' } as ImageContent,
        ],
      }
      await client.sendMessage(visualMsg,
        { model: testModel, maxToken: 20, temperature: 0, stream: false }
      )
      results.visual = { supported: true, detail: 'OK' }
    } catch (e: any) {
      results.visual = { supported: false, detail: e?.message || 'failed' }
    }

    // Test embedding
    try {
      await client.getEmbedding('test', { model: testModel })
      results.embedding = { supported: true, detail: 'OK' }
    } catch (e: any) {
      results.embedding = { supported: false, detail: e?.message || 'failed' }
    }

    // Test tool — create a temp client with a dummy tool and check if the model calls it
    try {
      const toolClient = createClient(channel.adapterType, {
        ...channel.options,
        tools: [{
          name: 'get_weather',
          type: 'function' as const,
          function: {
            name: 'get_weather',
            description: 'Get current weather for a city',
            parameters: {
              type: 'object' as const,
              properties: { location: { type: 'string', description: 'City name' } },
              required: ['location'],
            },
          },
          run: async () => 'ok',
        }] as unknown as Tool[],
      }, context)
      await toolClient.sendMessage(
        { role: 'user', content: [{ type: 'text', text: 'What is the weather in Beijing? Use the get_weather function to check.' } as TextContent] } as UserMessage,
        { model: testModel, maxToken: 500, temperature: 0, stream: false, toolChoice: { type: 'any' } }
      )
      // toolChoice: 'any' → tool_choice: 'required'. If no error, tools are supported.
      results.tool = { supported: true, detail: 'OK' }
    } catch (e: any) {
      results.tool = { supported: false, detail: e?.message || 'failed' }
    }

    return {
      model: testModel,
      features: results,
    }
  })
})

export default router
