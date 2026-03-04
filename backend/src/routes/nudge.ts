import { Router } from 'express'
import { requireUser } from '../middleware/auth'
import { db } from '../db'
import { sendPush } from '../services/push'
import { broadcast } from '../services/realtime'

const router = Router()

router.post('/nudge', requireUser, async (req, res) => {
  const sandbox = req.headers['x-sandbox'] === 'true'
  try {
    await db.query(`INSERT INTO nudges (sandbox) VALUES ($1)`, [sandbox])

    const { rows } = await db.query<{ push_token: string | null }>(
      `SELECT push_token FROM users WHERE id = 'admin'`
    )
    const token = rows[0]?.push_token
    if (token) {
      await sendPush(token, 'Nudge!', 'You got a nudge 🐰')
    }

    broadcast('admin', { type: 'nudge', sandbox })

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
