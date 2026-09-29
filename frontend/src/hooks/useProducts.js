import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setProducts } from "../redux/productSlice";

const FRESH_FOR_MS = 60 * 1000;
let lastFetchedAt = 0;

const isFresh = (products) => products.length > 0 && Date.now() - lastFetchedAt < FRESH_FOR_MS;

// Full catalog from the API, kept in redux. Cached products render immediately and are
// refreshed in the background, at most once a minute across pages.
const useProducts = () => {
  const { products } = useSelector((store) => store.product);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(() => !isFresh(products));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading) return;
    let ignore = false;
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/v1/product/getallproducts`)
      .then((res) => {
        if (ignore || !res.data.success) return;
        lastFetchedAt = Date.now();
        dispatch(setProducts(res.data.products));
      })
      .catch((err) => {
        if (!ignore) setError(err.response?.data?.message || "Could not load products. Please check that the backend is running.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [loading, dispatch]);

  return { products, loading: loading && products.length === 0, error };
};

export default useProducts;
