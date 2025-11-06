import express from 'express'
import { acceptPredict } from '../controllers/ml-controller.js'

const mlRoutes = express.Router()

mlRoutes.post('/acceptPredict', acceptPredict)

export default mlRoutes
