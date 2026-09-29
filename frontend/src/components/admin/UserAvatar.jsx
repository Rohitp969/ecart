import React from "react";
import { initials } from "@/lib/admin";

const UserAvatar = ({ user, size = "h-10 w-10 text-sm" }) =>
  user?.profilePic ? (
    <img src={user.profilePic} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 font-bold text-white`}>
      {initials(user)}
    </span>
  );

export default UserAvatar;
