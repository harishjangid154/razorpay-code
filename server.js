require("dotenv").config()
const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const paymentRoutes = require('./routes/paymentRouts')

mongoose.connect(
  "mongodb+srv://harihs:root@cluster0.lr1oj.mongodb.net/razorpay?retryWrites=true&w=majority",
  { useUnifiedTopology: true, useNewUrlParser: true },
  () => {
    console.log("Connected to database");
  }
);

const app = express();

app.use(cors())
app.use(bodyParser())

const port = process.env.PORT || 5000;


app.get("/", (req,res) => {
  res.json("ok");
})

app.use("/payment", paymentRoutes);

app.listen(port, () => {
  console.log('server started on ',port)
})