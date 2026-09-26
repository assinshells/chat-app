import SimpleBar from "simplebar-react";
import { Heart, Copyright } from "lucide-react";

const creationYear = 2026;
const currentYear = new Date().getFullYear();

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
                  <a href="/terms" className="text-muted me-3">
                    Файли cookie
                  </a>
                  <a href="/privacy" className="text-muted">
                    Розробники
                  </a>
                  <p>
                    <Copyright className="footer-icon" size="1em" />{" "}
                    {creationYear}
                    {creationYear !== currentYear && `-${currentYear}`} {title}.
                    Programmed by{" "}
                    <Heart
                      className="text-danger footer-icon"
                      size="1em"
                      fill="currentColor"
                    />{" "}
                    E.Thompson.
                  </p>
                  <span>All rights reserved.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SimpleBar>
  );
}
