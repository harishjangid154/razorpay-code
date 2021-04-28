const mongoose = require("mongoose");

const orderModel = new mongoose.Schema({
  ser_order_id: { type: String, required: true, unique: true },
  raz_order_id: { type: String, unique: true },
  raz_payment_id: { type: String, unique: true },
  entity: { type: String },
  amount: { type: Number, required: true },
  amount_paid: { type: Number },
  amount_due: { type: Number },
  currency: { type: String, required: true, default: "INR" },
  status: { type: String, default: "started" },
  created_at: { type: Date },
  transferedTo: { type: Object },
  merchantAmount: { type: Number },
  vendor: { type: Number },
  signature: { type: String },
});

module.exports = mongoose.model("orders", orderModel);
