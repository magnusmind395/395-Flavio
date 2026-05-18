interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <div className="auth-container">
      <div className="auth-background particles" />
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/icone-magnusmind.svg" alt="Magnus Mind Icon" className="logo-icon" style={{ width: 80, height: 80 }} />
          <h1 className="auth-title">magnus mind</h1>
        </div>
        <h2 className="auth-title" style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-lg)' }}>
          {title}
        </h2>
        {children}
        <p className="auth-footer">{footer}</p>
      </div>
    </div>
  );
}
