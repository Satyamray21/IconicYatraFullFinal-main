import mongoose from "mongoose";

export const bankSchema= mongoose.Schema({
    bankName:{
        type:String,
        
    },
    branchName:{
        type:String,
        
    },
    accountHolderName:{
        type:String,
        
    },
    accountNumber:{
        type:String,
        
    },
    ifscCode:{
        type:String,
        
    },
    upiId:{
        type:String,
        
    },
    qrCode:{
        type:String,
        
    }
},{_id:false})

