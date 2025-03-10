import express from 'express'
import { Request, Response } from 'express'
import { Chaite, ChaiteResponse, ToolDTO, Filter, SearchOption } from '../index'
const router = express.Router()

interface ListToolDTOs {
  name?: string;
}

// todo pageable
router.get('/list', async (req: Request<object, object, ListToolDTOs>, res: Response) => {
  const body = req.body
  const chaite = Chaite.getInstance()
  let allToolDTOs = await chaite.getToolsManager().listInstances()
  if (body.name) {
    allToolDTOs = allToolDTOs.filter(tool => tool.name.includes(body.name as string))
  }
  res.status(200)
    .json(ChaiteResponse.ok(allToolDTOs))
})

router.post('/', async (req: Request<object, object, ToolDTO>, res: Response) => {
  const body = req.body
  const chaite = Chaite.getInstance()
  try {
    const channel = await chaite.getToolsManager().addInstance(body)
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
    const channel = await chaite.getToolsManager().getInstanceT(req.params.id)
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
    await chaite.getToolsManager().deleteInstance(req.params.id)
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

interface UploadToolDTO {
  id: string
}

router.post('/upload', async (req: Request<object, object, UploadToolDTO>, res: Response) => {
  const chaite = Chaite.getInstance()
  try {
    const channel = await chaite.getToolsManager().shareToCloud(req.body.id)
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

router.get('/download', async (req: Request<object, object, UploadToolDTO>, res: Response) => {
  const chaite = Chaite.getInstance()
  try {
    const channel = await chaite.getToolsManager().getFromCloud(req.body.id)
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


interface ListCloudToolDTORequest {
  filter?: Filter,
  options?: SearchOption,
  query: string
}

router.post('/list-cloud', async (req: Request<object, object, ListCloudToolDTORequest>, res: Response) => {
  const chaite = Chaite.getInstance()
  try {
    const channels = await chaite.getToolsManager().listFromCloud(req.body.filter || {}, req.body.query, req.body.options || {})
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