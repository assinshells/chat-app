import SimpleBar from "simplebar-react";
import { Heart, Copyright } from "lucide-react";

const creationYear = 2026;
const currentYear = new Date().getFullYear();

export function AuthLayout({ title, subtitle, children }) {
  return (
    <SimpleBar style={{ maxHeight: "100vh" }} autoHide={true}>
      <div className="auth-layout my-5 pt-sm-5">
        <div className="container">
          <div className="row justify-content-center">
            <main className="col-12">
              <div className="main-content">
                <div className="w-100 mx-auto" style={{ maxWidth: "24.5rem" }}>
                  <div className="mb-5">
                    <header>
                      <h4 className="text-center mb-4">
                        <span className="text-muted text-break">{title}</span>
                      </h4>
                      {subtitle && (
                        <span className="d-block text-muted text-break">
                          {subtitle}
                        </span>
                      )}
                    </header>
                  </div>
                  <div className="card p-4 rounded-4 shadow-sm mb-3">
                    {children}
                  </div>
                  <footer className="d-flex flex-wrap align-items-center justify-content-center gap-1 text-muted small text-center">
                    <span>
                      <Copyright className="footer-icon" size="1em" />{" "} {creationYear}
                      {creationYear !== currentYear && `-${currentYear}`}{" "}
                      {title}. Programmed by{" "}
                      <Heart
                        className="text-danger footer-icon"
                        size="1em"
                        fill="currentColor"
                      />{" "}
                      E.Thompson.
                    </span>
                    <span>All rights reserved.</span>
                  </footer>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </SimpleBar>
  );
}
