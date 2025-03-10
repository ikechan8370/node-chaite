import express from 'express'
import { Request, Response } from 'express'
import { Chaite, ChaiteResponse, Channel, Filter, SearchOption } from '../index'
import { authenticateToken } from './middlewares'
const router = express.Router()

interface ListChannels {
  name?: string;
  type?: Channel['type']
  status?: Channel['status']
  model?: string
}
// todo pageable
router.get('/list', async (req: Request<object, object, ListChannels>, res: Response) => {
  const body = req.body
  const chaite = Chaite.getInstance()
  let allChannels = await chaite.getChannelsManager().listInstances()
  if (body.name) {
    allChannels = allChannels.filter(channel => channel.name.includes(body.name as string))
  }
  if (body.type) {
    allChannels = allChannels.filter(channel => channel.type === body.type)
  }
  if (body.status) {
    allChannels = allChannels.filter(channel => channel.status === body.status)
  }
  if (body.model) {
    allChannels = allChannels.filter(channel => channel.models.includes(body.model as string))
  }
  res.status(200)
    .json(ChaiteResponse.ok(allChannels))
})

router.post('/', async (req: Request<object, object, Channel>, res: Response) => {
  const body = req.body
  const chaite = Chaite.getInstance()
  try {
    const channel = await chaite.getChannelsManager().addInstance(body)
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
    const channel = await chaite.getChannelsManager().getInstance(req.params.id)
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
    await chaite.getChannelsManager().deleteInstance(req.params.id)
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
    const channel = await chaite.getChannelsManager().shareToCloud(req.body.id)
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
    const channel = await chaite.getChannelsManager().getFromCloud(req.body.id)
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
    const channels = await chaite.getChannelsManager().listFromCloud(req.body.filter || {}, req.body.query, req.body.options || {})
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