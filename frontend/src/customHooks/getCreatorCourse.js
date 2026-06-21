import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { api } from "@services/api";
// ===================== Custom Hook: Fetch Current User ===================== //
/**
 * useCurrentUser - Fetches the current authenticated user from the backend
 * and syncs it with Redux on mount. Returns loading and error state.
 * 
 * @returns {Object} { loading, errorMessage }
 */
const useCurrentUser = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
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
          validateStatus: (status) => status < 500,
        });
        if (res.status === 200 && res.data) {
          dispatch(setUserData(res.data));
          setErrorMessage(null);
        }
        else if (res.status === 401) {
          console.warn("Unauthorized:", res.data?.message || "No valid session");
          setErrorMessage(res.data?.message || "No valid session");
        }
        else {
          console.warn("Unexpected response:", res);
          setErrorMessage("Something went wrong");
        }
      } catch (err) {
        console.error("Failed to fetch user:", err.message);
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [dispatch]);
  return { loading, errorMessage };
};

export default useCurrentUser;
