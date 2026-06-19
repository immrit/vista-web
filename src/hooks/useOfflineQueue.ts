'use client'

import { useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/apiClient'

const DB_NAME = 'vista_offline'
const STORE_NAME = 'message_queue'

interface QueuedMessage {
  id: string
  conversationId: string
  content: string
  timestamp: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getQueued(): Promise<QueuedMessage[]> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => resolve(req.result as QueuedMessage[])
      req.onerror = () => reject(req.error)
    })
  } catch { return [] }
}

async function removeQueued(id: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const req = tx.objectStore(STORE_NAME).delete(id)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch { /* silent */ }
}

export async function queueMessage(conversationId: string, content: string): Promise<void> {
  try {
    const db = await openDB()
    const item: QueuedMessage = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      conversationId,
      content,
      timestamp: Date.now(),
    }
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const req = tx.objectStore(STORE_NAME).add(item)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    // Register background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready
      await (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('vista-message-sync')
    }
  } catch { /* silent */ }
}

export function useOfflineQueue() {
  const flushQueue = useCallback(async () => {
    const items = await getQueued()
    for (const item of items) {
      try {
        await apiClient.post(`/v1/chat/conversations/${item.conversationId}/messages`, { content: item.content })
        await removeQueued(item.id)
      } catch { /* will retry next time */ }
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => { void flushQueue() }
    window.addEventListener('online', handleOnline)
    if (navigator.onLine) void flushQueue()
    return () => window.removeEventListener('online', handleOnline)
  }, [flushQueue])

  return { queueMessage, flushQueue }
}
