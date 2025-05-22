"use client";
import React, { useState, useEffect } from "react";
import styles from "@/styles/bookingConfirmationForm.module.css";
import CountrySelect from "@/components/admin/CountrySelect";
import PaymentForm from "@/components/admin/PaymentForm";

const BookingConfirmationForm = ({
  hotel,
  room,
  hotelId,
  roomId,
  onSubmit,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [receiveOffers, setReceiveOffers] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const [selectedMethod, setSelectedMethod] = useState("pay_later");
  const [cardData, setCardData] = useState(null);

  const handleCardChange = (formData) => {
    console.log("📦 CARD DATA RECEIVED:", formData);
    setCardData(formData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Booking submitted:", {
      paymentMethod: selectedMethod,
      card: cardData,
    });

    if (!agreeToTerms) {
      alert("You must agree to the terms before booking.");
      return;
    }

    if (selectedMethod === "credit_card") {
      if (!cardData || Object.values(cardData).some((v) => !v)) {
        alert("Please complete your credit card details.");
        return;
      }
    }

    // ✅ Սիմուլյացիոն օրեր (կամ իրական ընտրած օրերը)
    const checkInDate = "2025-04-22";
    const checkOutDate = "2025-04-25";

    // ✅ Հաշվել գիշերների քանակ
    const getNights = (start, end) => {
      const diffTime = Math.abs(new Date(end) - new Date(start));
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    const nights = getNights(checkInDate, checkOutDate);

    // ✅ Հաշվել ընդհանուր գինը
    const roomPrice = room?.computedPrice || room?.price || 0;
    const totalPrice = nights * roomPrice;

    // ✅ Վերջնական formData
    const formData = {
      hotel: hotel._id, // ✅ ուղիղ ObjectId
      room: room._id,   // ✅ ուղիղ ObjectId
      checkInDate,
      checkOutDate,
      nights,
      totalPrice,
      paymentMethod: selectedMethod,
      guest: {
        firstName,
        lastName,
        email,
        phone: `${selectedCountry?.code || ""} ${phone}`,
        address,
        country: selectedCountry?.value || "",
        countryCode: selectedCountry?.code || "",
        receiveOffers,
      },
    };
    console.log("📤 Final Booking Payload:", formData);
    onSubmit(formData);
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.left} ${styles.infoBox}`}>
        <h3>Your Personal Information</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.fullWidth}>
            <label>Address Line</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <CountrySelect
            value={selectedCountry}
            onChange={(selected) => setSelectedCountry(selected)}
          />

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={receiveOffers}
              onChange={(e) => setReceiveOffers(e.target.checked)}
            />
            I want to receive <strong>inLobby.com</strong> promotional offers in
            the future.
          </label>

          <PaymentForm
            selectedMethod={selectedMethod}
            setSelectedMethod={setSelectedMethod}
            setCardData={handleCardChange}
          />

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              required
            />
            By continuing, you agree to the <a href="#">Terms and Conditions</a>
            .
          </label>
          <button type="submit" className={styles.submitBtn}>
            Confirm Booking
          </button>
        </form>
      </div>

      <div className={styles.right}>
        <h3>Booking Details</h3>
        <img
          src={hotel.images?.[0] || "/placeholder.jpg"}
          alt={hotel.name}
          className={styles.image}
        />
        <p>
          <strong>{hotel.name}</strong>
        </p>
        <p>
          {hotel.location?.country}, {hotel.location?.city}
        </p>
        <p>
          ★ {hotel.rating || 0}/5 Average ({hotel.reviewsCount || 0} Reviews)
        </p>
        <hr />
        <p>
          <strong>Check in:</strong> Select on next step
        </p>
        <p>
          <strong>Check out:</strong> Select on next step
        </p>
        <p>
          <strong>Room Type:</strong> {room.type || "Unnamed Room"}
        </p>
        <p>
          <strong>Room:</strong> 1 Room
        </p>
        <p>
          <strong>Per Room Price:</strong> {room.computedPrice || room.price}{" "}
          AMD
        </p>
        <p>
          <strong>Adults:</strong> Choose during booking
        </p>
        <p>
          <strong>Stay:</strong> Calculated on selection
        </p>
        <hr />
        <p>
          <strong>Total Price:</strong> {room.computedPrice || room.price} AMD
        </p>
      </div>
    </div>
  );
};

export default BookingConfirmationForm;
