import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const VerifyOtp = () => {

  const [otp, setOtp] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const submitHandler = async (e) => {
    e.preventDefault();

    try {

      const res = await axios.post(
        `http://localhost:8000/api/v1/user/verify-otp/${email}`,
        { otp }
      );

      if (res.data.success) {

        toast.success(res.data.message);

        navigate("/reset-password", {
          state: { email }
        });

      }

    } catch (error) {

      toast.error(
        error.response?.data?.message
      );

    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-pink-100">

      <form
        onSubmit={submitHandler}
        className="bg-white p-6 rounded-lg shadow-md w-[350px]"
      >

        <h1 className="text-2xl font-bold mb-4">
          Verify OTP
        </h1>

        <input
          type="text"
          placeholder="Enter OTP"
          className="w-full border p-2 rounded mb-4"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />

        <button className="w-full bg-pink-600 text-white p-2 rounded">
          Verify OTP
        </button>

      </form>

    </div>
  );
};

export default VerifyOtp;