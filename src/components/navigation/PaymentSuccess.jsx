import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PaymentSuccessCard = () => {

  const handlePremium = () => {
    // const username = localStorage.getItem("username");
    // const githubUserName = localStorage.getItem("githubUsername");
    // const usaerId = localStorage.getItem("userId");
    // localStorage.setItem("status", "paid");
    // const status = localStorage.getItem("status");
    // navigate("/dashboard?username=" + username + "&userId=" + usaerId + "&githubUsername=" + githubUserName + "&status=" + status);
    navigate("/dashboard");
  }

  const navigate = useNavigate();
  return (
    <div className="max-w-sm mx-auto bg-white rounded-lg shadow-lg overflow-hidden mt-10">
      <div className="px-6 py-4">
        <h2 className="text-2xl font-semibold text-center text-green-600">
          Congratulations!
        </h2>
        <p className="mt-4 text-center text-gray-700">
          You're now a Premium Member! 🎉 Enjoy all the exclusive features.
        </p>
      </div>
      <div className="px-6 py-3 text-center">
        <button
          className="text-white bg-purple-600 hover:bg-purple-700 rounded-full py-2 px-4"
          onClick={() => {
            handlePremium()
          }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccessCard;
