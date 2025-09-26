"use client";

import { Suspense } from "react";
import Dashboard from "../components/feature/dashboard/Dashboard";

export default function Page() {
  return (
    <Suspense fallback={ <div className="container d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <div className="spinner-border text-dark" style={{width: "3rem", height: "3rem"}} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div> }>
      <Dashboard />
    </Suspense>
  );
}
