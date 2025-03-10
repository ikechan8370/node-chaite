import { Request, Response, NextFunction, RequestHandler } from 'express'
import { Chaite, FrontEndAuthHandler } from '../index'

export const authenticateToken: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.header('Authorization')

  if (!token) {
    res.status(401).json({ message: 'Access denied, token missing' })
    return
  }

  try {
    const authKey = Chaite.getInstance().getGlobalConfig()?.getAuthKey()
    if (FrontEndAuthHandler.validateJWT(authKey as string, token)) {
      next()
      return
    }
    res.status(401).json({ message: 'Invalid token' })
  } catch (error) {
    res.status(401).json({ message: 'Invalid token format' })
  }
}