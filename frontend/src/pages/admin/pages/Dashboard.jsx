import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { api } from "@services/api";
import { toast } from "react-toastify";
import Nav from "../../../components/dashboard/components/Nav";
import SideBar from "../../../components/dashboard/components/SideBar";
import { useTheme } from "../../../context/ThemeContext";
import userAvatar from "../../../assets/img/userAvatar.jpg";
import { HiVideoCamera } from "react-icons/hi2";
import { FaUsers } from "react-icons/fa";
import { AiFillCloseCircle } from "react-icons/ai";
import { useTranslation } from "react-i18next";
const Dashboard = () => {
    const navigate = useNavigate();
    const { darkMode, setDarkMode } = useTheme();
    const [sidebarHide, setSidebarHide] = useState(false);
    const [searchShow, setSearchShow] = useState(false);
    const { i18n, t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [showWithdrawal, setShowWithdrawal] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    const [users, setUsers] = useState([]);
    const [usersTotal, setUsersTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all"); // stats, withdrawals, users

    const { userData: currentUser } = useSelector((state) => state.user);

    useEffect(() => {
        loadDashboardData();
    }, [currentUser]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            // Load stats
            const statsRes = await api.get("/api/withdrawal/admin/dashboard-stats", {
                withCredentials: true,
            });
            if (statsRes.data?.success) {
                setStats(statsRes.data);
            }

            // Load withdrawals
            const withdrawalsRes = await api.get(
                "/api/withdrawal/admin/withdrawals",
                {
                    withCredentials: true,
                },
            );
            if (withdrawalsRes.data?.success) {
                setWithdrawals(withdrawalsRes.data.withdrawals);
            }

            // Load users
            const usersRes = await api.get("/api/withdrawal/admin/users?limit=100", {
                withCredentials: true,
            });
            if (usersRes.data?.success) {
                setUsers(usersRes.data.users);
                setUsersTotal(usersRes.data.totalItems || 0);
            }
        } catch (error) {
            console.error("Error loading dashboard:", error);
            toast.error("فشل تحميل بيانات لوحة التحكم");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveWithdrawal = async (withdrawalId) => {
        try {
            const res = await api.post(
                `/api/withdrawal/admin/approve/${withdrawalId}`,
                { notes: "Approved by admin" },
                { withCredentials: true },
            );

            if (res.data?.success) {
                toast.success("approved withdrawal");
                loadDashboardData();
            }
        } catch (error) {
            console.error("Error approving withdrawal:", error);
            const msg = error.response?.data?.message || "failed to approve withdrawal";
            toast.error(msg);
        }
    };

    const handleRejectWithdrawal = async (withdrawalId) => {
        const reason = prompt("enter rejection reason:");

        if (!reason || !reason.trim()) {
            toast.error("rejection reason is required");
            return;
        }

        try {
            const res = await api.post(
                `/api/withdrawal/admin/reject/${withdrawalId}`,
                { reason: reason.trim() },
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            if (res.data?.success) {
                toast.success("successfully rejected withdrawal");
                loadDashboardData();
            }
        } catch (error) {
            console.error("Error rejecting withdrawal:", error);
            const msg = error.response?.data?.message || "failed to reject withdrawal";
            toast.error(msg);
        }
    };

    const handleCompleteWithdrawal = async (withdrawalId) => {
        const transactionId = prompt("enter transaction id:");

        try {
            const res = await api.post(
                `/api/withdrawal/admin/complete/${withdrawalId}`,
                { transactionId: transactionId || "" },
                { withCredentials: true },
            );

            if (res.data?.success) {
                toast.success("successfully completed withdrawal");
                loadDashboardData();
            }
        } catch (error) {
            console.error("Error completing withdrawal:", error);
            const msg = error.response?.data?.message || "failed to complete withdrawal";
            toast.error(msg);
        }
    };

    const getRoleName = (role) => {
        const roles = { 0: "Admin", 1: "Craftsman", 2: "Instructor", 3: "Client" };
        return roles[role] || "غير محدد";
    };


    const filteredWithdrawals = withdrawals.filter((w) => {
        if (activeTab === "all") return true;
        return w.status === activeTab;
    });
    return (
        <div>
            {showWithdrawal && selectedWithdrawal && (
                <div className="withdrawal-modal" onClick={() => setShowWithdrawal(false)}>
                    <div className="withdrawal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="header">

                            <h2>{t("Details")}</h2>


                            <AiFillCloseCircle className="close-btn"
                                onClick={() => {
                                    setShowWithdrawal(false);
                                    setSelectedWithdrawal(null);
                                }} />
                        </div>

                        <div className="withdrawal-details">
                            <div className="user-details">
                                <img
                                    src={selectedWithdrawal.instructor?.photoUrl || userAvatar}
                                    alt=""
                                    className="user-avatar"
                                />
                                <div className="user-info">

                                    <h3>{selectedWithdrawal.instructor?.name || "CraftLink User"}</h3>
                                    <span className="date">{new Date(selectedWithdrawal.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <p>
                                <strong>{t("Amount")}:</strong>
                                <span>
                                    {selectedWithdrawal.amount} {t("EGP")}
                                </span>
                            </p>
                            <p>
                                <strong>{t("Payment Method")}:</strong>
                                <span>
                                    {selectedWithdrawal.provider || "---"}
                                </span>
                            </p>
                            <p>
                                <strong>{t("Account Name")}:</strong>
                                <span>
                                    {selectedWithdrawal.accountInfo?.name || "Unknown"}
                                </span>
                            </p>
                            <p>
                                <strong>{t("Wallet Number")}:</strong>
                                <span>
                                    {selectedWithdrawal.accountInfo?.vodafonePhone || "Unknown"}
                                </span>
                            </p>
                            <p>

                                <strong>{t("Status")}:</strong>
                                <span>
                                    {selectedWithdrawal.status}
                                </span>
                            </p>
                            <p>
                                <strong>{t("Note")}:</strong>
                                <span>
                                    {selectedWithdrawal.notes || "Nothing"}
                                </span>
                            </p>
                        </div>

                        <div className="withdrawal-actions">
                            {selectedWithdrawal.status === "pending" && (
                                <>
                                    <button
                                        className="btn-approve"
                                        onClick={() => {
                                            handleApproveWithdrawal(selectedWithdrawal._id)
                                            setShowWithdrawal(false)
                                        }}
                                    >
                                        {t("Approve")}
                                    </button>

                                    <button
                                        className="btn-reject"
                                        onClick={() => {
                                            handleRejectWithdrawal(selectedWithdrawal._id)
                                            setShowWithdrawal(false)
                                        }}
                                    >
                                        {t("Reject")}
                                    </button>

                                </>
                            )}
                            {selectedWithdrawal.status === "approved" && (
                                <button
                                    className="btn-complete"
                                    onClick={() => {
                                        handleCompleteWithdrawal(selectedWithdrawal._id)
                                        setShowWithdrawal(false)
                                    }}
                                >
                                    {t("confirm")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
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

                <main className="main-dash">
                    <div className="order">
                        <div className="order-controls">
                            <div className="stats-num-dash">
                                {stats && (
                                    <div className="admin-stats">
                                        <div className="stats-grid">
                                            <div className="stat-card total">
                                                <div className="stat-icon">
                                                    <FaUsers />
                                                </div>
                                                <div className="stat-content">
                                                    <div>

                                                        <h3>{t("Users")}</h3>
                                                        <p className="stat-number">{stats.users.total}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="stat-card courses">
                                                <div className="stat-icon">
                                                    <HiVideoCamera />
                                                </div>
                                                <div className="stat-content">
                                                    <div>

                                                        <h3>{t("Courses")}</h3>
                                                        <p className="stat-number">{stats.courses.total}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="users-table">

                                <table>
                                    <thead>
                                        <tr>
                                            <th>{t("Name")}</th>
                                            <th>{t("Join")}</th>
                                            <th>{t("Date of joining")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user._id}>
                                                <td className="user-info">
                                                    <img src={user.photoUrl || userAvatar} alt="" />
                                                    {user.name}
                                                </td>
                                                <td>{getRoleName(user.role)}</td>
                                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="withdrawals-table">

                            <div class="finmate-card">
                                <div class="finmate-card-balance">
                                    <p class="finmate-card-label">{t("Available Balance")}</p>
                                    <p class="finmate-card-amount">{stats?.withdrawals?.totalAvailableBalance} {t("EGP")}</p>
                                </div>
                                <div class="finmate-card-summary">
                                    <div>
                                        <p class="finmate-card-label">{t("Income")}</p>
                                        <p class="finmate-card-green">+ {stats?.revenue?.total} {t("EGP")}</p>
                                    </div>
                                    <div>
                                        <p class="finmate-card-label">{t("Expenses")}</p>
                                        <p class="finmate-card-red">– {stats?.withdrawals?.totalWithdrawn} {t("EGP")}</p>
                                    </div>
                                </div>
                            </div>

                            <div>

                                <h3 className="title">{t("History")}</h3>
                                <div className="history-list">
                                    <div className="radio-inputs">
                                        <label className="radio">
                                            <input
                                                type="radio"
                                                name="radio"
                                                checked={activeTab === "all"}
                                                onChange={() => setActiveTab("all")}
                                            />
                                            <span className="name">{t("All")}</span>
                                        </label>

                                        <label className="radio">
                                            <input
                                                type="radio"
                                                name="radio"
                                                checked={activeTab === "pending"}
                                                onChange={() => setActiveTab("pending")}
                                            />
                                            <span className="name">{t("Request")}</span>
                                        </label>
                                        <label className="radio">
                                            <input
                                                type="radio"
                                                name="radio"
                                                checked={activeTab === "approved"}
                                                onChange={() => setActiveTab("approved")}
                                            />
                                            <span className="name">{t("Approved")}</span>
                                        </label>


                                    </div>

                                    {filteredWithdrawals.map((w) => (
                                        <div key={w._id}>
                                            <div className="history-w" onClick={() => {
                                                setSelectedWithdrawal(w);
                                                setShowWithdrawal(true);
                                            }}>
                                                <div className="history-user">
                                                    <div className="history-avatar">

                                                        <img src={w.instructor?.photoUrl || userAvatar} alt="" />
                                                        <div className={`history-status ${w.status}`}>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4>{w.instructor?.name || "CraftLink User"}</h4>
                                                        <span className="date">{new Date(w.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="history-amount">
                                                    <span>{w.amount}</span>
                                                    <span className="currency"> {t("EGP")}</span>
                                                </div>
                                            </div>
                                        </div>

                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </section>
        </div>
    );
};

export default Dashboard;
