import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { RoleProvider, useRole } from './context/RoleContext'
import { UserScreen } from './screens/UserScreen'
import { AdminScreen } from './screens/AdminScreen'
import { EventOverlay } from './components/EventOverlay'
import { usePush } from './hooks/usePush'

function AppInner() {
  const { role } = useRole()
  usePush()

  return (
    <>
      {role === 'admin' ? <AdminScreen /> : <UserScreen />}
      <EventOverlay />
      <StatusBar style="auto" />
    </>
  )
}

export default function App() {
  return (
    <RoleProvider>
      <AppInner />
    </RoleProvider>
  )
}
