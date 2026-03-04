import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import { runMigrations } from './db'
import { initWebSocketServer } from './services/realtime'
import { initCron } from './services/cron'
import nudgeRouter from './routes/nudge'
import messagesRouter from './routes/messages'
import eventsRouter from './routes/events'
import gameStateRouter from './routes/gameState'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/api', nudgeRouter)
app.use('/api', messagesRouter)
app.use('/api', eventsRouter)
app.use('/api', gameStateRouter)

const httpServer = http.createServer(app)
initWebSocketServer(httpServer)

const PORT = process.env.PORT ?? 3000

async function start() {
  try {
    await runMigrations()
    initCron()
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start:', err)
    process.exit(1)
  }
}

start()
