import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'bunny-farm',
  slug: process.env.EXPO_PROJECT_SLUG ?? 'lcasasp',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.lcasasp.bunnyfarm',
  },
  plugins: [['expo-notifications', { sounds: [] }]],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    sandboxApiUrl: process.env.EXPO_PUBLIC_SANDBOX_API_URL,
    adminUnlockCode: process.env.EXPO_PUBLIC_ADMIN_UNLOCK_CODE ?? process.env.ADMIN_UNLOCK_CODE,
    userSecret: process.env.EXPO_PUBLIC_USER_SECRET ?? process.env.USER_SECRET,
    adminSecret: process.env.EXPO_PUBLIC_ADMIN_SECRET ?? process.env.ADMIN_SECRET,
  },
})
