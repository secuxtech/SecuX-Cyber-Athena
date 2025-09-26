export default function Footer() {
  return (
    <footer className="container d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top">
      <div className="col-md-4 d-flex align-items-center">
        <span className="mb-3 mb-md-0 text-body-secondary"> © 2025 SecuX Technology, Inc. All rights reserved.</span>
      </div>

      <ul className="nav col-md-4 justify-content-end list-unstyled d-flex py-3">
        <li className="ms-3">
          <a className="text-body-secondary" href="https://secuxtech.com/" target="_blank">
            <span className="fs-4 px-1"><i className="bi bi-globe2"></i></span>
          </a>
        </li>
        <li className="ms-3">
          <a className="text-body-secondary" href="https://x.com/SecuXwallet/" target="_blank">
            <span className="fs-4 px-1"><i className="bi bi-twitter-x"></i></span>
          </a>
        </li>
        <li className="ms-3">
          <a className="text-body-secondary" href="https://www.instagram.com/secuxtechnology/" target="_blank">
            <span className="fs-4 px-1"><i className="bi bi-instagram"></i></span>
          </a>
        </li>
        <li className="ms-3">
          <a className="text-body-secondary" href="https://www.linkedin.com/company/secuxtech/" target="_blank">
            <span className="fs-4 px-1"><i className="bi bi-linkedin"></i></span>
          </a>
        </li>
        <li className="ms-3">
          <a className="text-body-secondary" href="https://www.facebook.com/secuxtech/" target="_blank">
            <span className="fs-4 px-1"><i className="bi bi-facebook"></i></span>
          </a>
        </li>
        <li className="ms-3">
          <a className="text-body-secondary"
            href="https://www.youtube.com/@secux" target="_blank">
            <span className="fs-4 px-1"><i className="bi bi-youtube"></i></span>
          </a>
        </li>
        <li className="ms-3">
          <a className="text-body-secondary" href="https://t.me/secuxcoldwallet" target="_blank">
            <span className="fs-4 px-1"><i className="bi bi-telegram"></i></span>
          </a>
        </li>
      </ul>
    </footer>
  );
}