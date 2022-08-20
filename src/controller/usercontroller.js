const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../models/usermodel")
const sendMail = require("../utils/sendmail")

// desc => create a new account
// route =>POST/api/createaccount
const createaccount = async(req,res)=>{
    try{
        let { email,fullName,password,pin} = req.body
      
        const accountNumber =  Math.floor((Math.random() * 1000000)+1 ) 
      
        const findaccount = await User.findOne({email})
      
        if(findaccount) return res.status(404).json({success:false,msg:"user exist"})
      
        const hashedPassword = await bcrypt.hash(password,12)
      
        const hashedPin = await bcrypt.hash(pin,12)
      
        password = hashedPassword
      
        pin = hashedPin
      
        const newUser = await new User({email,fullName,password,accountNumber,pin})
      
        await newUser.save()
      
        res.status(200).json({success:true,msg:"you have successfully created an account",data:newUser})
    }catch(error){
        res.status(404).json({success:false,msg:error.message})
        console.log(error)
    }
   
    
}

// desc => log in
// route =>POST/api/login
const login = async(req,res)=>{
    try{
        const password = req.body.password
       
        const accountNumber = req.body.accountNumber
       
        let user = await User.findOne({accountNumber})
       
        if(!user) return res.status(404).json({success:false,msg:"account does not exist"})
       
        const validaccount = await bcrypt.compare(password,user.password)
       
        if(!validaccount) return res.status(404).json({success:false,msg:"invalid credentials"})
       
        const token = jwt.sign({accountNumber:user.accountNumber,email:user.email,_id:user._id},process.env.SECRET,{expiresIn:"1d"})
       

        // send email alert for log in
        try{
            await sendMail({
                email:user.email,
                subject:"login alert",
                message:`you successfully logged into your account at ${Date()}`
            })
        }catch(error){
            console.log(error)
            return res.status(500).json({
                success:false,
                msg:error.message
            })
            
        }
        res.status(200).json({
            success:true,
            msg:"successfully logged in",
           token:token
        })
    }catch(error){
        console.log(error)
        return res.status(404).json({
            success:false,
            msg:error.message
        })
    }
   
}

// desc => deposit money
// route =>POST/api/deposit

const cashDeposit = async(req,res)=>{
    try{
        const {accountNumber,amount} = req.body
        
        const findaccount = await User.findOne({accountNumber})
       
        if(!findaccount) return res.status(404).json({success:false,msg:`Account number ${accountNumber} does not exist`})
        
        findaccount.balance = Number(amount) + findaccount.balance

        findaccount.transactionHistory.push(`you have been credited with ${amount} at ${Date()}`)
       
        await findaccount.save()

        // send credit alert
        try{
            await sendMail({
                email:findaccount.email,
                subject:"credit alert",
                message:`you have been credited with ${amount} at ${Date()}`
            })
        }catch(error){
            console.log(error)
            return res.status(500).json({
                success:false,
                msg:error.message
            })
            
        }
       
        res.status(200).json({success:true,msg:`your account ${accountNumber} was credited with ${amount}`,balance:findaccount.balance})
   
    }catch(error){
        res.status(404).json({success:false,msg:error.message})
    }
   
}


// desc => transfer money
// route =>POST/api/transfer
const transfer = async(req,res)=>{
    try{
        const {accountNumber,amount,pin} = req.body
    const {_id} = req.user
   
    const findaccountDebit = await User.findOne({_id})
   
    const validuser = await bcrypt.compare(pin,findaccountDebit.pin)
   
    if(!validuser) return res.status(404).json({success:false,msg:"invalid pin"})
   
    const findaccountCredit = await User.findOne({accountNumber})
   
    if(!findaccountCredit) return res.status(404).json({success:false,msg:`Account number ${accountNumber} does not exist`})
   
    if(findaccountDebit.balance<amount) return res.status(200).json({success:false,msg:"insufficient balance"})

   
    findaccountDebit.balance = findaccountDebit.balance - Number(amount)

    
    findaccountCredit.balance = findaccountCredit.balance + Number(amount)

    findaccountDebit.transactionHistory.push(`you have been debited with ${amount} at ${Date()}`)
    
    findaccountCredit.transactionHistory.push(`you have been credited with ${amount} at ${Date()}`)
   
    await findaccountDebit.save()
   
    await findaccountCredit.save()

     // send credit alert
     try{
        await sendMail({
            email:findaccountCredit.email,
            subject:"credit alert",
            message:`you have been credited with ${amount} at ${Date()}`
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            msg:error.message
        })
        
    }

    // send debit alert
    try{
        await sendMail({
            email:findaccountDebit.email,
            subject:"debit alert",
            message:`you have been debited with ${amount} at ${Date()}`
        })
    }catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            msg:error.message
        })
        
    }

   
    res.status(200).json({success:true,msg:`your account have been debited with ${amount} at ${Date()}`,balance:findaccountDebit.balance})



    }catch(error){
        res.status(404).json({success:false,msg:error.message})
    }
    

}

// desc => get a logged in user details
// route =>GET/api/getaccount
const getAccount = async(req,res)=>{
    try{
        const {accountNumber} = req.user
       
        const findaccount = await User.findOne({accountNumber})
       
        const data = {
            _id:findaccount._id,
           email: findaccount.email,
           fullName: findaccount.fullName,
           accountNumber:findaccount.accountNumber,
           balance:findaccount.balance,
           transactionHistory:findaccount.transactionHistory
        }
      
        res.status(200).json({success:true,data:data})
   
    }catch(error){
        res.status(404).json({success:false,msg:error.message})
    }
}


// desc => get a logged in transaction history
// route =>GET/api/transactionhistory
const transactionHistory = async(req,res)=>{
    try{
        const {accountNumber} = req.user
       
        const findaccount = await User.findOne({accountNumber})
       
        const data = {
            balance:findaccount.balance,
           transactionHistory:findaccount.transactionHistory
        }
      
        res.status(200).json({success:true,data:data})
   
    }catch(error){
        res.status(404).json({success:false,msg:error.message})
    }
}

module.exports = {createaccount,login,cashDeposit,transfer,getAccount,transactionHistory}



