const express = require("express");

const Account = require("../models/Account");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

/*
========================================
GET ACCOUNT
========================================
*/

router.get("/", auth, async (req, res) => {
    try {
        let account = await Account.findOne({
            userId: req.userId
        });

        if (!account) {
            account = await Account.create({
                userId: req.userId,
                provider: "UPI",
                bankName: "Demo Bank",
                upiId: "demo@upi",
                balance: 0,
                connectionStatus: "demo"
            });
        }

        res.json(account);

    } catch (err) {

        console.error("Account fetch error:", err);

        res.status(500).json({
            message: "Failed to fetch account"
        });
    }
});


/*
========================================
CONNECT DEMO UPI ACCOUNT
========================================
*/

router.post("/connect-demo", auth, async (req, res) => {
    try {

        const {
            bankName,
            upiId,
            balance
        } = req.body;

        if (!upiId) {
            return res.status(400).json({
                message: "UPI ID is required"
            });
        }

        let account = await Account.findOne({
            userId: req.userId
        });

        if (!account) {

            account = new Account({
                userId: req.userId
            });

        }

        account.provider = "UPI";
        account.bankName = bankName || "Demo Bank";
        account.upiId = upiId;
        account.balance = Number(balance) || 0;
        account.connectionStatus = "demo";
        account.lastSyncedAt = new Date();

        await account.save();

        res.json({
            message: "UPI account connected successfully",
            account
        });

    } catch (err) {

        console.error("UPI connection error:", err);

        res.status(500).json({
            message: "Failed to connect UPI account"
        });
    }
});


/*
========================================
UPDATE / SYNC BALANCE
========================================
*/

router.post("/sync", auth, async (req, res) => {
    try {

        const { balance } = req.body;

        const account = await Account.findOne({
            userId: req.userId
        });

        if (!account) {
            return res.status(404).json({
                message: "UPI account not connected"
            });
        }

        account.balance = Number(balance);
        account.lastSyncedAt = new Date();

        await account.save();

        res.json({
            message: "Balance synced successfully",
            balance: account.balance,
            lastSyncedAt: account.lastSyncedAt
        });

    } catch (err) {

        console.error("Balance sync error:", err);

        res.status(500).json({
            message: "Failed to sync balance"
        });
    }
});


/*
========================================
DISCONNECT ACCOUNT
========================================
*/

router.post("/disconnect", auth, async (req, res) => {
    try {

        const account = await Account.findOne({
            userId: req.userId
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        account.connectionStatus = "disconnected";

        await account.save();

        res.json({
            message: "UPI account disconnected"
        });

    } catch (err) {

        console.error("Disconnect error:", err);

        res.status(500).json({
            message: "Failed to disconnect account"
        });
    }
});


module.exports = router;