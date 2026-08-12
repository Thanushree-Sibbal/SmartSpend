require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const savingsGoalRoutes = require("./routes/savingsGoalRoutes");
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const accountRoutes = require("./routes/accountRoutes");
const placesRoutes = require("./routes/placesRoutes");
const app = express();

app.use(cors()); // easiest fix for now
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/savings-goals", savingsGoalRoutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
