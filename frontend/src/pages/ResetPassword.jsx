import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitHandler = async (e) => {

    e.preventDefault();

    try {

      const res = await axios.post(
        `http://localhost:8000/api/v1/user/change-password/${email}`,
        formData
      );

      if (res.data.success) {

        toast.success(res.data.message);

        navigate("/login");

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
          Reset Password
        </h1>

        {/* New Password */}

        <div className="relative mb-4">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />

          {showPassword ? (
            <EyeOff
              onClick={() => setShowPassword(false)}
              className="absolute right-3 top-3 cursor-pointer w-5 h-5"
            />
          ) : (
            <Eye
              onClick={() => setShowPassword(true)}
              className="absolute right-3 top-3 cursor-pointer w-5 h-5"
            />
          )}

        </div>

        {/* Confirm Password */}

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
          required
        />

        <button
          type="submit"
          className="w-full bg-pink-600 text-white p-2 rounded"
        >
          Update Password
        </button>

      </form>

    </div>
  );
};

export default ResetPassword;