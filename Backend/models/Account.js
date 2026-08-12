const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        provider: {
            type: String,
            default: "UPI"
        },

        bankName: {
            type: String,
            default: "Demo Bank"
        },

        accountNumberMasked: {
            type: String,
            default: "XXXX XXXX"
        },

        upiId: {
            type: String,
            default: ""
        },

        balance: {
            type: Number,
            default: 0
        },

        currency: {
            type: String,
            default: "INR"
        },

        connectionStatus: {
            type: String,
            enum: ["connected", "disconnected", "demo"],
            default: "demo"
        },

        lastSyncedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Account", AccountSchema);