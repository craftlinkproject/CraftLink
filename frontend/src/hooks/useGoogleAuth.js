import { auth, provider } from "@/utils/firebase";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { useNavigate } from "react-router-dom";
import { api } from "@services/api";
import { useState, useEffect } from "react";

export const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (!result) return;
      setLoading(true);
      try {
        const user = result.user;
        const endpoint = sessionStorage.getItem("googleAuthEndpoint") || "login";
        const role = sessionStorage.getItem("googleAuthRole") || null;
        sessionStorage.removeItem("googleAuthEndpoint");
        sessionStorage.removeItem("googleAuthRole");
        const payload = { name: user.displayName, email: user.email };
        if (role) payload.role = role;
        const res = await api.post(`/api/auth/${endpoint}`, payload, { withCredentials: true });
        if (res.data.token) sessionStorage.setItem("token", res.data.token);
        dispatch(setUserData(res.data));
        toast.success(`${endpoint.includes("signup") ? "Google Sign-Up" : "Login"} successful`);
        navigate("/profile");
      } catch (error) {
        toast.error(error.response?.data?.message || error.message || "Google auth failed");
      } finally {
        setLoading(false);
      }
    }).catch(() => {});
  }, [dispatch, navigate]);

  const googleLoginOrSignUp = async (endpoint, role = null) => {
    sessionStorage.setItem("googleAuthEndpoint", endpoint);
    if (role) sessionStorage.setItem("googleAuthRole", role);
    await signInWithRedirect(auth, provider);
  };

  return { googleLoginOrSignUp, loading };
};

export default useGoogleAuth;
