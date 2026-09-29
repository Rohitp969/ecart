import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { setCart } from "../redux/productSlice";

const useAddToCart = () => {
  const { user } = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [addingId, setAddingId] = useState(null);

  const addToCart = async (productId) => {
    if (!user) {
      toast.info("Please login to add items to your cart");
      // come back to this page after logging in
      navigate("/login", { state: { from: location.pathname + location.search } });
      return false;
    }
    try {
      setAddingId(productId);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/cart/add`,
        { productId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } },
      );
      if (res.data.success) {
        dispatch(setCart(res.data.cart));
        toast.success("Added to cart");
        return true;
      }
    } catch (error) {
      // 401 is handled globally (logs the user out with a message)
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || "Could not add to cart");
      }
    } finally {
      setAddingId(null);
    }
    return false;
  };

  return { addToCart, addingId };
};

export default useAddToCart;
