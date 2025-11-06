
import axios from 'axios'


const http = axios.create({
  headers: {
    'User-Agent': 'UberClone/1.0 (https://localhost)'
  },
  timeout: 5000
})

// Simple in-memory caches
const suggestCache = new Map() // key -> { at, data }
const reverseCache = new Map() // key -> { at, data }
const SUGGEST_TTL = 60 * 1000 // 60s
const REVERSE_TTL = 5 * 60 * 1000 // 5m

export const getLatLng=async (address) => {
  // Nominatim geocoding
  const url = 'https://nominatim.openstreetmap.org/search'
  try {
    const response = await http.get(url, {
      params: {
        q: address,
        format: 'json',
        addressdetails: 0,
        limit: 1
      }
    })
    if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
      const loc = response.data[0]
      return { latitude: parseFloat(loc.lat), longitude: parseFloat(loc.lon) }
    }
    return null
  } catch (error) {
    console.log(error)
    return null
  }
}

export const getAddressFromLatLng = async (lat, lng) => {
  // Nominatim reverse
  const url = 'https://nominatim.openstreetmap.org/reverse'
  try {
    const cacheKey = `${lat},${lng}`
    const hit = reverseCache.get(cacheKey)
    if (hit && (Date.now() - hit.at) < REVERSE_TTL) return hit.data
    const response = await http.get(url, {
      params: {
        lat,
        lon: lng,
        format: 'json'
      }
    })
    if (response.status === 200 && response.data?.display_name) {
      const addr = response.data.display_name
      const address = response.data?.address || {}
      const out = {
        address: addr,
        countryCode: address?.country_code || null,
        city: address?.city || address?.town || address?.village || null
      }
      reverseCache.set(cacheKey, { at: Date.now(), data: out })
      return out
    }
    return null
  } catch (err) {
    console.log(err)
    return null
  }
}

export async function getSuggestion(input, lat, lng, limit = 8, fast = false) {
  // Nominatim search suggestions
  try {
    const key = `${input}|${lat||''}|${lng||''}|${limit}|${fast?'1':'0'}`
    const cached = suggestCache.get(key)
    if (cached && (Date.now() - cached.at) < SUGGEST_TTL) return cached.data
    const base = {
      q: input,
      format: 'json',
      addressdetails: 0,
      limit: Math.max(1, Math.min(parseInt(limit)||8, 15)),
      dedupe: 1,
      'accept-language': 'en',
      namedetails: 1
    }
    // Fast path: global search only with small limit
    if (fast) {
      const res = await http.get('https://nominatim.openstreetmap.org/search', { params: base })
      const arr = Array.isArray(res.data) ? res.data : []
      const out = arr.map(item => ({
        title: item?.namedetails?.name || item?.display_name?.split(',')[0]?.trim() || 'Unknown',
        subtitle: item?.display_name?.split(',').slice(1).join(',').trim() || '',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        display_name: item.display_name,
      }))
      suggestCache.set(key, { at: Date.now(), data: out })
      return out
    }
    // Build requests
    const nearbyParams = (() => {
      if (!(lat && lng)) return null
      const d = 0.2
      return {
        ...base,
        viewbox: `${parseFloat(lng - d)},${parseFloat(lat + d)},${parseFloat(lng + d)},${parseFloat(lat - d)}`,
        bounded: 1
      }
    })()

    const nearbyReq = nearbyParams
      ? http.get('https://nominatim.openstreetmap.org/search', { params: nearbyParams }).then(r => r.data)
      : Promise.resolve([])
    const globalReq = http.get('https://nominatim.openstreetmap.org/search', { params: base }).then(r => r.data)

    // Helper to map results
    const mapOut = (arr) => (Array.isArray(arr) ? arr.map(item => ({
      title: item?.namedetails?.name || item?.display_name?.split(',')[0]?.trim() || 'Unknown',
      subtitle: item?.display_name?.split(',').slice(1).join(',').trim() || '',
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name,
    })) : [])

    // Race: prefer first non-empty
    let first = await Promise.race([
      nearbyReq.then(a => (a && a.length ? { type: 'nearby', data: a } : null)).catch(() => null),
      globalReq.then(a => (a && a.length ? { type: 'global', data: a } : null)).catch(() => null),
      new Promise(resolve => setTimeout(() => resolve(null), 1500))
    ])

    if (first && first.data && first.data.length) {
      const out = mapOut(first.data)
      suggestCache.set(key, { at: Date.now(), data: out })
      return out
    }

    // If neither won race, await both and merge quickly
    const [nearby, global] = await Promise.allSettled([nearbyReq, globalReq])
    const arr1 = nearby.status === 'fulfilled' ? nearby.value : []
    const arr2 = global.status === 'fulfilled' ? global.value : []
    const merged = mapOut([...(arr1 || []), ...(arr2 || [])])
    const unique = []
    const seen = new Set()
    for (const item of merged) {
      const key2 = `${item.title}|${item.subtitle}`
      if (!seen.has(key2)) {
        seen.add(key2)
        unique.push(item)
      }
      if (unique.length >= base.limit) break
    }
    // If still empty, FALLBACK to Photon (Komoot) for fast few results
    if (!unique.length) {
      try {
        const photonParams = {
          q: input,
          limit: Math.min(base.limit, 8),
        }
        if (lat && lng) { photonParams.lat = lat; photonParams.lon = lng }
        const photon = await http.get('https://photon.komoot.io/api/', { params: photonParams })
        const feats = photon?.data?.features || []
        const mapped = feats.map(f => {
          const p = f.properties || {}
          const title = p.name || p.street || p.city || p.district || 'Unknown'
          const parts = [p.street, p.suburb, p.city, p.state, p.country].filter(Boolean)
          return {
            title,
            subtitle: parts.join(', '),
            lat: f.geometry?.coordinates?.[1],
            lng: f.geometry?.coordinates?.[0],
            display_name: [title, ...parts].filter(Boolean).join(', ')
          }
        })
        if (mapped.length) {
          suggestCache.set(key, { at: Date.now(), data: mapped })
          return mapped
        }
      } catch (e) {
        // ignore photon errors
      }
    }
    suggestCache.set(key, { at: Date.now(), data: unique })
    return unique
    return []
  } catch (error) {
    console.error('Error fetching address suggestions:', error)
    return []
  }
}

export async function getDistanceandTime(startAddress, endAddress) {
  // Geocode both addresses first
  const start = await getLatLng(startAddress)
  const end = await getLatLng(endAddress)
  if (!start || !end) return null
  // OSRM routing
  const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}`
  try {
    const response = await http.get(url, { params: { overview: 'false', annotations: false } })
    if (response.status === 200 && response.data?.routes?.length) {
      const route = response.data.routes[0]
      return {
        distance: route.distance, // meters
        duration: route.duration  // seconds
      }
    }
    return null
  } catch (err) {
    console.log(err)
    return null
  }
}

 
