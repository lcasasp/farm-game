import 'dotenv/config'
import http from 'http'
import { createApp } from './app'
import { runMigrations } from './db'
import { initWebSocketServer } from './services/realtime'
import { initCron } from './services/cron'

const app = createApp()
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
