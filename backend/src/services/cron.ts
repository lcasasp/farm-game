import cron from 'node-cron'
import { db } from '../db'
import { broadcast } from './realtime'
import { sendPush } from './push'

export function initCron() {
  cron.schedule('* * * * *', async () => {
    try {
      const { rows } = await db.query<{
        id: string
        event_type: string
        payload: Record<string, unknown>
      }>(
        `SELECT id, event_type, payload
         FROM events
         WHERE triggered = FALSE
           AND scheduled_at IS NOT NULL
           AND scheduled_at <= NOW()`
      )

      for (const event of rows) {
        // Broadcast to user
        broadcast('user', {
          type: 'event',
          event_type: event.event_type,
          payload: event.payload,
        })

        // Push notify user
        const { rows: userRows } = await db.query<{ push_token: string | null }>(
          `SELECT push_token FROM users WHERE id = 'user'`
        )
        const token = userRows[0]?.push_token
        if (token) {
          await sendPush(
            token,
            event.event_type,
            (event.payload as { message?: string }).message ?? 'New event!',
            event.payload
          )
        }

        await db.query(`UPDATE events SET triggered = TRUE WHERE id = $1`, [event.id])
      }
    } catch (err) {
      console.error('Cron job error:', err)
    }
  })

  console.log('Cron jobs initialized')
}
