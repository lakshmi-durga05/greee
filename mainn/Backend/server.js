import dotenv from 'dotenv'

dotenv.config({
    path:'./.env'
})
import http from 'http'
import {app} from './app.js'
import { connectDb } from './src/db/connectDB.js'
import { initializeSocket } from './src/utils/GlobalSocket.js'
import { startLiveWS } from './src/ws/live.js'
import { initKafka, shutdownKafka } from './src/kafka/kafka.js'



const server=http.createServer(app)
const port = process.env.PORT || 3000


initializeSocket(server)
startLiveWS(server)
// Initialize Kafka (no-op if disabled)
initKafka().catch(()=>{})
server.listen(port,()=>{
    console.log(`Server is listening on ${port}`);
})

connectDb()//Conneting to db after creating the server
