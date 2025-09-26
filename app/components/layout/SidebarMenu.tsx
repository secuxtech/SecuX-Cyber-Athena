"use client";
import { useState, useEffect } from "react";
import { getCurrentUserInfo } from "@/lib/utils/common";
import CreateWalletModal from "../modals/CreateWalletModal";
import CredentialModal from "../modals/CredentialModal";

export default function SidebarMenu() {
  const menuItems = [
    { label: "Asset", icon: "bi-bar-chart", active: true, href: "#" },
    { label: "About", icon: "bi-info-circle", active: false, newTab: true, href: "/#about" },
    { label: "Contact", icon: "bi-envelope", active: false, newTab: true, href: "https://secuxtech.com/pages/online-shop" },
    { label: "Blog", icon: "bi-pencil-square", active: false, newTab: true,
      href: "https://secuxtech.com/blogs/blog/technical-analysis-report-bybit-exchange-security-breach-principles-process-and-recommendations"},
    { label: "Wallet", icon: "bi-folder-plus", active: false, newTab: false, href: "/create-wallet" },
    { label: "FidoKey", icon: "bi-key", active: false, newTab: false, href: "#" },
    { label: "Logout", icon: "bi-box-arrow-right", active: false, href: "/" },
  ];

  const [accountId, setAccountId] = useState<string | null>(null);
  useEffect(() => {
    async function loadAccountId() {
      const userInfo = await getCurrentUserInfo();
      setAccountId(userInfo?.accountId || null);
    }
    loadAccountId();
  }, []);

  const handleLogout = async () => {
    // Import secure storage to clear tokens
    const { secureStorage } = await import("@/lib/utils/secure-storage");
    secureStorage.clearToken();
    window.location.href = "/";
  };

  return (
    <ul className="nav flex-column">
      {menuItems.map((item, index) => (
        <li key={index} className="nav-item m-2">
          {item.label === "Logout" ? (
            <button
              type="button"
              className={`nav-link ${item.active ? "text-black" : "text-secondary"} rounded btn btn-link w-100 text-start`}
              style={item.active ? { backgroundColor: "#CCCCCC" } : {}}
              onClick={handleLogout}
            >
              <i className={`bi ${item.icon} me-2`}></i>
              {item.label}
            </button>
          ) : item.label === "Wallet" ? (
            <>
              {accountId && (
                <CreateWalletModal
                  label={item.label}
                  icon={item.icon}
                />
              )}
            </>
          ) : item.label === "FidoKey" ? (
            <>
              {accountId && (
                <CredentialModal
                  label={item.label}
                  icon={item.icon}
                />
              )}
            </>
          ) : (
            <a
              href={item.href}
              className={`nav-link ${item.active ? "text-black" : "text-secondary"} rounded`}
              style={item.active ? { backgroundColor: "#CCCCCC" } : {}}
              target={item.newTab ? "_blank" : "_self"}
            >
              <i className={`bi ${item.icon} me-2`}></i>
              {item.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
