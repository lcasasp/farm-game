import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native'
import { useRole } from '../context/RoleContext'

export function UserScreen() {
  const { attemptAdminUnlock } = useRole()
  const [tapCount, setTapCount] = useState(0)
  const [showUnlock, setShowUnlock] = useState(false)
  const [unlockCode, setUnlockCode] = useState('')

  function handleTitleTap() {
    const next = tapCount + 1
    if (next >= 5) {
      setTapCount(0)
      setShowUnlock(true)
    } else {
      setTapCount(next)
      setTimeout(() => setTapCount(0), 2000)
    }
  }

  function handleUnlockSubmit() {
    const success = attemptAdminUnlock(unlockCode)
    if (!success) {
      Alert.alert('Incorrect code')
    }
    setUnlockCode('')
    setShowUnlock(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={handleTitleTap} activeOpacity={1}>
        <Text style={styles.title}>bunny farm 🐰</Text>
      </TouchableOpacity>

      <Modal visible={showUnlock} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter code</Text>
            <TextInput
              style={styles.input}
              value={unlockCode}
              onChangeText={setUnlockCode}
              secureTextEntry
              autoFocus
              onSubmitEditing={handleUnlockSubmit}
              placeholder="••••••"
            />
            <TouchableOpacity style={styles.button} onPress={handleUnlockSubmit}>
              <Text style={styles.buttonText}>Unlock</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowUnlock(false)
                setUnlockCode('')
              }}
            >
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancel: {
    color: '#aaa',
    fontSize: 14,
  },
})
