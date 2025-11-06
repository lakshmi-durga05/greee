import { getCoordinates, getDistance, getSuggestions, reverseGeocode } from "../controllers/maps-controller.js";
import express from 'express'
import { authmiddlewareUser } from "../middleware/auth-middleware.js";
import { query } from "express-validator";
const maproutes=express.Router()

maproutes.get('/getCo-ordinates',[
query('address').isString().isLength({min:3})
],getCoordinates)

maproutes.get('/getDistance',getDistance)
maproutes.get('/getSuggestion',[
    query('input').isString().isLength({min:2}),
],getSuggestions)

maproutes.get('/reverseGeocode',[
    query('lat').isNumeric(),
    query('lng').isNumeric()
],reverseGeocode)


export default maproutes