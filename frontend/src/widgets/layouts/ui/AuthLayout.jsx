import SimpleBar from "simplebar-react";
import { Heart, Copyright } from "lucide-react";

const creationYear = 2026;
const currentYear = new Date().getFullYear();

export function AuthLayout({ title, subtitle, children }) {
  return (
    <SimpleBar style={{ maxHeight: "100vh" }} autoHide={true}>
      <div className="d-flex align-items-center py-4">
        <main className="authentication-template w-100 m-auto">
          <header>
            <h4 className="text-center mb-4">
              <span className="text-muted text-break">{title}</span>
            </h4>
            {subtitle && (
              <span className="d-block text-muted text-break mb-4">{subtitle}</span>
            )}
          </header>

          {children}

          <footer className="d-flex flex-wrap align-items-center justify-content-center gap-1 text-muted small text-center mt-4">
            <span>
              <Copyright className="footer-icon" size="1em" /> {creationYear}
              {creationYear !== currentYear && `-${currentYear}`} {title}.
              Programmed by{" "}
              <Heart
                className="text-danger footer-icon"
                size="1em"
                fill="currentColor"
              />{" "}
              E.Thompson.
            </span>
            <span>All rights reserved.</span>
          </footer>
        </main>
      </div>
    </SimpleBar>
  );
}
