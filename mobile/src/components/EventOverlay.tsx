import React, { useState, useRef } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native'
import ConfettiCannon from 'react-native-confetti-cannon'
import { useWebSocket } from '../hooks/useWebSocket'

const { width, height } = Dimensions.get('window')

export function EventOverlay() {
  const [visible, setVisible] = useState(false)
  const [eventMessage, setEventMessage] = useState('')
  const [eventType, setEventType] = useState('')
  const confettiRef = useRef<ConfettiCannon>(null)

  useWebSocket((msg) => {
    if (msg.type === 'event') {
      const payload = msg.payload as { message?: string } | undefined
      setEventType(msg.event_type as string ?? 'Event')
      setEventMessage(payload?.message ?? '🎉')
      setVisible(true)
      setTimeout(() => confettiRef.current?.start(), 100)
    }
  })

  function dismiss() {
    setVisible(false)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <ConfettiCannon
          ref={confettiRef}
          count={120}
          origin={{ x: width / 2, y: -20 }}
          autoStart={false}
          fadeOut
        />
        <View style={styles.card}>
          <Text style={styles.eventType}>{eventType}</Text>
          <Text style={styles.message}>{eventMessage}</Text>
          <TouchableOpacity style={styles.dismiss} onPress={dismiss}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    width,
    height,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    width: '80%',
  },
  eventType: {
    fontSize: 14,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  message: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 32,
  },
  dismiss: {
    backgroundColor: '#ff6b9d',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  dismissText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
