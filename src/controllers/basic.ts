import express, { Router } from 'express'
import { Chaite, ChaiteResponse } from '../index'
import { VERSION } from '../version'

const router: Router = express.Router()

router.get('/info', (req, res) => {
  const chaite = Chaite.getInstance()
  const user = chaite.getToolsManager()?.cloudService?.getUser()
  if (user) {
    user.api_key = ''
  }
  const body = {
    user,
    version: VERSION,
  }
  res.status(200)
    .json(ChaiteResponse.ok(body))
})

export default router