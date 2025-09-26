"use client";

import Banner from "../common/Banner";
import SidebarMenu from "./SidebarMenu";

export default function Sidebar() {
  return (
    <div
      className="bg-white p-3"
      style={{ width: "14vw", height: "290vh", borderRight: "1px solid #e0e0e0" }}
    >
      <Banner />
      <hr />
      <SidebarMenu />
    </div>
  );
}
