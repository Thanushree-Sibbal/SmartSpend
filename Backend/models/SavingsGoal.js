const mongoose = require("mongoose");

const SavingsGoalSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        name: {
            type: String,
            required: true
        },

        target: {
            type: Number,
            required: true
        },

        saved: {
            type: Number,
            default: 0
        },

        color: {
            type: String,
            default: "#2D9E6B"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "SavingsGoal",
    SavingsGoalSchema
);