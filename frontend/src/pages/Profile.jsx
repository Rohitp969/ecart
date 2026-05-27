import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import axios from "axios";
import userLogo from '../assets/user_logo.jpg'
import { setUser } from "../redux/userSlice";
import MyOrder from "./MyOrder";

const Profile = () => {
  const { user } = useSelector((store) => store.user);
  const params = useParams();
  const userId = params.userId;

  const [updateUser, setUpdateUser] = useState({
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    address: user?.address,
    city: user?.city,
    phoneNo: user?.phoneNo,
    zipCode: user?.zipCode,
    profilePic: user?.profilePic,
    role: user?.role,
  });

  const [file, setFile] = useState(null);
  const dispatch = useDispatch();

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

      const res = await axios.put(`http://localhost:8000/api/v1/user/update/${userId}`,
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
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to Update profile");
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-100">
      <Tabs defaultValue="profile" className="max-w-7xl mx-auto items-center">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="flex flex-col items-center bg-gray-100">
            <h1 className="font-bold mb-7 text-2xl text-gray-800">
              Update Profile
            </h1>

            <div className="w-full max-w-3xl flex gap-10 items-start px-7">
              <div className="flex flex-col items-center">
                <img
                  src={updateUser.profilePic || userLogo}
                  alt="profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-pink-800"
                />

                <Label className="mt-4 cursor-pointer bg-pink-600 text-white px-4 py-2 rounded-2xl hover:bg-pink-700">
                  Change Picture
                  <Input
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
                      value={updateUser.firstName || ""}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 mt-1"
                    />
                  </div>

                  <div>
                    <Label>Last Name</Label>
                    <Input
                      type="text"
                      name="lastName"
                      value={updateUser.lastName || ""}
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
                    value={updateUser.email || ""}
                    readOnly
                    className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100"
                  />
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="text"
                    name="phoneNo"
                    value={updateUser.phoneNo || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                  />
                </div>

                <div>
                  <Label>Address</Label>
                  <Input
                    type="text"
                    name="address"
                    value={updateUser.address || ""}
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
                      value={updateUser.city || ""}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 mt-1"
                    />
                  </div>

                  <div>
                    <Label>Zip Code</Label>
                    <Input
                      type="text"
                      name="zipCode"
                      value={updateUser.zipCode || ""}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 mt-1"
                    />
                  </div>
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
        </TabsContent>

        <TabsContent value="orders">
         <MyOrder/>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
