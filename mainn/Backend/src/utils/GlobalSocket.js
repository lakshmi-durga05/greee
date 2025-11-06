import {userModel} from '../models/user-model.js'
import { CaptainModel } from '../models/captain-model.js'
import { RideModel } from '../models/ride-schema.js'    
import {Server} from 'socket.io'    
import mongoose from 'mongoose'
let io //global variable for circulating the socket accross the backend server
const initializeSocket=(server)=>{
     io=new Server(server,{
        cors:{
            origin:'*',
            methods:['GET',"POST"]
        }
    })


    io.on('connection',(socket)=>{
        // console.log(`Client connected: ${socket.id}`);
        
        //creating a specific event in which inserting of socket id is done
        socket.on('join',async(data)=>{
            try{
                const{userId,role}=data || {}
                if(!userId || !mongoose.isValidObjectId(userId)){
                    socket.emit('error',{message:'Invalid or missing userId for join'})
                    return
                }
                if(role==='user'){
                    await userModel.findByIdAndUpdate(userId,{
                        socketId:socket.id,
                        lastSeen: Date.now()
                    })
                }
                else if(role==='captain'){
                    // console.log(`Captain is connected ${userId}`);
                    await CaptainModel.findByIdAndUpdate(userId,{
                        socketId:socket.id,
                        lastSeen: Date.now(),
                        status: 'active'
                    })
                }
            }catch(err){
                console.error('join handler error:',err)
                socket.emit('error',{message:'Failed to join'})
            }
        })
 

        socket.on('update-location',async(data)=>{
            try{
                const {location,id}=data || {}
                if(!id || !mongoose.isValidObjectId(id)){
                    socket.emit('error',{message:'Invalid or missing captain id'})
                    return
                }
                if(!location || typeof location.lat!== 'number' || typeof location.lng!== 'number'){
                    socket.emit('error',{message:"Missing location field"})
                    return
                }
                // console.log(`Captian location ${location.lat} ${location.lng}`);
                await CaptainModel.findByIdAndUpdate(id,{
                    location:{
                    lat:location.lat,
                    lng:location.lng
                    },
                    lastSeen: Date.now()
                })
            }catch(err){
                console.error('update-location error:',err)
                socket.emit('error',{message:'Failed to update location'})
            }

        })
        socket.on('disconnect',async()=>{
            try{
                // Mark any captain with this socket as inactive
                await CaptainModel.findOneAndUpdate({ socketId: socket.id }, {
                    status: 'inactive',
                    socketId: null,
                    lastSeen: Date.now()
                })
            }catch{}
            // console.log(`Client disconnected: ${socket.id}`);
        })
    })
    return io
}

const sendMessage=function(socketId,messageObj){
    try{
        if(io && socketId){
            io.to(socketId).emit(messageObj.event,messageObj.data)
        } else {
            console.warn('sendMessage skipped: io or socketId missing')
        }
    }catch(err){
        console.warn('sendMessage error (non-fatal):', err?.message)
    }
}
export{
    initializeSocket,
   sendMessage
}