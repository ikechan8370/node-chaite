import express from 'express'
import { Request, Response } from 'express'
import { Chaite, ChaiteResponse, ChatPreset, Filter, SearchOption } from '../index.js'
const router = express.Router()

interface ListPresets {
  name?: string;
  prompt: string
}

// todo pageable
router.get('/list', async (req: Request<object, object, ListPresets>, res: Response) => {
  const body = req.body
  const chaite = Chaite.getInstance()
  let allChannels = await chaite.getChatPresetManager().listInstances()
  if (body.name) {
    allChannels = allChannels.filter(preset => preset.name.includes(body.name as string))
  }
  if (body.prompt) {
    allChannels = allChannels.filter(preset => preset.sendMessageOption.systemOverride === body.prompt)
  }
  res.status(200)
    .json(ChaiteResponse.ok(allChannels))
})

router.post('/', async (req: Request<object, object, ChatPreset>, res: Response) => {
  const body = req.body
  const chaite = Chaite.getInstance()
  try {
    const channel = await chaite.getChatPresetManager().addInstance(body)
    res.status(200)
      .json(ChaiteResponse.ok(channel))
  } catch (e) {
    chaite.getLogger().error(e as object)
    if (e instanceof Error) {
      res.status(500)
        .json(ChaiteResponse.fail(null, e.message))
    } else {
      res.status(500)
        .json(ChaiteResponse.fail(null, 'Unknown error'))
    }
  }
})

router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const chaite = Chaite.getInstance()
  try {
    const channel = await chaite.getChatPresetManager().getInstance(req.params.id)
    res.status(200)
      .json(ChaiteResponse.ok(channel))
  } catch (e) {
    chaite.getLogger().error(e as object)
    if (e instanceof Error) {
      res.status(500)
        .json(ChaiteResponse.fail(null, e.message))
    } else {
      res.status(500)
        .json(ChaiteResponse.fail(null, 'Unknown error'))
    }
  }
})

router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const chaite = Chaite.getInstance()
  try {
    await chaite.getChatPresetManager().deleteInstance(req.params.id)
    res.status(200)
      .json(ChaiteResponse.ok(null))
  } catch (e) {
    chaite.getLogger().error(e as object)
    if (e instanceof Error) {
      res.status(500)
        .json(ChaiteResponse.fail(null, e.message))
    } else {
      res.status(500)
        .json(ChaiteResponse.fail(null, 'Unknown error'))
    }
  }
})

interface UploadChannel {
  id: string
}

router.post('/upload', async (req: Request<object, object, UploadChannel>, res: Response) => {
  const chaite = Chaite.getInstance()
  try {
    const channel = await chaite.getChatPresetManager().shareToCloud(req.body.id)
    res.status(200)
      .json(ChaiteResponse.ok(channel))
  } catch (e) {
    chaite.getLogger().error(e as object)
    if (e instanceof Error) {
      res.status(500)
        .json(ChaiteResponse.fail(null, e.message))
    } else {
      res.status(500)
        .json(ChaiteResponse.fail(null, 'Unknown error'))
    }
  }
})

router.get('/download', async (req: Request<object, object, UploadChannel>, res: Response) => {
  const chaite = Chaite.getInstance()
  try {
    const channel = await chaite.getChatPresetManager().getFromCloud(req.body.id)
    res.status(200)
      .json(ChaiteResponse.ok(channel))
  } catch (e) {
    chaite.getLogger().error(e as object)
    if (e instanceof Error) {
      res.status(500)
        .json(ChaiteResponse.fail(null, e.message))
    } else {
      res.status(500)
        .json(ChaiteResponse.fail(null, 'Unknown error'))
    }
  }
})


interface ListCloudChannelRequest {
  filter?: Filter,
  options?: SearchOption,
  query: string
}

router.post('/list-cloud', async (req: Request<object, object, ListCloudChannelRequest>, res: Response) => {
  const chaite = Chaite.getInstance()
  try {
    const channels = await chaite.getChatPresetManager().listFromCloud(req.body.filter || {}, req.body.query, req.body.options || {})
    res.status(200)
      .json(ChaiteResponse.ok(channels))
  } catch (e) {
    chaite.getLogger().error(e as object)
    if (e instanceof Error) {
      res.status(500)
        .json(ChaiteResponse.fail(null, e.message))
    } else {
      res.status(500)
        .json(ChaiteResponse.fail(null, 'Unknown error'))
    }
  }
})

export default router