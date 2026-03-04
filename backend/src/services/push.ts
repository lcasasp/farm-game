import Expo from 'expo-server-sdk'

const expo = new Expo()

export async function sendPush(
  token: string,
  title: string,
  body: string,
  data?: object
) {
  if (!Expo.isExpoPushToken(token)) {
    console.warn(`Invalid Expo push token: ${token}`)
    return
  }
  try {
    const chunks = expo.chunkPushNotifications([
      { to: token, title, body, data: data ?? {} },
    ])
    for (const chunk of chunks) {
      const receipts = await expo.sendPushNotificationsAsync(chunk)
      for (const receipt of receipts) {
        if (receipt.status === 'error') {
          console.error('Push error:', receipt.message, receipt.details)
        }
      }
    }
  } catch (err) {
    console.error('sendPush failed:', err)
  }
}
