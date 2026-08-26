const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  refreshToken: { type: String }, 
  storageUsed: { type: Number, default: 0 },
  documentsUploaded: { type: Number, default: 0 },
},
 { timestamps: true });

module.exports = mongoose.model('User', userSchema);