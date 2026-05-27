import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const ForgotPassword = () => {

  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();

    try {

      const res = await axios.post(
        "http://localhost:8000/api/v1/user/forgot-password",
        { email }
      );

      if (res.data.success) {
        toast.success(res.data.message);

        navigate("/verify-otp", {
        state: { email }
   });
      }

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
        "Something went wrong"
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
          Forgot Password
        </h1>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border p-2 rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-pink-600 text-white p-2 rounded"
        >
          Send OTP
        </button>

      </form>

    </div>
  );
};

export default ForgotPassword;