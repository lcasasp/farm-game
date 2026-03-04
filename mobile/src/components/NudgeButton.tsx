import React, { useState } from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { sendNudge } from '../lib/api'

export function NudgeButton() {
  const [sending, setSending] = useState(false)

  async function handleNudge() {
    if (sending) return
    setSending(true)
    try {
      await sendNudge()
    } catch (err) {
      console.error('Nudge failed:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handleNudge} disabled={sending}>
      {sending ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.label}>🐰 Nudge!</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ff6b9d',
    paddingVertical: 24,
    paddingHorizontal: 48,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
})
