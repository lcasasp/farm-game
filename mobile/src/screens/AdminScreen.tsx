import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
} from 'react-native'
import { useRole } from '../context/RoleContext'
import { sendMessage, sendNudge, triggerEvent, setApiSandbox } from '../lib/api'
import { useWebSocket } from '../hooks/useWebSocket'

export function AdminScreen() {
  const { lockAdmin } = useRole()
  const [messageText, setMessageText] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventMessage, setEventMessage] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [sandbox, setSandbox] = useState(false)
  const [lastNudge, setLastNudge] = useState<string | null>(null)

  useWebSocket((msg) => {
    if (msg.type === 'nudge') {
      setLastNudge(new Date().toLocaleTimeString())
    }
  })

  function toggleSandbox(val: boolean) {
    setSandbox(val)
    setApiSandbox(val)
  }

  async function handleSendMessage() {
    if (!messageText.trim()) return
    try {
      await sendMessage(messageText.trim())
      setMessageText('')
      Alert.alert('Sent!')
    } catch (err) {
      Alert.alert('Error', String(err))
    }
  }

  async function handleNudgeAck() {
    try {
      await sendNudge()
      Alert.alert('Nudge-ack sent!')
    } catch (err) {
      Alert.alert('Error', String(err))
    }
  }

  async function handleTriggerEvent() {
    if (!eventType.trim()) return
    try {
      await triggerEvent(
        eventType.trim(),
        eventMessage ? { message: eventMessage } : {},
        scheduledAt || undefined
      )
      setEventType('')
      setEventMessage('')
      setScheduledAt('')
      Alert.alert('Event triggered!')
    } catch (err) {
      Alert.alert('Error', String(err))
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin 🐇</Text>
          <View style={styles.sandboxRow}>
            <Text style={styles.sandboxLabel}>Sandbox</Text>
            <Switch value={sandbox} onValueChange={toggleSandbox} />
          </View>
        </View>

        {lastNudge && (
          <View style={styles.nudgeAlert}>
            <Text style={styles.nudgeAlertText}>Nudge received at {lastNudge} 🐰</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send message</Text>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity style={styles.button} onPress={handleSendMessage}>
            <Text style={styles.buttonText}>Send</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trigger event</Text>
          <TextInput
            style={styles.input}
            value={eventType}
            onChangeText={setEventType}
            placeholder="Event type (e.g. surprise)"
          />
          <TextInput
            style={styles.input}
            value={eventMessage}
            onChangeText={setEventMessage}
            placeholder="Message (optional)"
          />
          <TextInput
            style={styles.input}
            value={scheduledAt}
            onChangeText={setScheduledAt}
            placeholder="Scheduled at ISO (optional)"
          />
          <TouchableOpacity style={styles.button} onPress={handleTriggerEvent}>
            <Text style={styles.buttonText}>Trigger</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleNudgeAck}>
            <Text style={styles.secondaryButtonText}>Send nudge-ack</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.lockButton} onPress={lockAdmin}>
          <Text style={styles.lockButtonText}>Lock admin mode</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  sandboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sandboxLabel: { fontSize: 14, color: '#666' },
  nudgeAlert: {
    backgroundColor: '#fff5f9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  nudgeAlertText: { color: '#ff6b9d', fontWeight: '600' },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ff6b9d',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#ff6b9d', fontWeight: '600', fontSize: 15 },
  lockButton: {
    marginTop: 8,
    padding: 14,
    alignItems: 'center',
  },
  lockButtonText: { color: '#aaa', fontSize: 14 },
})
