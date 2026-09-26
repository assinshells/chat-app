import SimpleBar from "simplebar-react";
import { Copyright } from "lucide-react";
import { DeveloperModal } from "@features/info";

const creationYear = 2026;
const currentYear = new Date().getFullYear();
const DEVELOPER_MODAL_ID = "authDeveloperModal";

export function AuthLayout({ title, subtitle, children }) {
  return (
    <SimpleBar style={{ maxHeight: "100vh" }} autoHide={true}>
      <div className="auth-layout">
        <div className="container-fluid px-3 h-100">
          <div className="d-table w-100 h-100">
            <div className="d-table-cell align-middle">
              <div className="auth-content text-center">
                <span className="d-inline-block auth-brand mb-5">{title}</span>
                {subtitle && <p className="text-muted mb-4">{subtitle}</p>}
                {children}
                <div className="small">
                  <a href="/terms" className="text-muted text-decoration-none me-3">
                    Файли cookie
                  </a>
                  <a
                    href="#"
                    className="text-muted text-decoration-none"
                    data-bs-toggle="modal"
                    data-bs-target={`#${DEVELOPER_MODAL_ID}`}
                    onClick={(e) => e.preventDefault()}
                  >
                    Розробники
                  </a>
                  <p>
                    <Copyright className="footer-icon" size="1em" />{" "}
                    {creationYear}
                    {creationYear !== currentYear && `-${currentYear}`} {title}.
                  </p>
                  <span>All rights reserved.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DeveloperModal modalId={DEVELOPER_MODAL_ID} />
    </SimpleBar>
  );
}