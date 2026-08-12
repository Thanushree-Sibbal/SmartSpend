const express = require("express");

const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const auth = require("../middleware/authMiddleware");

const router = express.Router();


// ========================================
// GET ALL TRANSACTIONS
// ========================================

router.get("/", auth, async (req, res) => {

  try {

    const transactions = await Transaction.find({
      userId: req.userId
    }).sort({ date: -1 });

    res.json(transactions);

  } catch (error) {

    console.error("Transaction fetch error:", error);

    res.status(500).json({
      message: "Failed to fetch transactions"
    });

  }

});


// ========================================
// CREATE TRANSACTION
// ========================================

router.post("/", auth, async (req, res) => {

  try {

    const amount = Number(req.body.amount);

    if (!amount || amount === 0) {
      return res.status(400).json({
        message: "Valid transaction amount is required"
      });
    }


    // ------------------------------------
    // CREATE TRANSACTION
    // ------------------------------------

    const transaction = new Transaction({

      userId: req.userId,

      description: req.body.description,

      amount: amount

    });


    await transaction.save();


    // ------------------------------------
    // UPDATE CONNECTED ACCOUNT BALANCE
    // ------------------------------------

    const account = await Account.findOne({
      userId: req.userId
    });


    if (account) {

      /*
       Positive amount = income
       Negative amount = expense

       Example:

       Balance = ₹10,000
       Expense = -₹500

       New balance = ₹9,500
      */

      account.balance += amount;

      account.lastSyncedAt = new Date();

      await account.save();

    }


    // ------------------------------------
    // RETURN UPDATED DATA
    // ------------------------------------

    res.json({
      transaction: transaction,

      balance: account
        ? account.balance
        : null,

      message: "Transaction added successfully"

    });

  } catch (error) {

    console.error("Transaction creation error:", error);

    res.status(500).json({
      message: "Failed to create transaction"
    });

  }

});


module.exports = router;