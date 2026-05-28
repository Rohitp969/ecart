import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import userLogo from '../../assets/user_logo.jpg'
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input";
import { useSelector } from "react-redux";
import store from "@/redux/store";
import { setUser } from "@/redux/userSlice";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import axios from "axios";

const UserInfo = () => {
  const navigate = useNavigate();
  const [updateUser, setUpdateUser] = useState({})
  const [file, setFile] = useState(null)
  const {user} = useSelector(store=>store.user)
  const params = useParams()
  const dispatch = useDispatch()
  const userId = params.id
  
  const handleChange = (e) => {
    setUpdateUser({ ...updateUser, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setUpdateUser({
      ...updateUser,
      profilePic: URL.createObjectURL(selectedFile),
    });
  };

   const handleSubmit = async (e) => {
    e.preventDefault();

    const accessToken = localStorage.getItem("accessToken");

    try {
      const formData = new FormData();
      formData.append("firstName", updateUser.firstName);
      formData.append("lastName", updateUser.lastName);
      formData.append("email", updateUser.email);
      formData.append("phoneNo", updateUser.phoneNo);
      formData.append("address", updateUser.address);
      formData.append("city", updateUser.city);
      formData.append("zipCode", updateUser.zipCode);
      formData.append("role", updateUser.role);

      if (file) {
      formData.append("file", file);
    }

      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/user/update/${userId}`,
        formData,
        {
          headers: {
            authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (res.data.success) {
        toast.success(res.data.message);
        dispatch(setUser(res.data.user));
        // localStorage.setItem("user", JSON.stringify(res.data.user));
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to Update profile");
    }
  };

  // useEffect(()=>{
  //   getUserDetails()
  // }, [])

  const getUserDetails = async ()=>{
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/get-user/${userId}`)
       if (res.data.success) {
        setUpdateUser(res.data.user);
       }
    } catch (error) {
      console.log(error);
    }
  }

    useEffect(()=>{
    getUserDetails()
  }, [])

  return (
    <div className="pt-5 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
          <div className="flex justify-between gap-10">
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft />
            </Button>
            <h1 className="font-bold mb-7 text-2xl text-gray-800">
              Update Profile
            </h1>
          </div>

          <div className="w-full max-w-3xl flex gap-10 items-start px-7">
            <div className="flex flex-col items-center">
              <img
                src={updateUser?.profilePic || userLogo}
                alt="profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-pink-800"
              />

              <Label className="mt-4 cursor-pointer bg-pink-600 text-white px-4 py-2 rounded-2xl hover:bg-pink-700">
                Change Picture
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </Label>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 space-y-4 shadow-lg p-6 rounded-lg bg-white"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input
                    type="text"
                    name="firstName"
                    value={updateUser?.firstName || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  />
                </div>

                <div>
                  <Label>Last Name</Label>
                  <Input
                    type="text"
                    name="lastName"
                    value={updateUser?.lastName || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="text"
                  name="email"
                  value={updateUser?.email || ""}
                  readOnly
                  className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100"
                />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  type="text"
                  name="phoneNo"
                  value={updateUser?.phoneNo || ""}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>

              <div>
                <Label>Address</Label>
                <Input
                  type="text"
                  name="address"
                  value={updateUser?.address || ""}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    type="text"
                    name="city"
                    value={updateUser?.city || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  />
                </div>

                <div>
                  <Label>Zip Code</Label>
                  <Input
                    type="text"
                    name="zipCode"
                    value={updateUser?.zipCode || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <Label className="block text-sm font-medium">Role :</Label>
               <RadioGroup value={updateUser?.role || ""} onValueChange={(value)=>setUpdateUser({...updateUser, role:value})}
                className="flex items-center">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="user" />
                  <Label htmlFor="user">User</Label>
                </div>
                 <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin">Admin</Label>
                </div>
               </RadioGroup>
              </div>
              <Button
                type="submit"
                className="w-full mt-4 bg-pink-600 hover:bg-pink-700 text-white"
              >
                Update Profile
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
