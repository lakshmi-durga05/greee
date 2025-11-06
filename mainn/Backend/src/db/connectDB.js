import mongoose from "mongoose";

export const connectDb=async () => {
    mongoose.connect(process.env.MONGO_URL)
    .then(()=>console.log('Connected to mongo DB'))
    .catch(err=>console.log(err))
}
