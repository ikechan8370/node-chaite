import express from 'express'
import { Request, Response } from 'express'
import { Chaite, ChaiteResponse, FrontEndAuthHandler, GlobalConfig } from '../index.js'
const router = express.Router()

interface LoginRequest {
  token: string;
}

router.post('/login', async (req: Request<object, object, LoginRequest>, res: Response) => {
  const body = req.body
  const success = Chaite.getInstance().getFrontendAuthHandler()?.validateToken(body.token)
  if (success) {
    if (!Chaite.getInstance().getGlobalConfig()) {
      Chaite.getInstance().setGlobalConfig(new GlobalConfig())
    }
    const config = Chaite.getInstance().getGlobalConfig() as GlobalConfig
    const key = config.getAuthKey() || Chaite.getInstance().getFrontendAuthHandler().generateToken(0, true)
    config.setAuthKey(key)
    const token = FrontEndAuthHandler.generateJWT(key)
    res.status(200)
      .json(ChaiteResponse.ok({
        token: token,
        expiresIn: 24 * 60 * 60,
      }))
  }
})

export default router