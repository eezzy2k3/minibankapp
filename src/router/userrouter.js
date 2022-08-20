const {createaccount,login,cashDeposit,transfer,getAccount, transactionHistory} = require("../controller/usercontroller")
const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth")

router.post("/createaccount",createaccount)
router.post("/login",login)
router.post("/deposit",cashDeposit)
router.post("/transfer",auth,transfer)
router.get("/getaccount",auth,getAccount)
router.get("/transactionhistory",auth,transactionHistory)

module.exports =router
