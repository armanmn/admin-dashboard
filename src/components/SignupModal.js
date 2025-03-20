"use client";
import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useAuthStore } from "../stores/authStore"; // ✅ Ստանում ենք Zustand store-ը

const SignupModal = ({ show, onClose, isAdminView = false }) => {
  const { registerB2B, registerOfficeUser } = useAuthStore(); // ✅ Ավելացրել ենք `registerOfficeUser`
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRepassword] = useState("");
  const [role, setRole] = useState("b2b_hotel_partner"); // ✅ Default role
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== repassword) {
      setError("Passwords do not match");
      return;
    }

    let success = false;

    if (["b2b_hotel_partner", "b2b_sales_partner"].includes(role)) {
      success = await registerB2B(firstName, lastName, email, password, role);
    } else if (["finance_user", "office_user"].includes(role)) {
      success = await registerOfficeUser(
        firstName,
        lastName,
        email,
        password,
        role
      );
    }

    console.log("Registration Success:", success); // ✅ Debugging log
    

    if (success) {
      console.log("✅ Registration was successful. Closing modal...");
      setError(""); // ✅ Եթե գրանցումը հաջող է, մաքրում ենք սխալը
      alert("User registered successfully!"); // ✅ Ավելացնում ենք հաջող գրանցման հաղորդագրություն
      onClose(); // ✅ Փակում ենք մոդալը
    } else {
      console.log("❌ Registration failed.");
      setError("Registration failed");
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{isAdminView ? "Add User" : "Sign Up"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSignup}>
          {error && <p className="text-danger">{error}</p>}

          {/* ✅ First Name & Last Name */}
          <Form.Group controlId="formFirstName">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group controlId="formLastName" className="mt-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </Form.Group>

          {/* ✅ Email */}
          <Form.Group controlId="formEmail" className="mt-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          {/* ✅ Password & Confirm Password */}
          <Form.Group controlId="formPassword" className="mt-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group controlId="formRepassword" className="mt-3">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Re-enter password"
              value={repassword}
              onChange={(e) => setRepassword(e.target.value)}
              required
            />
          </Form.Group>

          {/* ✅ Role Selection (Ավելացվել է finance_user և office_user) */}
          {isAdminView && (
            <Form.Group controlId="formRole" className="mt-3">
              <Form.Label>Select Role</Form.Label>
              <Form.Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="b2b_hotel_partner">Hotel Partner</option>
                <option value="b2b_sales_partner">Sales Partner</option>
                <option value="finance_user">Finance User</option>
                <option value="office_user">Office User</option>
              </Form.Select>
            </Form.Group>
          )}

          <Button type="submit" className="btn btn-action mt-4 w-100">
            {isAdminView ? "Add User" : "Sign Up"}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default SignupModal;
