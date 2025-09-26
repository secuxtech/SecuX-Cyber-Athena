"use client";

import Link from "next/link";

interface HeaderProps {
  userInfo: string;
  usdValue: number;
}

export default function Header({ userInfo, usdValue }: HeaderProps) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center p-3 bg-white shadow-sm rounded"
      style={{ border: "1px solid #cccccc" }}>
      <h3 className="mb-0" style={{ fontWeight: "500" }}>
        <i className="bi bi-shield-shaded"></i> <Link className="text-reset text-decoration-none" href="/">Cyber Athena</Link>&nbsp;
        <br/><span className="font-monospace fs-6">(Total Value ≈ {usdValue.toFixed(2)} USD)</span>
      </h3>

      <div className="d-flex align-items-center text-secondary mt-2">
        <i className="bi bi-person-circle me-2" style={{ fontSize: "22px" }}></i>
        <span className="font-monospace text-truncate" style={{ fontSize: "18px", fontWeight: "100", maxWidth: "150px" }}>
          {userInfo}
        </span>
      </div>
    </div>
  );
}
