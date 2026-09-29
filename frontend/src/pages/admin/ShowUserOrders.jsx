import React from "react";
import { Navigate, useParams } from "react-router-dom";

// A user's orders now live on their user page
const ShowUserOrders = () => {
  const { userId } = useParams();
  return <Navigate to={`/dashboard/users/${userId}`} replace />;
};

export default ShowUserOrders;
