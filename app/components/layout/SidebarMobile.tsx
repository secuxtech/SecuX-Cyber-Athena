"use client";

import Banner from "../common/Banner";
import SidebarMenu from "./SidebarMenu";

export default function SidebarMobile() {
  return (
    <>
      <button className="btn btn-primary btn-sm d-block d-md-none position-fixed rounded-circle"
        style={{ top: "20px", right: "20px", zIndex: 1000 }}
        type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileSidebar" aria-controls="mobileSidebar">
        ☰
      </button>
      <div className="offcanvas offcanvas-start" tabIndex={-1} id="mobileSidebar" aria-labelledby="mobileSidebarLabel">
        <div className="offcanvas-header">
          <Banner />
          <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <SidebarMenu />
        </div>
      </div>
    </>
  );
}
