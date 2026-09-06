export interface BrandLogoProps {
  compact?: boolean;
  className?: string;
}

export function BrandLogo({ compact = false, className = "" }: BrandLogoProps) {
  return (
    <div className={`brand-mark ${compact ? "brand-mark-compact" : ""} ${className}`.trim()}>
      <div className="brand-seal-icon" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-svg">
          {/* Outer wax seal cog/rim */}
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" className="seal-rim" />
          <circle cx="20" cy="20" r="15" fill="var(--color-surface-2)" stroke="var(--color-seal-accent)" strokeWidth="1.2" />

          {/* Open casebook folios */}
          <path d="M12 25V14C12 13 15 12 20 13.5C25 12 28 13 28 14V25C28 24 25 23 20 24.5C15 23 12 24 12 25Z" fill="var(--color-surface-3)" stroke="currentColor" strokeWidth="1.2" />
          <line x1="20" y1="13.5" x2="20" y2="24.5" stroke="var(--color-seal-accent)" strokeWidth="1.5" />

          {/* Balanced scales indicator */}
          <path d="M14 17L17 19M26 17L23 19" stroke="var(--color-text-muted)" strokeWidth="1" strokeLinecap="round" />
          <circle cx="14" cy="17.5" r="1.5" fill="var(--color-uphold)" />
          <circle cx="26" cy="17.5" r="1.5" fill="var(--color-reverse)" />

          {/* Central immutable lock / verified diamond */}
          <rect x="18" y="19" width="4" height="4" rx="1" transform="rotate(45 20 21)" fill="var(--color-seal-accent)" />
        </svg>
      </div>
      <div className="brand-copy">
        <span className="brand-title">Precedent Resolver</span>
        {!compact && <span className="brand-subtitle">Moderation Appeal Casebook</span>}
      </div>
    </div>
  );
}
