import {
  FaInstagram,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import logo from "../assets/CraftLink.svg";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
const Footer = () => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate()
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col">
          <div className="footer-logo pointer" onClick={()=>navigate("/")}>
            <img src={logo} className="logo-CraftLink" alt="craftlink" />
            <h2>
              {t("craflink")}<span>.</span>
            </h2>
          </div>
          <p className="footer-desc">
            {t("A platform connecting skilled craftsmen with customers and learners. Discover, hire, and grow your skills with trusted professionals.")}
          </p>
          <div className="footer-social">
            <button className="Btn instagram">
              <FaInstagram className="svgIcon" />
              <span className="text">{t("Instagram")}</span>
            </button>
            <button className="Btn youtube">
              <FaYoutube className="svgIcon" />
              <span className="text">{t("YouTube")}</span>
            </button>
            <button className="Btn twitter">
              <FaTwitter className="svgIcon" />
              <span className="text">{t("Twitter")}</span>
            </button>
          </div>
        </div>
        <div className="footer-col">
          <h4>{t("Quick Links")}</h4>
          <ul>
            <li onClick={()=>navigate("/")}>{t("home")}</li>
            <li onClick={()=>navigate("/verify-certificate")}>{t("Verify Certificate")}</li>
            <li onClick={() => navigate("/search")}>{t("Courses")}</li>
            <li onClick={() => navigate("/search")}>{t("Craftsmen")}</li>
            <li onClick={() => navigate("/search")}>{t("Categories")}</li>
            <li onClick={()=>navigate("/about")}>{t("About Us")}</li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>{t("Popular Crafts")}</h4>
          <ul>
            <li onClick={() => navigate(`/search?q=${encodeURIComponent(t("Carpentry"))}`)}>{t("Carpentry")}</li>
            <li onClick={() => navigate(`/search?q=${encodeURIComponent(t("Plumbing"))}`)}>{t("Plumbing")}</li>
            <li onClick={() => navigate(`/search?q=${encodeURIComponent(t("Electricity"))}`)}>{t("Electricity")}</li>
            <li onClick={() => navigate(`/search?q=${encodeURIComponent(t("Painting"))}`)}>{t("Painting")}</li>
            <li onClick={() => navigate(`/search?q=${encodeURIComponent(t("Metal Works"))}`)}>{t("Metal Works")}</li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>{t("Support")}</h4>
          <ul>
            <li onClick={()=>navigate("/helpcenter")}>{t("Help Center")}</li>
            <li onClick={()=>navigate("/contactus")}>{t("Contact Us")}</li>
            <li onClick={()=>navigate("/privacy-policy")}>{t("Privacy Policy")}</li>
            <li onClick={()=>navigate("/terms")}>{t("Terms & Conditions")}</li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer-col footer-newsletter">
          <h4>{t("Subscribe")}</h4>
          <p>{t("Get updates about new craftsmen and courses.")}</p>
          <div className="newsletter-box">
            <input type="email" placeholder={t("Enter your email")} />
            <button>{t("Subscribe")}</button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} {t("craflink")}. {t("All rights reserved")}.</p>
      </div>
    </footer>
  );
};

export default Footer;
