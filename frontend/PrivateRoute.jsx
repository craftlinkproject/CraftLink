import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { logout } from "@redux/userSlice";
import LoadingFire from "@components/LoadingFire";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { userData, loading } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const handleLogout = (e) => {
      if (e.key === "logout") {
        dispatch(logout());
      }
    };
    const handleAuthLogout = () => {
      dispatch(logout());
    };
    window.addEventListener("storage", handleLogout);
    window.addEventListener("auth:logout", handleAuthLogout);
    return () => {
      window.removeEventListener("storage", handleLogout);
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, [dispatch]);

  if (loading) {
    return <LoadingFire />;
  }

  if (!userData) {
    const returnUrl = encodeURIComponent(location.pathname + location.search + location.hash);
    return <Navigate to={`/signin?returnUrl=${returnUrl}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
