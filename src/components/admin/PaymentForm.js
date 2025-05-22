"use client";

import React from "react";
import styles from "@/styles/paymentForm.module.css";
import CreditCardForm from "@/components/admin/CreditCardForm";

const PaymentForm = ({ selectedMethod, setSelectedMethod, setCardData }) => {
  const balance = 180; // Simulated
  const roomPrice = 245; // Simulated
  const isBalanceSufficient = balance >= roomPrice;

  return (
    <div className={styles.box}>
      <h3 className={styles.sectionTitle}>Your Payment Method</h3>

      <div className={styles.methods}>
        {/* 🕓 Pay Later */}
        <button
          className={`${styles.methodBtn} ${
            selectedMethod === "pay_later" ? styles.active : ""
          }`}
          onClick={() => setSelectedMethod("pay_later")}
        >
          <img src="/images/payments/pay-later.png" alt="Pay Later" />
          <span>Pay Later</span>
        </button>

        {/* 💳 Credit Card */}
        <button
          className={`${styles.methodBtn} ${
            selectedMethod === "credit_card" ? styles.active : ""
          }`}
          onClick={() => setSelectedMethod("credit_card")}
        >
          <img src="/images/payments/credit-cards.png" alt="Credit Card" />
          <span>Credit Card</span>
        </button>

        {/* 💼 Balance */}
        <button
          className={`${styles.methodBtn} ${
            selectedMethod === "balance" ? styles.active : ""
          } ${!isBalanceSufficient ? styles.disabledBtn : ""}`}
          onClick={() => {
            if (isBalanceSufficient) setSelectedMethod("balance");
          }}
          disabled={!isBalanceSufficient}
        >
          <img src="/images/payments/from-balance.png" alt="From Balance" />
          <span>From Balance</span>
        </button>

        {/* 🏦 Bank Transfer */}
        <button
          className={`${styles.methodBtn} ${
            selectedMethod === "bank_transfer" ? styles.active : ""
          }`}
          onClick={() => setSelectedMethod("bank_transfer")}
        >
          <img src="/images/payments/bank-transfer.png" alt="Bank Transfer" />
          <span>Bank Transfer</span>
        </button>
      </div>

      {/* 💳 Only show credit card form when selected */}
      {selectedMethod === "credit_card" && (
        <CreditCardForm onChange={setCardData} showControls={false} />
      )}

      {/* ✅ Info note for non-card options */}
      {["pay_later", "balance", "bank_transfer"].includes(selectedMethod) && (
        <div className={styles.confirmNote}>
          <p>
            ✅ You have selected{" "}
            <strong>{selectedMethod.replace("_", " ")}</strong>. Proceed to
            confirm booking.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentForm;