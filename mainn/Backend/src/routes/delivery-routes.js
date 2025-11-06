import e from "express"
import { authmiddlewareUser } from "../middleware/auth-middleware"
import { createDelivery } from "../controllers/ride-controller"

const deliveryRoutes=e.Router()

deliveryRoutes.post('/createDelivery',
    authmiddlewareUser,
    [
            body('pickUp').isString().isLength({min:3}),
            body('drop').isString().isLength({min:3}),
            body('vehicleType').isIn(['car','motorcycle','auto'])
        ],
        createDelivery
)

