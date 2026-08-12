const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({

  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  description:String,

  amount:Number,

  date:{
    type:Date,
    default:Date.now
  }

});

module.exports = mongoose.model("Transaction",TransactionSchema);