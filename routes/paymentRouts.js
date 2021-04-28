const {
  createOrder,
  verifyAndUpdateOrder,
  processRefund,
} = require("../api/paymentController");

const router = require("express").Router();

router.post("/order", createOrder);
router.post("/verify", verifyAndUpdateOrder);
router.post("/refund", processRefund);

module.exports = router;
