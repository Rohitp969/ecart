import axios from "axios";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "../redux/userSlice";
import { setCart } from "../redux/productSlice";

// Logs out on the server (best effort) and always clears the local session.
// redirectTo: where to go afterwards; null = stay and let the route guard redirect
// (a protected page then sends the user to /login and back here after they sign in).
const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return async ({ redirectTo = "/" } = {}) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/user/logout`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } },
      );
    } catch (error) {
      // an expired/invalid token still means the user wants out
      console.log(error);
    }
    // Leave the page first (synchronously): router updates are transitions, so clearing the
    // user first would let a protected page's guard redirect to /login before we navigate.
    if (redirectTo) navigate(redirectTo, { replace: true, flushSync: true });
    localStorage.removeItem("accessToken");
    dispatch(setUser(null));
    dispatch(setCart({ items: [], totalPrice: 0 }));
    toast.success("Logged out successfully", { id: "session-expired" });
  };
};

export default useLogout;
