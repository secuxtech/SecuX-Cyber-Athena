import Image from "next/image";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ScrollTop from "./components/common/ScrollTop";
import FidoHandler from "./components/feature/fido/FidoHandler";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content of the homepage */}
      <main className="container-fluid mx-auto flex-grow mt-8">
        <div className="container">
          <div className="row">
            <div className="col-md-7">
              <div className="row">
                <div className="col-md-12 py-2">
                  <h3><i className="bi bi-shield-shaded"></i> Cyber Athena</h3>
                  <span className="text-secondary fs-5">
                    A cost-effective digital asset solution for SMEs, powered by hardware security, decentralization, self-management,
                    and multi-signature authorization — enhancing compliance, control, and risk reduction.
                  </span>
                </div>
                <div className="row">
                  <div className="col-md-6 py-3" style={{ textAlign: "justify" }}>
                    <h5>🗝️ Unclonable Hardware Keys</h5>
                    <span className="text-secondary fs-6">
                    Generate unclonable keys with PUF to prevent key extraction or duplication.
                    </span>
                  </div>
                  <div className="col-md-6 py-3" style={{ textAlign: "justify" }}>
                    <h5>📟 Hardware-Based Protection</h5>
                    <span className="text-secondary fs-6">
                    Store private keys with PUF-HSM to block un-authorized access.
                    </span>
                  </div>
                  <div className="col-md-6 py-3" style={{ textAlign: "justify" }}>
                    <h5>🕹️ Passwordless Authentication</h5>
                    <span className="text-secondary fs-6">
                    Authenticate without passwords using PUFido, reducing password exposure.
                    </span>
                  </div>
                  <div className="col-md-6 py-3" style={{ textAlign: "justify" }}>
                    <h5>🎣 Phishing Resistance</h5>
                    <span className="text-secondary fs-6">
                    Eliminate phishing risks by uniquely binding credentials to device and origin.
                    </span>
                  </div>
                  <div className="col-md-6 py-3" style={{ textAlign: "justify" }}>
                    <h5>🧰 Self-Custody Solution</h5>
                    <span className="text-secondary fs-6">
                      Retain control of private keys and assets without relying on third parties.
                    </span>
                  </div>
                  <div className="col-md-6 py-3" style={{ textAlign: "justify" }}>
                    <h5>🔄 Decentralization Support</h5>
                    <span className="text-secondary fs-6">
                      Avoid risks from third-party failures or attacks, aligning with decentralization.
                    </span>
                  </div>
                  <div className="col-md-6 py-3" style={{ textAlign: "justify" }}>
                    <h5>📝 Multi-Signature Authorization</h5>
                    <span className="text-secondary fs-6">
                      Require independent approvals for crypto transactions to ensure decision-making.
                    </span>
                  </div>
                  <div className="col-md-6 py-3" style={{ textAlign: "justify" }}>
                    <h5>🏢 Enterprise-Grade Governance</h5>
                    <span className="text-secondary fs-6">
                      Provide risk control and compliance, preventing single point of failure.
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-5">
              <div className="row align-items-center justify-content-center py-2">
                <div className="col-md-12">
                  <h3><i className="bi bi-cpu"></i> Product Family</h3>
                </div>
                <div className="col-md-10 py-2">
                  <video width="100%" controls autoPlay loop muted>
                    <source src="/SecuX-CM.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                  </video>
                </div>
              </div>
              <div className="col-md-12">
                <h3><i className="bi bi-speedometer"></i> SCA Demo</h3>
              </div>
              <FidoHandler />
            </div>
          </div>
          <hr className="py-4"/>
          <section id="about">
            <div className="row">
              <h3><i className="bi bi-info-circle"></i> About</h3>
              <div className="col-md-7 py-2">
                <h5 className="text-secondary">SecuX Technology Inc.</h5>
                <p className="text-dark fs-6" style={{ textAlign: "justify" }}>
                  SecuX is a leading cybersecurity company specializing in blockchain security solutions.
                  Founded in 2018, SecuX offers a comprehensive range of hardware wallets and authentication tools
                  designed to protect digital assets with military-grade security, user-friendly interfaces,
                  and enterprise-grade scalability. From individual users to SMBs, SecuX empowers secure, self-managed custody in the Web3 era.<br />
                  SecuX, a Web3 security solutions provider, is dedicated to developing and delivering advanced HSM solutions
                  and FIDO2 authentication technologies, offering enterprise-level cryptographic solutions to help clients
                  counter these threats. SecuX&apos;s HSM products provide secure key storage and management, while its FIDO2 solution
                  leverages security key technology for passwordless authentication, ensuring Web3 security and
                  operational integrity for digital asset management.
                </p>
                <h5 className="text-secondary mt-2">SecuX Cyber Athena</h5>
                <p className="text-dark fs-6" style={{ textAlign: "justify" }}>
                  Enterprise-grade cold wallet for SMBs, integrating PUF-based authentication, HSM modules, and multi-signature support.
                  Designed for secure, self-managed Bitcoin custody, Cyber Athena offers a cost-efficient, remote-friendly solution for
                  businesses seeking sovereign asset control.
                </p>
              </div>
              <div className="col-md-5 py-4">
                <div className="row align-items-center justify-content-center">
                  <Image
                    src="/About-us-map.png"
                    alt="About Us Map"
                    width={720}
                    height={290}
                    className="img-fluid rounded"
                  />
                </div>
                <div className="row align-items-center justify-content-center my-4">
                  <div className="col-md-4 d-flex align-items-center justify-content-center flex-column rounded shadow-sm mx-1 my-1"
                    style={{ height: "170px", backgroundColor: "#000000" }}>
                    <Image
                      src="/IF-Design-Award.png"
                      alt="IF Design Award"
                      width={200}
                      height={135}
                      className="img-fluid rounded mb-3"
                      style={{ width: "auto", height: "auto" }}
                    />
                    {/* <span className="text-light text-center font-monospace">IF Design Award</span> */}
                  </div>
                  <div className="col-md-3 d-flex align-items-center justify-content-center flex-column rounded shadow-sm mx-1 my-1"
                    style={{ height: "170px", backgroundColor: "#000000" }}>
                    <Image
                      src="/Golden-Pin-Design-Award.png"
                      alt="Golden Pin Design Award"
                      width={200}
                      height={135}
                      className="img-fluid rounded mb-3"
                    />
                    {/* <span className="text-light text-center font-monospace">Golden Pin Design Award</span> */}
                  </div>
                  <div className="col-md-4 d-flex align-items-center justify-content-center flex-column rounded shadow-sm mx-1 my-1"
                    style={{ height: "170px", backgroundColor: "#000000" }}>
                    <Image
                      src="/European-Product-Design-Award.png"
                      alt="European Product Design Award"
                      width={200}
                      height={135}
                      className="img-fluid rounded mb-3"
                      style={{ width: "auto", height: "auto" }}
                    />
                    {/* <span className="text-light text-center font-monospace">European Product Design Award</span> */}
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12 text-center py-2">
                <a
                  href="https://secuxtech.com/pages/online-shop"
                  target="_blank"
                  className="btn btn-secondary rounded-pill"
                >
                Learn More
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer and ScrollTop */}
      <Footer />
      <ScrollTop />
    </div>
  );
}