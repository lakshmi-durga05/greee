export function connectLiveWS(url) {
  // Build from VITE_BASE_URL when not provided
  if (!url) {
    const httpBase = (import.meta?.env?.VITE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
    const wsBase = httpBase.startsWith('https://')
      ? httpBase.replace('https://', 'wss://')
      : httpBase.replace('http://', 'ws://')
    url = wsBase + '/live'
  }
  const ws = new WebSocket(url)
  const api = {
    ws,
    join(id, role) {
      ws.readyState === WebSocket.OPEN
        ? ws.send(JSON.stringify({ type: 'join', id, role }))
        : ws.addEventListener('open', () => ws.send(JSON.stringify({ type: 'join', id, role })), { once: true })
    },
    sendLocation(id, coords) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'location', id, coords }))
      }
    },
    subscribe(driverId) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'subscribe', driverId }))
      } else {
        ws.addEventListener('open', () => ws.send(JSON.stringify({ type: 'subscribe', driverId })), { once: true })
      }
    },
    unsubscribe(driverId) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe', driverId }))
      }
    }
  }
  return api
}
