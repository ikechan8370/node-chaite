import express from 'express'
import { Request, Response } from 'express'
import { Chaite, ChaiteResponse, Filter, ProcessorDTO, SearchOption } from '../index.js'
const router = express.Router()

interface ListProcessorDTO {
  name?: string;
  ptype: 'pre' | 'post'
}

// todo pageable
router.get('/list', async (req: Request<object, object, ListProcessorDTO>, res: Response) => {
  const body = req.body
  const chaite = Chaite.getInstance()
  let allProcessorDTO = await chaite.getProcessorsManager().listInstances()
  if (body.name) {
    allProcessorDTO = allProcessorDTO.filter(tool => tool.name.includes(body.name as string))
  }
  if (body.ptype) {
    allProcessorDTO = allProcessorDTO.filter(tool => tool.type === body.ptype)
  }
  res.status(200)
    .json(ChaiteResponse.ok(allProcessorDTO))
})

router.post('/', async (req: Request<object, object, ProcessorDTO>, res: Response) => {
  const body = req.body
  const chaite = Chaite.getInstance()
  try {
    const channel = await chaite.getProcessorsManager().addInstance(body)
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
    const channel = await chaite.getProcessorsManager().getInstanceT(req.params.id)
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
    await chaite.getProcessorsManager().deleteInstance(req.params.id)
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
    const channel = await chaite.getProcessorsManager().shareToCloud(req.body.id)
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
    const channel = await chaite.getProcessorsManager().getFromCloud(req.body.id)
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
    const channels = await chaite.getProcessorsManager().listFromCloud(req.body.filter || {}, req.body.query, req.body.options || {})
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