import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <header className="container d-flex flex-wrap justify-content-center py-3 mb-4 border-bottom">
      <Link href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto
        link-body-emphasis text-decoration-none">
        <Image
          src="/secux-banner.png"
          alt="SecuX"
          width={130}
          height={42}
          priority
        ></Image>
      </Link>

      <ul className="nav nav-pills px-3">
        <li className="nav-item"><a href="#" className="nav-link text-black">Home</a></li>
        <li className="nav-item"><a href="#about" className="nav-link text-black">About</a></li>
        <li className="nav-item">
          <a className="nav-link text-black" href="https://secuxtech.com/pages/online-shop" target="_blank">Contact</a>
        </li>
        <li className="nav-item">
          <a className="nav-link text-black"
            href="https://secuxtech.com/blogs/blog/technical-analysis-report-bybit-exchange-security-breach-principles-process-and-recommendations"
            target="_blank">Blog</a>
        </li>
      </ul>
    </header>
  );
}