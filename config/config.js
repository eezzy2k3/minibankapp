require("dotenv").config()
const mongoose = require("mongoose")

const connectDb = ()=>{
    mongoose.connect(process.env.MONGO_URL)
    console.log("connected to database")
}

module.exports=connectDb