import { CursorGlowBackground } from './CursorGlowBackground';

interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <CursorGlowBackground />
      <div className="auth-container">
        <div className="auth-card auth-card-vivid">
          <div className="auth-logo">
            <img
              src="/icone-magnusmind.svg"
              alt="Magnus Mind Icon"
              className="logo-icon"
              style={{ width: 80, height: 80 }}
            />
            <h1 className="auth-title">magnus mind</h1>
          </div>
          <h2
            className="auth-title auth-form-heading"
          >
            {title}
          </h2>
          {children}
          <p className="auth-footer">{footer}</p>
        </div>
      </div>
    </div>
  );
}
