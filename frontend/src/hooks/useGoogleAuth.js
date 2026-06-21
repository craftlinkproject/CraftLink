import { auth, provider } from "@/utils/firebase";
import { signInWithRedirect } from "firebase/auth";

export const useGoogleAuth = () => {
  const googleLoginOrSignUp = async (endpoint, role = null) => {
    sessionStorage.setItem("googleAuthEndpoint", endpoint);
    if (role) sessionStorage.setItem("googleAuthRole", role);
    await signInWithRedirect(auth, provider);
  };

  return { googleLoginOrSignUp };
};

export default useGoogleAuth;
