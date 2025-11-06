import express from 'express'
import {body} from 'express-validator'
import { getCapProfile,  loginCaptain, logoutCap, registerCaptain, getOnlineCaptains } from '../controllers/captain-controllers.js'
import { authmiddlewareCap, authmiddlewareUser } from '../middleware/auth-middleware.js'
const Captainroute=express.Router()

Captainroute.post('/register',
    [
        body('email').isEmail().withMessage('Invalid email'),
        body('fullname.firstname').isLength({min:3}).withMessage('Firstname should be greater than 3 characters'),
        body('phone').matches(/^\+?\d{10,15}$/).withMessage('Valid phone is required (10-15 digits, optional +)'),
        body('vehicle.capacity').isInt({min:1}).withMessage('Capacity should be greater or eqaul to 1'),
        body('vehicle.plate').isLength({min:3}).withMessage("Plate should have 3 or more chracters"),
        body('vehicle.vehicleType').isIn(['Car','Motorcycle','Auto']).withMessage('Vehicle should be car,auto,motorcycle'),
        body('vehicle.color').isLength({min:3}).withMessage('color should have 3 or more chracters'),
        body('password').isLength({min:3}).withMessage('Password should have 3 or more chracters'),
    ],
    registerCaptain
)


Captainroute.post('/login',[
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({min:3}).withMessage('Password should have 3 or more chracters')
],
loginCaptain
)

Captainroute.get('/profile',authmiddlewareCap,getCapProfile)
Captainroute.get('/logout',authmiddlewareCap,logoutCap)
Captainroute.get('/online',getOnlineCaptains)



export default Captainroute