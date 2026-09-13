import SimpleBar from "simplebar-react";

export function AuthLayout({ title, subtitle, children }) {
  return (
    <SimpleBar className="app-scrollbar">
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
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </SimpleBar>
  );
}
