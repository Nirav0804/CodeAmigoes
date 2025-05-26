import React, { useState } from "react";
import { useActionData, useNavigate } from "react-router-dom";
import axios from "axios";
import PaymentSuccessCard from "./PaymentSuccess";
import { useAuth } from "../../context/AuthContext";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const { username, userId, status } = useAuth();
  // const username = localStorage.getItem("username");
  // const githubUserName = localStorage.getItem("githubUsername");
  // const userId = localStorage.getItem("userId");
  // const status = localStorage.getItem("status");
  const [showPaymentSuccessCard, setShowPaymentSuccessCard] = useState(false);

  // Create order for payment
  const paymentOrder = async () => {
    const amount = 479;
    const API_URL = `${API_BASE}/api/users/create_order`;

    try {
      const response = await axios.post(
        API_URL,
        { amount, username, userId, info: "order_request" },
        {
          withCredentials: true, // <-- Ensures JWT cookie is sent!
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "created") {
        const options = {
          key: "rzp_test_LADJfV2vRiNrkZ",
          amount: response.data.amount,
          currency: "INR",
          name: "Payment Demo",
          description: "Demo Payment",
          order_id: response.data.id,
          handler: function (rzpResponse) {
            updatePaymentOnServer(
              rzpResponse.razorpay_payment_id,
              rzpResponse.razorpay_order_id,
              username,
              "paid"
            );
            setShowPaymentSuccessCard(true);
            localStorage.setItem("paymentJustMade", Date.now());
            window.dispatchEvent(new CustomEvent("paymentSuccess"));
          },
          prefill: { name: "", email: "", contact: "" },
          notes: { address: "Demo Razorpay Payment" },
          theme: { color: "#3399cc" },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => alert("Oops!! Payment Failed"));
        rzp.open();
      }
    } catch (error) {
      alert("Something went wrong !!");
    }
  };

  // Update payment status on server
  const updatePaymentOnServer = async (payment_id, order_id, username, status) => {
    const API_URL = `${API_BASE}/api/users/update_order`;
    try {
      const response = await axios.post(
        API_URL,
        { payment_id, order_id, username, userId, status },
        {
          withCredentials: true, // <-- Ensures JWT cookie is sent!
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setShowPaymentSuccessCard(true);
      localStorage.setItem("paymentJustMade", Date.now());
      // localStorage.setItem("status", response.data.status || "paid");
      window.localStorage.setItem("paymentJustMade", Date.now());
      window.dispatchEvent(new CustomEvent("paymentSuccess"));
    } catch (error) {
      alert("Failed! Payment was successful but not updated on server.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10 flex justify-center items-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-400">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Free Plan</h2>
          <ul className="mb-6 space-y-2 text-gray-700">
            <li>✅ Limited Chat Access</li>
            <li>✅ Hackathon Viewing</li>
            <li>🚫 No Team Matching</li>
            <li>🚫 No Premium Chat</li>
          </ul>
          <button
            onClick={() =>
              // navigate(
              //   `/dashboard?username=${username}&userId=${userId}&githubUsername=${githubUserName}&status=${status}`
              // )
              navigate("/dashboard")
            }
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg w-full"
          >
            Free
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-500">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">Premium Plan - ₹479</h2>
          <ul className="mb-6 space-y-2 text-gray-700">
            <li>✅ Full Chat Access</li>
            <li>✅ Hackathon Participation</li>
            <li>✅ AI-Based Team Matching</li>
            <li>✅ Premium Support</li>
          </ul>
          <button
            onClick={paymentOrder}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg w-full"
          >
            Buy Now
          </button>
        </div>
      </div>
      {showPaymentSuccessCard && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border-4 border-purple-500 max-w-md w-full text-center animate-fade-in-up">
            <PaymentSuccessCard />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
