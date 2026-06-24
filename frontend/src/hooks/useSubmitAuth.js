import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { useNavigate } from "react-router-dom";
import { api } from "@services/api";

export const useSubmitAuth = (setLoading) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submitAuth = async (endpoint, payload) => {
    setLoading(true);

    try {
      const res = await api.post(
        `/api/auth/${endpoint}`,
        payload,
        { withCredentials: true }
      );

      const user = res.data.user || res.data;
      if (res.data.token) sessionStorage.setItem("token", res.data.token);

      dispatch(setUserData(user));

      console.log("✅ SAVED USER:", user);

      toast.success(
        `${endpoint.includes("signup") ? "Signup" : "Login"} successful`
      );

      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get("returnUrl");
      navigate(returnUrl || "/profile");
    } catch (err) {
      console.log("Auth error:", err.response || err.message);

      toast.error(
        err.response?.data?.message || "Auth failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return { submitAuth };
};