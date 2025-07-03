import express, { Router } from 'express'
import { Request, Response } from 'express'
import { Chaite, ChaiteResponse, ToolDTO, Filter, SearchOption } from '../index'
import { getMd5 } from '../utils/hash'
const router: Router = express.Router()

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
    if (body.id) {
      const old = await chaite.getToolsManager().getInstanceT(body.id)
      if (!old) {
        res.status(404)
          .json(ChaiteResponse.fail(null, 'Tool not found'))
        return
      }
      if (old.name !== body.name) {
        // 给工具改名，需要调整文件名，删除原本的C
        await chaite.getToolsManager().renameFile(body.id, old.name, body.name)
      }
    }
    const channelId = await chaite.getToolsManager().addInstance(body)
    body.id = channelId
    res.status(200)
      .json(ChaiteResponse.ok(body))
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

router.post('/download', async (req: Request<object, object, UploadToolDTO>, res: Response) => {
  const chaite = Chaite.getInstance()
  try {
    const manager = chaite.getToolsManager()
    const tool = await manager.getFromCloud(req.body.id)
    if (!tool) {
      res.status(404)
        .json(ChaiteResponse.fail(null, 'Tool not found'))
      return
    }
    tool.cloudId = tool.id
    const existCloudTools = await manager.getInstanceTByCloudId(tool.cloudId)
    if (existCloudTools.length > 0) {
      // 如果已经有了，则视为更新，先检查哈希
      const existTool = existCloudTools[0]
      if (existTool.code === tool.code) {
        res.status(400)
          .json(ChaiteResponse.fail(null, '工具已存在且是最新版本'))
        return
      }
      // 如果自己的更新日期更新但md5不一致可能是本地修改，会覆盖 再说吧 // todo
      tool.id = existTool.id
    } else {
      // 否则视为第一次下载
      tool.id = ''
    }
    const toolId = await manager.upsertInstanceT(tool)
    tool.id = toolId
    res.status(200)
      .json(ChaiteResponse.ok(tool))
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