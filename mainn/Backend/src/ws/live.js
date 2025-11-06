import { WebSocketServer } from 'ws'

// In-memory registries
const clients = new Map() // ws -> {id, role}
const drivers = new Map() // driverId -> {lat, lng, ts}
const subscribers = new Map() // driverId -> Set<ws>

export function startLiveWS(server) {
  const wss = new WebSocketServer({ server, path: '/live' })

  const safeSend = (ws, payload) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(payload))
    }
  }

  wss.on('connection', (ws) => {
    clients.set(ws, { id: null, role: null })

    ws.on('message', (raw) => {
      let msg
      try {
        msg = JSON.parse(raw)
      } catch {
        return
      }

      // Join as driver or user
      if (msg.type === 'join' && msg.id && msg.role) {
        clients.set(ws, { id: String(msg.id), role: msg.role })
        safeSend(ws, { type: 'joined', id: String(msg.id), role: msg.role })
        return
      }

      // Driver location update
      if (msg.type === 'location' && msg.id && msg.coords) {
        const id = String(msg.id)
        drivers.set(id, { ...msg.coords, ts: Date.now() })
        const subs = subscribers.get(id)
        if (subs) {
          for (const sub of subs) safeSend(sub, { type: 'driver_location', id, coords: msg.coords })
        }
        return
      }

      // User subscribes to a driver id
      if (msg.type === 'subscribe' && msg.driverId) {
        const dId = String(msg.driverId)
        if (!subscribers.has(dId)) subscribers.set(dId, new Set())
        subscribers.get(dId).add(ws)
        // Send last known immediately
        const last = drivers.get(dId)
        if (last) safeSend(ws, { type: 'driver_location', id: dId, coords: { lat: last.lat, lng: last.lng } })
        return
      }

      // Unsubscribe
      if (msg.type === 'unsubscribe' && msg.driverId) {
        const dId = String(msg.driverId)
        subscribers.get(dId)?.delete(ws)
        return
      }
    })

    ws.on('close', () => {
      const meta = clients.get(ws)
      // Remove from all subscriber lists
      for (const set of subscribers.values()) set.delete(ws)
      if (meta?.role === 'driver') {
        // Optionally keep last known; do nothing here
      }
      clients.delete(ws)
    })
  })

  console.log('Live WebSocket running at path /live')
  return wss
}
