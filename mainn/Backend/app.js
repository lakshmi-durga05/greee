import express from 'express'
import dotenv from 'dotenv'
dotenv.config({
    path:'./.env'
})
import cors from 'cors'
import cookieparser from 'cookie-parser'
import { routes } from './src/routes/user-routes.js'
import Captainroute from './src/routes/captain-routes.js'
import maproutes from './src/routes/maps-routes.js'
import rideRoute from './src/routes/ride-routes.js' 
import insightsRoute from './src/routes/insights-routes.js'
import mlRoutes from './src/routes/ml-routes.js'




const userRoutes=routes
const app=express()
app.use(cors({
    origin: (origin, cb) => {
      // Allow undefined origin for tools like curl or same-origin
      if (!origin) return cb(null, true)
      const allowed = [
        /^http:\/\/localhost:5173$/,
        /^http:\/\/localhost:5174$/,
        /^http:\/\/127\.0\.0\.1:5173$/,
        /^http:\/\/127\.0\.0\.1:5174$/
      ]
      const ok = allowed.some(re => re.test(origin))
      cb(ok ? null : new Error('Not allowed by CORS'), ok)
    },
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
  }));
app.use(express.json())
app.use(cookieparser())
app.get('/', (req, res) => {
  res.status(200).send('Backend is running. Try /user/register, /user/login, or /maps/getSuggestion?input=New%20York');
})
app.use('/user',userRoutes)
app.use('/captain',Captainroute)
app.use('/maps',maproutes)
app.use('/ride',rideRoute)
app.use('/insights',insightsRoute)
app.use('/ml', mlRoutes)

export {app} 
