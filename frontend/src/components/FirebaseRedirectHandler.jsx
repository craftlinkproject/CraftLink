import { useEffect } from "react";
import { auth, provider } from "@/utils/firebase";
import { getRedirectResult, signInWithRedirect } from "firebase/auth";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUserData } from "../redux/userSlice";
import { api } from "@services/api";

const FirebaseRedirectHandler = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (!result) return;
      const user = result.user;
      const endpoint = sessionStorage.getItem("googleAuthEndpoint") || "login";
      const role = sessionStorage.getItem("googleAuthRole");
      sessionStorage.removeItem("googleAuthEndpoint");
      sessionStorage.removeItem("googleAuthRole");
      const payload = { name: user.displayName, email: user.email };
      if (role) payload.role = role;
      try {
        const res = await api.post(`/api/auth/${endpoint}`, payload);
        if (res.data.token) sessionStorage.setItem("token", res.data.token);
        dispatch(setUserData(res.data));
        navigate("/profile");
      } catch (err) {
        console.error("Google auth error:", err);
      }
    }).catch((err) => {
      if (err.code === "auth/unauthorized-domain") {
        sessionStorage.setItem("googleAuthEndpoint", "");
        sessionStorage.setItem("googleAuthRole", "");
        signInWithRedirect(auth, provider);
      }
    });
  }, [dispatch, navigate]);

  return null;
};

export default FirebaseRedirectHandler;
