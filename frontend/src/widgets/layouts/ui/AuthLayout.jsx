import { useRef } from "react";

import { useAutoHideScrollbar } from "@shared/lib/useAutoHideScrollbar.js";

export function AuthLayout({ title, subtitle, children }) {
  const rootRef = useRef(null);
  useAutoHideScrollbar(rootRef, { window: true });

  return (
    <div ref={rootRef} className="auth-layout app-scrollbar">
      <div className="py-4">
        <div className="container">
          <div className="row justify-content-center">
            <main className="col-12">
              <div className="main-content">
                <div
                  className="w-100 mx-auto"
                  style={{ maxWidth: "24.5rem" }}
                >
                  <div className="mb-5">
                    <header>
                      {subtitle && (
                        <span className="d-block text-muted text-break">
                          {subtitle}
                        </span>
                      )}

                      <h4 className="mb-0">
                        <span className="text-muted text-break">{title}</span>
                      </h4>
                    </header>
                  </div>

                  <div className="card p-4 rounded-4 shadow-sm mb-3">
                    {children}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
