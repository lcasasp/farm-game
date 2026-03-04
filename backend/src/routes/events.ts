import { Router } from 'express'
import { requireAdmin } from '../middleware/auth'
import { db } from '../db'
import { sendPush } from '../services/push'
import { broadcast } from '../services/realtime'

const router = Router()

router.post('/event', requireAdmin, async (req, res) => {
  const { event_type, payload = {}, scheduled_at } = req.body as {
    event_type: string
    payload?: object
    scheduled_at?: string
  }
  const sandbox = req.headers['x-sandbox'] === 'true'

  if (!event_type) {
    res.status(400).json({ error: 'event_type is required' })
    return
  }

  try {
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO events (event_type, payload, scheduled_at, sandbox)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [event_type, JSON.stringify(payload), scheduled_at ?? null, sandbox]
    )
    const eventId = rows[0].id

    if (!scheduled_at) {
      broadcast('user', { type: 'event', event_type, payload })

      const { rows: userRows } = await db.query<{ push_token: string | null }>(
        `SELECT push_token FROM users WHERE id = 'user'`
      )
      const token = userRows[0]?.push_token
      if (token) {
        await sendPush(
          token,
          event_type,
          (payload as { message?: string }).message ?? 'New event!',
          payload as Record<string, unknown>
        )
      }

      await db.query(`UPDATE events SET triggered = TRUE WHERE id = $1`, [eventId])
    }

    res.json({ ok: true, id: eventId, scheduled: !!scheduled_at })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
