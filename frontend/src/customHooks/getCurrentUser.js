import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { logout, setUserData } from "../redux/userSlice";
import { api } from "@services/api";

const useCurrentUser = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const tokenExists = document.cookie.includes("token=") || sessionStorage.getItem("token");
    if (!tokenExists) {
      setLoading(false);
      return;
    }
    const fetchUser = async () => {
      try {
        const res = await api.get(`/api/user/getcurrentuser`, {
          withCredentials: true,
          timeout: 5000,
          validateStatus: (status) => status < 500,
        });
        if (res.status === 200 && res.data) {
          dispatch(setUserData(res.data));
        }
        else if (res.status === 401) {
          console.warn("Unauthorized:", res.data?.message || "No valid session");
          dispatch(logout());
        }
        else {
          console.warn("Unexpected response:", res);
          dispatch(logout());
        }
      } catch (err) {
        console.error("Failed to fetch user:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [dispatch]);
  return loading;
};
export default useCurrentUser;
