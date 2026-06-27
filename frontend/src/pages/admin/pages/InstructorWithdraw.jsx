import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Nav from "../../../components/dashboard/components/Nav";
import SideBar from "../../../components/dashboard/components/SideBar";
import { useTheme } from "../../../context/ThemeContext";
import { toast } from "react-toastify";
import { api } from "@services/api";
import "./InstructorWithdraw.css";
import { SiMoneygram } from "react-icons/si";
import { BsClockHistory } from "react-icons/bs";
import { BsCurrencyPound } from "react-icons/bs";
import { MdCreditScore } from "react-icons/md";
import AuthInput from "../../../components/AuthInput";
import { useInputAnimation } from "../../../hooks/useInputAnimation";
import { MdCheckCircle, MdCancel } from "react-icons/md";
import { FaTimesCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { fetchEarnings } from "../../../redux/walletSlice";

const InstructorWithdraw = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { darkMode, setDarkMode } = useTheme();
  const [sidebarHide, setSidebarHide] = useState(false);
  const [searchShow, setSearchShow] = useState(false);
  const { i18n, t } = useTranslation();
  const { handleFocus, handleBlur } = useInputAnimation();
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [accountInfo, setAccountInfo] = useState({
    name: "",
    email: "",
    phone: "",
    vodafonePhone: "",
    address: "",
  });

  const { userData: currentUser } = useSelector((state) => state.user);
  const { earnings, withdrawals, status } = useSelector((state) => state.wallet);
  const isInstructor = currentUser?.role === 2;

  useEffect(() => {
    if (!isInstructor) {
      navigate("/profile");
      return;
    }

    if (status === "idle") {
      dispatch(fetchEarnings());
    }
  }, [isInstructor, status, dispatch]);

  const loadEarningsData = () => {
    dispatch(fetchEarnings());
  };

  const handleAccountInfoChange = (key, value) => {
    setAccountInfo((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmitRequest = async () => {
    if (!amount || Number(amount) <= 0) {
      return toast.error("Please enter the correct amount to withdraw");
    }

    if (Number(amount) > (earnings?.availableBalance || 0)) {
      return toast.error(
        `الرصيد المتاح: ${earnings?.availableBalance} EGP فقط`
      );
    }

    if (!accountInfo.name || !accountInfo.phone) {
      return toast.error("Please enter at least your name and phone number.");
    }

    try {
      setSubmitting(true);

      const res = await api.post(
        "/api/withdrawal/request",
        {
          amount: Number(amount),
          accountInfo,
          provider: "vodafone_cash",
        },
        { withCredentials: true }
      );

      if (res.data?.success) {
        toast.success("The withdrawal request was successfully submitted.");
        setAmount("");
        setAccountInfo({
          name: "",
          email: "",
          phone: "",
          bankName: "",
          accountNumber: "",
          iban: "",
          address: "",
        });
        loadEarningsData();
      }
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      const errorMsg = error.response?.data?.message || "Request failed to send.";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: "#f39c12",
      approved: "#3498db",
      completed: "#27ae60",
      rejected: "#e74c3c",
      failed: "#c0392b",
    };
    return colors[status] || "#95a5a6";
  };
  const getStatusIcon = (status) => {
    const icons = {
      pending: <BsClockHistory />,
      approved: <MdCheckCircle />,
      completed: <MdCheckCircle />,
      rejected: <MdCancel />,
      failed: <FaTimesCircle />,
    };

    return icons[status] || null;
  };
  const getChartData = () => {
    if (!withdrawals || withdrawals.length === 0) return [];
    const statusCount = {
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
      failed: 0,
    };

    withdrawals.forEach((w) => {
      if (statusCount.hasOwnProperty(w.status)) {
        statusCount[w.status]++;
      }
    });

    return [
      { name: "Pending", value: statusCount.pending, status: "pending" },
      { name: "Approved", value: statusCount.approved, status: "approved" },
      { name: "Completed", value: statusCount.completed, status: "completed" },
      { name: "Rejected", value: statusCount.rejected, status: "rejected" },
      { name: "Failed", value: statusCount.failed, status: "failed" },
    ].filter((item) => item.value > 0);
  };

  const getBalanceBreakdown = () => {
    if (!earnings) return [];
    return [
      {
        name: "Available",
        value: earnings?.availableBalance || 0,
      },
      {
        name: "Pending",
        value: earnings.pendingAmount || 0,
      },
      {
        name: "Approved",
        value: earnings.approvedAmount || 0,
      },
      {
        name: "Completed",
        value: earnings.totalWithdrawn || 0,
      },
    ];
  };

  const COLORS = ["#10b981", "#f59e0b", "#06b6d4"];

  const CustomBarChart = ({ data, height = 300 }) => {
    if (!data || data.length === 0) return null;
    const maxValue = Math.max(...data.map((d) => d.value || 0));
    const barWidth = 100 / data.length - 2;

    return (
      <div className="custom-bar-chart" style={{ height: `${height}px` }}>
        <div className="chart-bars">
          {data.map((item, index) => {
            const heightPercent = ((item.value || 0) / maxValue) * 100;
            return (
              <div
                key={index}
                className="bar-item"
                style={{ width: `${barWidth}%` }}
              >
                <div
                  className="bar"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: "#06b6d4",
                  }}
                  title={`${item.name}: ${item.value}`}
                />
                <div className="bar-label">{item.name}</div>
                <div className="bar-value">{item.value.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const CustomPieChart = ({ data, height = 300 }) => {
    if (!data || data.length === 0) return null;
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    let currentAngle = -90;

    const slices = data.map((item, index) => {
      const sliceAngle = (item.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      const color = getStatusBadgeColor(item.status);

      const start = polarToCartesian(150, 150, 100, endAngle);
      const end = polarToCartesian(150, 150, 100, startAngle);
      const largeArc = sliceAngle > 180 ? 1 : 0;
      const pathData = [
        `M 150 150`,
        `L ${start.x} ${start.y}`,
        `A 100 100 0 ${largeArc} 0 ${end.x} ${end.y}`,
        `Z`,
      ].join(" ");

      const labelAngle = startAngle + sliceAngle / 2;
      const labelPos = polarToCartesian(150, 150, 70, labelAngle);
      const percentage = ((item.value / total) * 100).toFixed(1);

      currentAngle = endAngle;
      return (
        <g key={index}>
          <path d={pathData} fill={color} stroke="white" strokeWidth="2" />
          <text
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fill="white"
            fontWeight="bold"
          >
            {percentage}%
          </text>
        </g>
      );
    });

    return (
      <div className="custom-pie-chart" style={{ height: `${height}px` }}>
        <svg width="100%" height="100%" viewBox="0 0 300 300">
          {slices}
        </svg>
        <div className="pie-legend">
          {data.map((item, index) => (
            <div key={index} className="legend-item">
              <span
                className="legend-color"
                style={{
                  backgroundColor: getStatusBadgeColor(item.status),
                }}
              />
              <span className="legend-text">
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };



  return (
    <div>
      <SideBar
        sidebarHide={sidebarHide}
        activeMenu={0}
        setActiveMenu={() => { }}
      />
      <section id="content">
        <Nav
          sidebarHide={sidebarHide}
          setSidebarHide={setSidebarHide}
          searchShow={searchShow}
          setSearchShow={setSearchShow}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        <main>
          <div className="instructor-withdraw">
            {/* Header */}
            {/* Earnings Summary */}
            {earnings && (
              <div className="earnings-summary">
                <div className="earnings-card total-earnings">
                  <div className="earnings-icon"><SiMoneygram /></div>
                  <div className="earnings-content">
                    <h3>{t("Total Revenue")}</h3>
                    <p className="earnings-amount">
                      {earnings.totalEarnings} {t("EGP")}
                    </p>
                  </div>
                </div>

                <div className="earnings-card available-balance">
                  <div className="earnings-icon"><BsCurrencyPound /></div>
                  <div className="earnings-content">
                    <h3>{t("Available Balance")}</h3>
                    <p className="earnings-amount">
                      {earnings?.availableBalance} {t("EGP")}
                    </p>
                  </div>
                </div>
                <div className="earnings-card approved-amount">
                  <div className="earnings-icon"><MdCreditScore /></div>
                  <div className="earnings-content">
                    <h3>{t("Completed")}</h3>
                    <p className="earnings-amount">
                      {earnings.totalWithdrawn || 0} {t("EGP")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Section */}
            {earnings && (
              <div className="charts-section">
                <div className="chart-container">
                  <h3>{t("Withdrawal log status")}</h3>
                  <CustomPieChart data={getChartData()} />
                </div>

                <div className="chart-container">
                  <h3>{t("Balance Distribution")}</h3>
                  <CustomBarChart data={getBalanceBreakdown()} />
                </div>
              </div>
            )}


            <div className="w-f-h">
              <div className="withdraw-form-section">
                <div className="form-container">
                  <h2>{t("Order Details")}</h2>

                  <div className="form-group">
                    <AuthInput
                      type="text"
                      label={t("Amount (EGP)")}
                      handleFocus={handleFocus}
                      handleBlur={handleBlur}
                      value={amount}
                      onChange={setAmount}
                    />
                    <small>
                      {t("Available Balance")}: {earnings?.availableBalance} {t("EGP")}
                    </small>
                  </div>


                  <div className="form-row">
                    <div className="form-group">

                      <AuthInput
                        type="text"
                        label={t("Full Name")}
                        handleFocus={handleFocus}
                        handleBlur={handleBlur}
                        value={accountInfo.name}
                        onChange={(value) => handleAccountInfoChange("name", value)}
                      />
                    </div>
                    <div className="form-group">

                      <AuthInput
                        type="tel"
                        label={t("Vodafone Cash number")}
                        handleFocus={handleFocus}
                        handleBlur={handleBlur}
                        value={accountInfo.phone}
                        onChange={(value) => handleAccountInfoChange("phone", value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">

                      <AuthInput
                        type="email"
                        label={t("E-mail")}
                        handleFocus={handleFocus}
                        handleBlur={handleBlur}
                        value={accountInfo.email}
                        onChange={(value) => handleAccountInfoChange("email", value)}
                      />
                    </div>
                    <div className="form-group">
                      <AuthInput
                        type="tel"
                        label={t("Wallet number")}
                        handleFocus={handleFocus}
                        handleBlur={handleBlur}
                        value={accountInfo.vodafonePhone}
                        onChange={(value) => handleAccountInfoChange("vodafonePhone", value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <AuthInput
                      textarea
                      type="tel"
                      label={t("Address")}
                      handleFocus={handleFocus}
                      handleBlur={handleBlur}
                      value={accountInfo.address}
                      onChange={(value) => handleAccountInfoChange("address", value)}
                    />
                  </div>

                  <button
                    className="btn-submit"
                    onClick={handleSubmitRequest}
                    disabled={submitting}
                  >
                    {submitting ? t("Sending...") : t("Submit the request")}
                  </button>
                </div>
              </div>
              <div className="withdrawals-history">
                <h2>{t("History")}</h2>
                {withdrawals.length === 0 ? (
                  <p className="empty-state">{t("No withdrawal requests yet.")}</p>
                ) : (
                  <div className="withdrawals-grid">
                    {withdrawals.map((w) => (
                      <div key={w._id} className="withdrawal-item">
                        <div className="withdrawal-status">
                          <span
                            className="status-badge"
                            style={{ backgroundColor: getStatusBadgeColor(w.status) }}
                          >
                            {getStatusIcon(w.status)}
                          </span>
                        </div>

                        <div className="withdrawal-details">
                          <div className="detail-row">
                            <span className="label">{t("Amount")}:</span>
                            <span className="value">{w.amount} {t("EGP")}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">{t("Order date")}:</span>
                            <span className="value">
                              {new Date(w.createdAt).toLocaleDateString("en-US")}
                            </span>
                          </div>
                          {w.approvalDate && (
                            <div className="detail-row">
                              <span className="label">{t("Date of approval")}:</span>
                              <span className="value">
                                {new Date(w.approvalDate).toLocaleDateString("en-US")}
                              </span>
                            </div>
                          )}
                          {w.reason && (
                            <div className="detail-row">
                              <span className="label">{t("Reason for rejection")}:</span>
                              <span className="value">{w.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </section>
    </div>
  );
};

export default InstructorWithdraw;
