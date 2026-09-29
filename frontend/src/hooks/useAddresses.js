import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setAddresses } from "../redux/userSlice";
import { API_URL, authConfig } from "../lib/admin";

const ADDRESSES_API = `${API_URL}/api/v1/user/addresses`;

// The signed-in user's saved addresses (stored on their account, kept in the redux user).
// Mutations resolve to the server response, or null after showing an error toast.
const useAddresses = () => {
  const dispatch = useDispatch();
  const cached = useSelector((store) => store.user.user?.addresses);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ignore = false;
    axios
      .get(ADDRESSES_API, authConfig())
      .then((res) => !ignore && dispatch(setAddresses(res.data.addresses)))
      .catch(() => {})
      .finally(() => !ignore && setLoaded(true));
    return () => {
      ignore = true;
    };
  }, [dispatch]);

  const request = async (method, path = "", data) => {
    try {
      const res = await axios({ method, url: `${ADDRESSES_API}${path}`, data, ...authConfig() });
      dispatch(setAddresses(res.data.addresses));
      toast.success(res.data.message);
      return res.data;
    } catch (error) {
      if (error.response?.status !== 401) toast.error(error.response?.data?.message || "Something went wrong");
      return null;
    }
  };

  return {
    addresses: cached || [],
    // show what we already have while refreshing; only block when there's nothing yet
    loading: !loaded && !cached,
    saveAddress: (address, id, extra = {}) => request(id ? "put" : "post", id ? `/${id}` : "", { ...address, ...extra }),
    removeAddress: (id) => request("delete", `/${id}`),
    makeDefault: (id) => request("put", `/${id}/default`),
  };
};

export default useAddresses;
