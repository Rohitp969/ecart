import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    console.log(formData);
    try {
      setLoading(true)
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/register`, formData, {
        headers:{
          "Content-Type":"application/json"
        }
      })
      if(res.data.success){
        navigate('/login')
        toast.success(res.data.message)
      }
     }catch (error) {
     console.log(error);
  
     if (error.response) {
     toast.error(error.response.data.message);
    } else {
    toast.error("Backend server not running or not reachable");
     }
  }finally{
    setLoading(false)
  }
}

  return (
    <div className="flex justify-center items-center min-h-screen bg-pink-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Enter your given details below to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={submitHandler}>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>

                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    required
                    value={formData.password}
                    onChange={handleChange} />

                  {showPassword ? 
                    <EyeOff
                      onClick={() => setShowPassword(false)}
                      className="w-5 h-5 text-gray-700 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"/>: 
                    <Eye
                      onClick={() => setShowPassword(true)}
                      className="w-5 h-5 text-gray-700 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    />
                  }
                </div>
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button
            type="submit"
            onClick={submitHandler}
            className="w-full cursor-pointer bg-pink-600 hover:bg-pink-500" 
            disabled={loading}
          >
           {loading? <><Loader2 className="h-4 w-4 animate-apin mr-2"/>Please wait</>:'Signup'}
          </Button>

          <p className="text-gray-700 text-sm">
            Already have an account?{" "}
            <Link
              to={"/login"}
              className="hover:underline cursor-pointer text-pink-800"
            >
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
