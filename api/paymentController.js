const Razorpay = require("razorpay");
const orderModel = require("../dbSchema/orderModel");
const shortid = require("shortid");
const hashGen = require("crypto-js").HmacSHA256;
const Base64 = require("crypto-js/enc-hex");
const base64Encode = require("crypto-js/enc-base64");
const fetch = require("node-fetch");
require("dotenv").config;

//====================  imprt END ==============

// Handler object to handle razorpay api ask

const handler = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

// function for create order api endpoint

const createOrder = (req, res) => {
  const amount = req.body.amount;
  const currency = "INR";
  // generate a orederID or a txn id for server refrence
  const ser_order_id = shortid.generate();

  // options to create razorpay order for payment
  const option = {
    amount: amount,
    currency: currency,
    receipt: ser_order_id, // must be uniqe for each transaction
  };

  // storing order details to mongo DB
  const newOrder = new orderModel({
    ...option,
    ser_order_id,
    payment_capture: true,
  });

  // save to DB
  newOrder
    .save()
    .then(() => {
      console.log("orderSaved");
    })
    .catch((err) => console.log(err));
  console.log(option);

  // createing order using razorpay sdk handler
  handler.orders.create(option, (err, order) => {
    if (err) console.log("err : ", err);
    else {
      // response from razorpay ( order )
      const raz_order_id = order.id; // razorpay order id
      const entity = order.entity; //
      const amount_paid = order.amount_paid; // total paid amount 0 initialy
      const status = order.status; // order status
      const notes = order.notes; // key value pairs
      const created_at = order.created_at;
      const amount_due = order.amount_due; // amount to be paid
      const options = {
        raz_order_id,
        entity,
        amount,
        amount_paid,
        status,
        created_at,
        ser_order_id,
        currency,
        amount_due,
      };

      // updatind DB record
      orderModel
        .findOneAndUpdate({ ser_order_id }, { ...options }, { new: true })
        .then((doc) => {
          console.log(doc);
          res.status(200).json(doc);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });
};

// function for call backURL and to transfer payment further

const verifyAndUpdateOrder = (req, res) => {
  console.log(req.body);

  // req parameters

  const raz_order_id = req.body.razorpay_order_id;
  const signature = req.body.razorpay_signature;
  const raz_payment_id = req.body.razorpay_payment_id;

  // verify signature

  const gen_signature = Base64.stringify(
    hashGen(raz_order_id + "|" + raz_payment_id, process.env.KEY_SECRET)
  );

  if (gen_signature === signature) {
    console.log("Payment Successful");
    // update Database
    orderModel.findOne({ raz_order_id }).then((doc) => {
      const merchantAmount = 0.02 * doc.amount;
      const vendorAmount = doc.amount - merchantAmount;
      const paid = doc.amount;

      // transfer amount to linkedAccount:

      fetch(
        `https://api.razorpay.com/v1/payments/${raz_payment_id}/transfers`,
        {
          method: "post",
          headers: {
            "Content-Type": "application/json",

            Authorization:
              "Basic cnpwX3Rlc3RfQTJPQ0FwMkFyVnVKa006ZHo0a2l6bG92aDFCVGcycUJLcHdGSTN0", // auth token  base64Encode('key_id:key_secret')
          },
          body: JSON.stringify({
            transfers: [
              {
                account: "acc_H3zzcxEZi2rEmA",
                amount: vendorAmount, // amount to be tranfered to vendor
                currency: "INR",
                notes: {
                  // optional prameters
                  name: "harish vendor",
                },
                on_hold: false, //  if false instent tranfer and if true the have to add time till hold
                // on_hold_till: 16655996
              },
            ],
          }),
        }
      )
        .then((response) => response.json())
        .then((data) => {
          console.log(data.items[0]);
          // update all entries to database
          /* if data.errors then handle err
            data.items contain array of tranfer data
          
          */
          orderModel
            .findByIdAndUpdate(
              doc._id,
              {
                signature,
                raz_payment_id,
                amount_due: 0,
                amount_paid: paid,
                merchantAmount,
                vendorAmount,
                transferedTo: { ...data.items[0] },
              },
              { new: true }
            )
            .then((data) => {
              console.log(data, "updated Record");
            })
            .catch((err) => console.log(err));
        })
        .catch((err) => {
          console.log(err);
        });
    });
  } else console.log("InvalidSignature", gen_signature);

  res.redirect(
    `https://harishjangid154.github.io/razorpay/?q=${raz_payment_id}`
  );
};

// function for refund endpoint

const processRefund = (req, res) => {
  // req prameter
  const raz_payment_id = req.body.payment_id;
  console.log(req.body);

  // retrive order from DB
  orderModel.findOne({ raz_payment_id }).then((doc) => {
    console.log(doc);
    const amount = doc.transferedTo.amount; // amount which is charged or transferd to vendor
    const transfer_id = doc.transferedTo.id;

    // this api expect transfer_id to initiate refund
    fetch(`https://api.razorpay.com/v1/transfers/${transfer_id}/reversals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic cnpwX3Rlc3RfQTJPQ0FwMkFyVnVKa006ZHo0a2l6bG92aDFCVGcycUJLcHdGSTN0",
      },
      body: JSON.stringify({
        amount,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        res.json({ id: data.id });
      });
  });
};
module.exports = {
  createOrder,
  verifyAndUpdateOrder,
  processRefund,
};
