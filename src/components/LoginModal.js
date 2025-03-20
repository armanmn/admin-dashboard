"use client";
import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useAuthStore } from "../stores/authStore"; // ✅ Կանչում ենք Zustand store-ը

const LoginModal = ({ show, onClose, onLogin }) => {
  const { login } = useAuthStore(); // ✅ Ստանում ենք Zustand-ի login ֆունկցիան
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
  
    try {
      const success = await login(email, password); // ✅ Օգտագործում ենք Zustand-ի login ֆունկցիան
      if (success) {
        console.log("Login successful");
  
        if (onLogin) {
          onLogin(); // ✅ Թարմացնում ենք Zustand-ի վիճակը (Navbar-ից փոխանցված ֆունկցիա)
        }
        onClose(); // ✅ Փակում ենք մոդալը
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (err) {
      console.error("Login failed:", err.message);
      setError("Invalid email or password");
    }
  };
  
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Login</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleLogin}>
          {error && <p className="text-danger">{error}</p>}
          <Form.Group controlId="formEmail">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
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
          <Button type="submit" className="btn btn-action mt-4 w-100">
            Login
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default LoginModal;