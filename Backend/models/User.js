/* const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  // Added username field to store the person's real name
  username: {
    type: String,
    required: [true, "Name is required"],
    trim: true, // Removes accidental trailing spaces
    minlength: [2, "Name must be at least 2 characters long"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true, // Ensures "User@Example.com" is stored as "user@example.com"
    trim: true
  },
  password: {
    type: String,
    required: [true, "Password is required"]
  }
}, { 
  // Automatically adds 'createdAt' and 'updatedAt' fields
  timestamps: true 
});

module.exports = mongoose.model("User", UserSchema);*/


const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

  username:{
    type:String,
    required:true,
    trim:true,
    minlength:2
  },

  email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true
  },

  password:{
    type:String,
    required:true
  }

},{timestamps:true});

module.exports = mongoose.model("User",UserSchema);