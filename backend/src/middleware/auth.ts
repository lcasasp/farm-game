import { Request, Response, NextFunction } from 'express'

declare global {
  namespace Express {
    interface Request {
      role: 'admin' | 'user'
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' })
    return
  }
  const token = header.slice(7)
  if (token === process.env.ADMIN_SECRET) {
    req.role = 'admin'
    next()
  } else if (token === process.env.USER_SECRET) {
    req.role = 'user'
    next()
  } else {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.role !== 'admin') {
      res.status(403).json({ error: 'Admin only' })
      return
    }
    next()
  })
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.role !== 'user') {
      res.status(403).json({ error: 'User only' })
      return
    }
    next()
  })
}
