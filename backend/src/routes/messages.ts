import { Router } from 'express'
import { requireAdmin, requireUser } from '../middleware/auth'
import { db } from '../db'
import { sendPush } from '../services/push'
import { broadcast } from '../services/realtime'

const router = Router()

router.post('/message', requireAdmin, async (req, res) => {
  const { content, message_type = 'text' } = req.body as {
    content: string
    message_type?: string
  }
  if (!content) {
    res.status(400).json({ error: 'content is required' })
    return
  }

  try {
    const { rows } = await db.query<{ id: string; created_at: string }>(
      `INSERT INTO messages (content, message_type, sender_id)
       VALUES ($1, $2, 'admin')
       RETURNING id, created_at`,
      [content, message_type]
    )
    const message = rows[0]

    const { rows: userRows } = await db.query<{ push_token: string | null }>(
      `SELECT push_token FROM users WHERE id = 'user'`
    )
    const token = userRows[0]?.push_token
    if (token) {
      await sendPush(token, 'New message 🐰', content)
    }

    broadcast('user', { type: 'message', content, message_type, id: message.id })

    res.json({ ok: true, id: message.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/messages', requireUser, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, content, message_type, read, created_at
       FROM messages
       ORDER BY created_at DESC`
    )

    await db.query(`UPDATE messages SET read = TRUE WHERE read = FALSE`)

    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
