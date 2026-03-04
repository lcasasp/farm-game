import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { db } from '../db'

const router = Router()

router.get('/game', requireAuth, async (_req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT state, updated_at FROM game_state WHERE user_id = 'user'`
    )
    res.json(rows[0] ?? { state: {}, updated_at: null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/game', requireAdmin, async (req, res) => {
  const { state } = req.body as { state: object }
  if (!state || typeof state !== 'object') {
    res.status(400).json({ error: 'state must be an object' })
    return
  }
  try {
    await db.query(
      `INSERT INTO game_state (user_id, state, updated_at)
       VALUES ('user', $1, NOW())
       ON CONFLICT (user_id) DO UPDATE SET state = $1, updated_at = NOW()`,
      [JSON.stringify(state)]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/users/:id/push-token', requireAuth, async (req, res) => {
  const { id } = req.params
  const { token } = req.body as { token: string }
  if (!token) {
    res.status(400).json({ error: 'token is required' })
    return
  }
  try {
    await db.query(
      `UPDATE users SET push_token = $1 WHERE id = $2`,
      [token, id]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
