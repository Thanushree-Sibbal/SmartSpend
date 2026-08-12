const express = require("express");
const SavingsGoal = require("../models/SavingsGoal");
const Account = require("../models/Account");
const auth = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// GET ALL SAVINGS GOALS
// ========================================

router.get("/", auth, async (req, res) => {
    try {

        const goals = await SavingsGoal.find({
            userId: req.userId
        }).sort({ createdAt: -1 });

        res.json(goals);

    } catch (error) {

        console.error("Savings goals fetch error:", error);

        res.status(500).json({
            message: "Failed to fetch savings goals"
        });

    }
});


// ========================================
// CREATE SAVINGS GOAL
// ========================================

router.post("/", auth, async (req, res) => {
    try {

        const { name, target, saved, color } = req.body;

        if (!name || !target || Number(target) <= 0) {
            return res.status(400).json({
                message: "Valid goal name and target are required"
            });
        }

        const goal = new SavingsGoal({
            userId: req.userId,
            name,
            target: Number(target),
            saved: Number(saved) || 0,
            color: color || "#2D9E6B"
        });

        await goal.save();

        res.status(201).json(goal);

    } catch (error) {

        console.error("Savings goal creation error:", error);

        res.status(500).json({
            message: "Failed to create savings goal"
        });

    }
});


// ========================================
// DEPOSIT INTO SAVINGS GOAL
// ========================================

router.post("/:id/deposit", auth, async (req, res) => {
    try {

        const amount = Number(req.body.amount);

        if (!amount || amount <= 0) {
            return res.status(400).json({
                message: "Valid deposit amount is required"
            });
        }

        const goal = await SavingsGoal.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!goal) {
            return res.status(404).json({
                message: "Savings goal not found"
            });
        }

        const account = await Account.findOne({
            userId: req.userId
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        if (amount > account.balance) {
            return res.status(400).json({
                message: "Insufficient wallet balance"
            });
        }

        const remainingGoal =
            Math.max(goal.target - goal.saved, 0);

        const depositAmount =
            Math.min(amount, remainingGoal);

        account.balance -= depositAmount;
        account.lastSyncedAt = new Date();

        goal.saved += depositAmount;

        await account.save();
        await goal.save();

        res.json({
            goal,
            balance: account.balance,
            message: "Amount deposited successfully"
        });

    } catch (error) {

        console.error("Savings goal deposit error:", error);

        res.status(500).json({
            message: "Failed to deposit into savings goal"
        });

    }
});


// ========================================
// DELETE SAVINGS GOAL
// ========================================

router.delete("/:id", auth, async (req, res) => {
    try {

        const goal = await SavingsGoal.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!goal) {
            return res.status(404).json({
                message: "Savings goal not found"
            });
        }

        res.json({
            message: "Savings goal deleted successfully"
        });

    } catch (error) {

        console.error("Savings goal deletion error:", error);

        res.status(500).json({
            message: "Failed to delete savings goal"
        });

    }
});


module.exports = router;