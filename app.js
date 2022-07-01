require("dotenv").config()
const express = require("express")
const connectDb = require("./config/config")
const router = require("./src/router/userrouter")

const app = express()
app.use(express.urlencoded({extended:false}))
app.use(express.json())
connectDb()

app.use("/api",router)


app.listen(5000,()=>{
    console.log("app is listening on port 5000....")
})