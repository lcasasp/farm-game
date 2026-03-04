import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface Props {
  content: string | null
  timestamp?: string | null
}

export function MessageDisplay({ content, timestamp }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Latest message</Text>
      <Text style={styles.content}>
        {content ?? 'No messages yet 🌸'}
      </Text>
      {timestamp && (
        <Text style={styles.timestamp}>
          {new Date(timestamp).toLocaleString()}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff5f9',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    width: '100%',
  },
  label: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    fontSize: 18,
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 8,
  },
})
