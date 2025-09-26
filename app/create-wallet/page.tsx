"use client";

import CreateWallet from "../components/feature/wallet/CreateWallet";

export default function Page() {
  return (
    <div className="container d-flex align-items-center justify-content-center font-monospace"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div className="bg-white shadow-sm rounded p-4 text-center" style={{ minWidth: 400, maxWidth: 540 }}>
        <h3 className="mb-4">Create First MultiSig Wallet</h3>
        <CreateWallet isNewUser={true} />
      </div>
    </div>
  );
}
