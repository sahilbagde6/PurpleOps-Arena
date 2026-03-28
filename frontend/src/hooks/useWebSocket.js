import { useEffect, useRef } from 'react'

// Fix 12: use refs to avoid stale closure and stop reconnect after unmount
export function useWebSocket(runId, onMessage) {
  const wsRef = useRef(null)
  const pingRef = useRef(null)
  const onMessageRef = useRef(onMessage)
  const mountedRef = useRef(true)

  // Keep callback ref fresh without triggering reconnect
  useEffect(() => {
    onMessageRef.current = onMessage
  })

  useEffect(() => {
    mountedRef.current = true

    if (!runId) return

    function connect() {
      if (!mountedRef.current) return

      const token = localStorage.getItem('access_token')
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const url = `${proto}://${window.location.host}/ws/${runId}?token=${token}`

      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return }
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000)
      }

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type !== 'pong') onMessageRef.current?.(data)
        } catch {}
      }

      ws.onclose = () => {
        clearInterval(pingRef.current)
        // Only reconnect if component still mounted
        if (mountedRef.current) {
          setTimeout(connect, 3000)
        }
      }

      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      mountedRef.current = false
      clearInterval(pingRef.current)
      wsRef.current?.close()
    }
  }, [runId]) // only reconnect when runId changes
}
