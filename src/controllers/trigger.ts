import express, { Router } from 'express'
import { Request, Response } from 'express'
import { Chaite, ChaiteResponse, Filter, TriggerDTO, SearchOption } from '../index'
const router: Router = express.Router()

interface ListTriggerDTO {
  name?: string;
  status: 'enabled' | 'disabled'
}

// todo pageable
router.get('/list', async (req: Request<object, object, ListTriggerDTO>, res: Response) => {
  const body = req.body
  const chaite = Chaite.getInstance()
  let allTriggerDTOs = await chaite.getTriggerManager().listInstances()
  if (body.name) {
    allTriggerDTOs = allTriggerDTOs.filter(tool => tool.name.includes(body.name as string))
  }
  if (body.status) {
    allTriggerDTOs = allTriggerDTOs.filter(tool => tool.status === body.status)
  }
  res.status(200)
    .json(ChaiteResponse.ok(allTriggerDTOs))
})

router.post('/', async (req: Request<object, object, TriggerDTO>, res: Response) => {
  const body = req.body
  const chaite = Chaite.getInstance()
  try {
    const triggerId = await chaite.getTriggerManager().addInstance(body)
    if (body.status === 'enabled') {
      chaite.getTriggerManager().registerTrigger(body.name)
    }
    res.status(200)
      .json(ChaiteResponse.ok(triggerId))
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
    const trigger = await chaite.getTriggerManager().getInstanceT(req.params.id)
    res.status(200)
      .json(ChaiteResponse.ok(trigger))
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
    await chaite.getTriggerManager().deleteInstance(req.params.id)
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
    const trigger = await chaite.getTriggerManager().shareToCloud(req.body.id)
    res.status(200)
      .json(ChaiteResponse.ok(trigger))
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

router.post('/download', async (req: Request<object, object, UploadToolDTO>, res: Response) => {
  const chaite = Chaite.getInstance()
  try {
    const manager = chaite.getTriggerManager()
    const trigger = await manager.getFromCloud(req.body.id)
    if (!trigger) {
      res.status(404)
        .json(ChaiteResponse.fail(null, 'Trigger not found'))
      return
    }
    trigger.cloudId = trigger.id
    const existTriggers = await manager.getInstanceTByCloudId(trigger.cloudId)
    if (existTriggers.length > 0) {
      // 如果已经有了，则视为更新，先检查哈希
      const existTool = existTriggers[0]
      if (existTool.code === trigger.code) {
        res.status(400)
          .json(ChaiteResponse.fail(null, '触发器已存在且是最新版本'))
        return
      }
      // 如果自己的更新日期更新但md5不一致可能是本地修改，会覆盖 再说吧 // todo
      trigger.id = existTriggers[0].id
    } else {
      // 否则视为第一次下载
      trigger.id = ''
    }
    const channelId = await manager.upsertInstanceT(trigger)
    trigger.id = channelId
    res.status(200)
      .json(ChaiteResponse.ok(trigger))
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
    const triggers = await chaite.getTriggerManager().listFromCloud(req.body.filter || {}, req.body.query, req.body.options || {})
    res.status(200)
      .json(ChaiteResponse.ok(triggers))
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