import React, { useRef, useState } from "react";
import axios from "axios";
import "./App.css";
import { backend_url } from "./config";

function loadRazorpay(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

function App() {
  const amountRef = useRef(0);
  const txnIdRef = useRef("");
  const [resData, setResData] = useState();
  const [loaded, setLoaded] = useState(false);
  const [refundData, setRefundData] = useState();
  const [showRefund, setShowRefund] = useState(false);
  const inputHandler = () => {
    axios({
      url: "https://a96877ba23ad.ngrok.io/payment/order",
      method: "POST",
      data: {
        amount: amountRef.current.value * 100,
      },
    })
      .then((res) => res.data)
      .then((data) => {
        setResData(data);
        setLoaded(true);
      });
  };

  const displayRazorpay = async () => {
    const res = await loadRazorpay(
      "https://checkout.razorpay.com/v1/checkout.js"
    );

    if (!res) {
      alert("Failed to load SDK");
      return;
    }

    const options = {
      key: "rzp_test_A2OCAp2ArVuJkM",
      amount: 455,
      currency: resData.currency,
      name: "Harish",
      description: "Test Transaction",
      image,
      order_id: resData.raz_order_id,
      callback_url: backend_url + "/payment/verify",
      prefill: {
        // current user info
        name: "Harish",
        email: "gaurav.kumar@example.com",
        contact: "9079440677",
      },
    };
    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  // refund handler

  const refundHandler = () => {
    axios({
      method: "POST",
      url: backend_url + "/payment/refund",
      data: {
        payment_id: txnIdRef.current.value,
        p: "harish",
      },
    })
      .then((res) => res.data)
      .then((data) => {
        setRefundData(data);
        setShowRefund(true);
      });
  };

  return (
    <div className="App">
      <h1>RazorPay Sample Daffodil</h1>
      <input
        type="number"
        placeholder="Amount"
        value={amountRef.current.value}
        ref={amountRef}
      />

      <button onClick={inputHandler}> create Order </button>
      {loaded && (
        <>
          <h1>
            Amount {resData.amount / 100} {resData.currency}
          </h1>
          <h1> Status {resData.status}</h1>
          <h1>RazorPay order Id {resData.raz_order_id}</h1>
          <button onClick={displayRazorpay}>
            Pay {resData.amount / 100} Rupee
          </button>
        </>
      )}
      <br />
      <br />
      <br />
      <br />
      <input type="text" ref={txnIdRef} />
      <button onClick={refundHandler}>REFUND</button>
      <br />
      <br />
      <br />
      <br />
      {showRefund && (
        <>
          <h1>Refund id : {refundData.id}</h1>
        </>
      )}
    </div>
  );
}

export default App;

const image =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/1200px-Image_created_with_a_mobile_phone.png";
