export function Logo({ showTagline = true, size = 48 }) {
  return (
    <div className="brand-container" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
      <img src="/logo-mark.png" alt="CR Conecta" style={{ height: size, width: size, borderRadius: 12, objectFit: 'cover' }} />
      <div>
        <div style={{ color: 'var(--navy)', fontWeight: '800', fontSize: '1.125rem', letterSpacing: '0.4px', lineHeight: '1.1' }}>
          CR CONECTA
        </div>
        {showTagline && (
          <div className="brand-tagline" style={{ color: 'var(--muted)', fontSize: '0.6875rem', fontWeight: '500', marginTop: '3px', letterSpacing: '0.2px' }}>
            Conectando personas · Construyendo paz
          </div>
        )}
      </div>
    </div>
  );
}
