import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Header,
  AuthInput,
  AuthButton,
  SideImg,
} from "@components";

import bg from "../../../assets/img/BgSignIn.jpg";
import { api } from "@services/api";
import {
  MdEmail,
  FaEye,
  FaEyeLowVision,
} from "@icons";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setUserData } from "../../../redux/userSlice";
export default function AdminLogin() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const [showPass, setShowPass] = useState(false);

  const togglePass = () => {
    setShowPass((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      return toast.error("Please enter your username and password.");
    }

    try {
      setLoading(true);

      const res = await api.post(
        "/api/auth/admin-login",
        { username, password },
        { withCredentials: true }
      );

      const user = res.data?.user || res.data;
      const token = res.data?.token;

      if (token) {
        sessionStorage.setItem("token", token);
      }

      if (user) {
        dispatch(setUserData(user));

        toast.success("Successfully logged in");

        const params = new URLSearchParams(window.location.search);
        const returnUrl = params.get("returnUrl");
        navigate(returnUrl || "/dashboard");
      } else {
        toast.error(res.data?.message || "Failed to log in");
      }

    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message || "Failed to log in"
      );
    } finally {
      setLoading(false);
    }
  };

  const inputs = useMemo(
    () => [
      {
        label: "Email",
        value: username,
        onChange: setUsername,
        type: "text",
        Icon: MdEmail,
        className: "w-100",
      },
      {
        label: "Password",
        value: password,
        onChange: setPassword,
        type: showPass ? "text" : "password",
        Icon: showPass ? FaEye : FaEyeLowVision,
        onIconClick: togglePass,
        className: "w-100",
      },
    ],
    [username, password, showPass]
  );

  return (
    <>
      <div className="background" />

      <Header />

      <main>
        <section className="section-main">
          <div className="container">

            <div className="left section-layout">
              <div className="form-wrapper">

                <div className="section-main-heading">
                  <h2>
                    {t("Admin Login")}<span>{t(",")}</span>
                  </h2>

                  <p className="text">
                    {t("Securely manage users, reports, and platform operations from one place.")}
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="section-main-form"
                >
                  {inputs.map((input, idx) => (
                    <AuthInput
                      key={idx}
                      label={t(input.label)}
                      value={input.value}
                      onChange={input.onChange}
                      type={input.type}
                      Icon={input.Icon}
                      onIconClick={input.onIconClick}
                      className={input.className}
                    />
                  ))}

                  <AuthButton
                    type="submit"
                    loading={loading}
                    disabled={loading}
                  >
                    {t("Sign In")}
                  </AuthButton>
                </form>

              </div>
            </div>
            <SideImg src={bg} />
          </div>
        </section>
      </main>
    </>
  );
}