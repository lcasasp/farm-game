import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { setApiRole } from '../lib/api'

type Role = 'admin' | 'user'

interface RoleContextValue {
  role: Role
  attemptAdminUnlock: (code: string) => boolean
  lockAdmin: () => void
}

const RoleContext = createContext<RoleContextValue | null>(null)

const STORAGE_KEY = 'bunny_farm_role'

function getUnlockCode(): string {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined
  return extra?.adminUnlockCode ?? ''
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('user')

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'admin') {
        setRole('admin')
        setApiRole('admin')
      }
    })
  }, [])

  function attemptAdminUnlock(code: string): boolean {
    if (code === getUnlockCode()) {
      setRole('admin')
      setApiRole('admin')
      AsyncStorage.setItem(STORAGE_KEY, 'admin')
      return true
    }
    return false
  }

  function lockAdmin() {
    setRole('user')
    setApiRole('user')
    AsyncStorage.setItem(STORAGE_KEY, 'user')
  }

  return (
    <RoleContext.Provider value={{ role, attemptAdminUnlock, lockAdmin }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
