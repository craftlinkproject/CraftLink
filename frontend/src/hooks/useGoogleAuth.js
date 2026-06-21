import { auth, provider } from "@/utils/firebase";
import { signInWithPopup } from "firebase/auth";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { useNavigate } from "react-router-dom";
import { api } from "@services/api";
import { useState } from "react";

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const googleLoginOrSignUp = async (endpoint, role = null) => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const payload = { name: user.displayName, email: user.email };
      if (role) payload.role = role;
      const res = await api.post(`/api/auth/${endpoint}`, payload);
      if (res.data.token) sessionStorage.setItem("token", res.data.token);
      dispatch(setUserData(res.data));
      toast.success(`${endpoint.includes("signup") ? "Google Sign-Up" : "Login"} successful`);
      navigate("/profile");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Google auth failed");
    } finally {
      setLoading(false);
    }
  };

  return { googleLoginOrSignUp, loading };
};

export default useGoogleAuth;
