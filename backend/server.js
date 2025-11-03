require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(bodyParser.json());

mongoose.connect(
  `mongodb+srv://saiyeshwin:${process.env.ATLAS_PWD}@maincluster0.kvdmugi.mongodb.net/?appName=MainCluster0`
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// ✅ Schemas & Models
const sessionSchema = new mongoose.Schema({
  token: String,
  role: String, // "Admin" or "Home"
  createdAt: { type: Date, default: Date.now, expires: 3600 }, // 1-hour expiry
});

const transactionSchema = new mongoose.Schema({
  date: String,
  description: String,
  amount: Number,
  type: String, // "CR" or "DR"
  createdAt: { type: Date, default: Date.now },
});

const Session = mongoose.model("Session", sessionSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);

// ✅ Middleware: Validate Session Token
async function validateSession(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "No token provided" });

  const session = await Session.findOne({ token });
  if (!session) return res.status(403).json({ message: "Invalid session" });

  req.role = session.role;
  next();
}

// ✅ Login
app.post("/api/login", async (req, res) => {
  const { pin } = req.body;

  let role = "";
  if (pin === process.env.HOME_PIN) role = "Home";
  else if (pin === process.env.ADMIN_PIN) role = "Admin";
  else return res.status(401).json({ message: "Invalid PIN" });

  const token = uuidv4();
  await Session.create({ token, role });

  return res.json({ token, role });
});

// ✅ Logout
app.post("/api/logout", async (req, res) => {
  const { token } = req.body;
  await Session.deleteOne({ token });
  res.json({ message: "Logged out successfully" });
});

// ✅ Fetch All Transactions
app.get("/api/transactions", validateSession, async (req, res) => {
  const transactions = await Transaction.find().sort({ createdAt: -1 });
  res.json(transactions);
});

// ✅ Add Transaction
app.post("/api/transactions", validateSession, async (req, res) => {
  if (req.role !== "Admin") {
    return res.status(403).json({ message: "Only Admin can add transactions" });
  }

  const { date, description, amount, type } = req.body;

  const newTransaction = new Transaction({
    date,
    description,
    amount: parseFloat(amount),
    type,
  });
  await newTransaction.save();
  res.json({ message: "Transaction added successfully" });
});

// ✅ Delete Transaction
app.delete("/api/transactions/:id", validateSession, async (req, res) => {
  if (req.role !== "Admin") {
    return res
      .status(403)
      .json({ message: "Only Admin can delete transactions" });
  }

  const { id } = req.params;
  await Transaction.findByIdAndDelete(id);
  res.json({ message: "Transaction deleted successfully" });
});
// ✅ Update Transaction (Add this to server.js)
app.put("/api/transactions/:id", validateSession, async (req, res) => {
  if (req.role !== "Admin") {
    return res.status(403).json({ message: "Only Admin can edit transactions" });
  }

  const { id } = req.params;
  const { date, description, amount, type } = req.body;

  await Transaction.findByIdAndUpdate(id, {
    date,
    description,
    amount: parseFloat(amount),
    type,
  });
  
  res.json({ message: "Transaction updated successfully" });
});
// ✅ Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
