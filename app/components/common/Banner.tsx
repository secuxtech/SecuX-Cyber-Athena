"use client";

import Image from "next/image";

export default function Banner() {
  return (
    <div className="d-flex justify-content-center align-items-center mb-2">
      <Image
        src="/secux-banner.png"
        alt="SecuX"
        width={130}
        height={42}
        className="img-fluid"
        priority
      />
    </div>
  );
}
