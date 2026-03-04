import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { registerPushToken } from '../lib/api'
import { useRole } from '../context/RoleContext'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export function usePush() {
  const { role } = useRole()

  useEffect(() => {
    if (Platform.OS !== 'ios') return

    async function register() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      if (finalStatus !== 'granted') {
        console.warn('Push notification permission denied')
        return
      }
      const tokenData = await Notifications.getExpoPushTokenAsync()
      const userId = role === 'admin' ? 'admin' : 'user'
      await registerPushToken(userId, tokenData.data)
    }

    register().catch(console.error)
  }, [role])
}
