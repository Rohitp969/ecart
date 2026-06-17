import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import UserLogo from "../../assets/user_logo.jpg";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const getAllUsers = async () => {
    const accessToken = localStorage.getItem("accessToken");
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/user/all-user`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    getAllUsers();
  }, []);

  console.log(users);

  return (
    <div className="w-full p-4 md:p-6 lg:p-16">
      <h1 className="font-bold text-2xl">User Management</h1>
      <p>View and manage registered users</p>
      <div className="relative w-full max-w-md mt-6">
        <Search className="absolute left-2 top-1 text-gray-600 w-5" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          placeholder="Search Users..."
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-7">
        {filteredUsers.map((user, index) => {
          return (
            <div key={index} className="bg-pink-100 p-5 rounded-lg">
              <div className="flex items-center gap-2">
                <img
                  src={user?.profilePic || UserLogo}
                  alt=""
                  className="rounded-full w-16 aspect-square object-cover border border-pink-600"
                />
                <div className="flex-1 min-w-0">
                  <h1 className="font-semibold">
                    {user?.firstName} {user?.lastName}
                  </h1>

                  <h3 className="text-sm text-gray-600 break-all">
                    {user?.email}
                  </h3>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                <Button
                className = "cursor-pointer"
                  onClick={() => navigate(`/dashboard/users/${user?._id}`)}
                  variant="outline"
                >
                  <Edit />
                  Edit
                </Button>
                <Button
                className = "cursor-pointer"
                  onClick={() =>
                    navigate(`/dashboard/users/orders/${user?._id}`)
                  }
                >
                  <Eye />
                  Show Order
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminUsers;
