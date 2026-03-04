import { useState, useEffect } from 'react'
import { getGameState, updateGameState } from '../lib/api'

export function useGameState() {
  const [state, setState] = useState<object>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGameState()
      .then((res) => setState(res.state))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function setGameState(newState: object) {
    await updateGameState(newState)
    setState(newState)
  }

  return { gameState: state, setGameState, loading }
}
