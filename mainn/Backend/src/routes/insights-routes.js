import express from 'express'
import { getHotspots, getForecast } from '../controllers/insights-controller.js'

const insightsRoute = express.Router()

// GET /insights/hotspots?lat=..&lng=..&limit=5
insightsRoute.get('/hotspots', getHotspots)
// GET /insights/forecast?lat=..&lng=..&limit=3&horizonMin=30
insightsRoute.get('/forecast', getForecast)

export default insightsRoute
