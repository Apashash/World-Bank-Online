/* ─────────────────────────────────────────────
   BankCard — Banque Mondiale branded card
   Usage:
     <BankCard variant="gold" />
     <BankCard variant="fosfo" className="w-52" />
───────────────────────────────────────────── */

interface BankCardProps {
  variant: "gold" | "fosfo";
  className?: string;
  style?: React.CSSProperties;
}

/* Mastercard logo — two overlapping circles */
function MastercardLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.618} viewBox="0 0 38 24" fill="none">
      <circle cx="14" cy="12" r="12" fill="#EB001B" />
      <circle cx="24" cy="12" r="12" fill="#F79E1B" />
      <path d="M19 4.8a12 12 0 0 1 0 14.4A12 12 0 0 1 19 4.8z" fill="#FF5F00" />
    </svg>
  );
}

/* Chip SVG */
function Chip({ gold = false }: { gold?: boolean }) {
  const c = gold ? "#c8a84b" : "#6DC142";
  return (
    <svg width="38" height="30" viewBox="0 0 38 30" fill="none">
      <rect width="38" height="30" rx="4" fill={gold ? "#d4af5a" : "#4a9060"} />
      <rect x="1" y="1" width="36" height="28" rx="3" fill={gold ? "#c8a84b" : "#3a7a50"} />
      <rect x="13" y="1" width="12" height="28" rx="0" fill={gold ? "#b89030" : "#2a6040"} opacity="0.5" />
      <rect x="1" y="10" width="36" height="10" rx="0" fill={gold ? "#b89030" : "#2a6040"} opacity="0.5" />
      <rect x="13" y="10" width="12" height="10" rx="2" fill={gold ? "#e8c860" : "#5ab070"} />
      <line x1="13" y1="1" x2="13" y2="29" stroke={gold ? "#a07820" : "#1a5030"} strokeWidth="0.5" />
      <line x1="25" y1="1" x2="25" y2="29" stroke={gold ? "#a07820" : "#1a5030"} strokeWidth="0.5" />
      <line x1="1" y1="10" x2="37" y2="10" stroke={gold ? "#a07820" : "#1a5030"} strokeWidth="0.5" />
      <line x1="1" y1="20" x2="37" y2="20" stroke={gold ? "#a07820" : "#1a5030"} strokeWidth="0.5" />
    </svg>
  );
}

export default function BankCard({ variant, className = "", style }: BankCardProps) {
  const isGold = variant === "gold";

  const bgGrad = isGold
    ? "linear-gradient(135deg, #d4a843 0%, #f0c96a 30%, #c89030 60%, #a87020 100%)"
    : "linear-gradient(135deg, #1a4a3a 0%, #2a6a50 35%, #1f5545 65%, #163d30 100%)";

  const shimmer = isGold
    ? "linear-gradient(115deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 40%, transparent 60%)"
    : "linear-gradient(115deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 40%, transparent 60%)";

  const labelColor = isGold ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.45)";
  const nameColor = isGold ? "#fff" : "#e0f5ec";
  const typeText = isGold ? "GOLD" : "FOSFO";

  return (
    <div
      className={`relative overflow-hidden select-none ${className}`}
      style={{
        aspectRatio: "85.6 / 53.98",
        borderRadius: "12px",
        background: bgGrad,
        boxShadow: isGold
          ? "0 8px 32px rgba(160,120,30,0.5), 0 2px 8px rgba(0,0,0,0.3)"
          : "0 8px 32px rgba(20,80,60,0.5), 0 2px 8px rgba(0,0,0,0.4)",
        ...style,
      }}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: shimmer }} />

      {/* Subtle pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-[7%]">
        {/* Top row: logo + bank name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <img src="/logo-banque-mondiale.png" alt="BM"
              className="object-contain"
              style={{ width: "13%", minWidth: 16, maxWidth: 28, filter: isGold ? "none" : "brightness(1.4)" }} />
            <div>
              <p style={{ fontSize: "clamp(4px, 1.8%, 8px)", fontWeight: 900, letterSpacing: "0.05em", color: isGold ? "rgba(60,35,5,0.85)" : "rgba(200,240,220,0.9)", lineHeight: 1.1, textTransform: "uppercase" }}>
                BANQUE
              </p>
              <p style={{ fontSize: "clamp(4px, 1.8%, 8px)", fontWeight: 900, letterSpacing: "0.05em", color: isGold ? "rgba(60,35,5,0.85)" : "rgba(200,240,220,0.9)", lineHeight: 1.1, textTransform: "uppercase" }}>
                MONDIALE
              </p>
            </div>
          </div>
          {/* NFC icon */}
          <svg viewBox="0 0 24 24" style={{ width: "8%", minWidth: 10, maxWidth: 18 }} fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.93 0 3.68.79 4.95 2.05L5.05 18.95A6.978 6.978 0 0 1 5 18c0-3.87 3.13-7 7-7zm0 14c-1.93 0-3.68-.79-4.95-2.05l11.9-11.9c.03.31.05.63.05.95 0 3.87-3.13 7-7 7z"
              fill={isGold ? "rgba(60,35,5,0.5)" : "rgba(200,240,220,0.5)"} />
          </svg>
        </div>

        {/* Middle: chip */}
        <div style={{ width: "22%", minWidth: 28, maxWidth: 48 }}>
          <Chip gold={isGold} />
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <div>
            <p style={{ fontSize: "clamp(4px, 1.6%, 7px)", color: labelColor, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 1 }}>
              {typeText}
            </p>
            <p style={{ fontSize: "clamp(5px, 2%, 9px)", fontWeight: 700, color: nameColor, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Jonathan Doe
            </p>
            <p style={{ fontSize: "clamp(4px, 1.5%, 7px)", color: labelColor, letterSpacing: "0.08em", marginTop: 1 }}>
              CB MASTERCARD
            </p>
          </div>
          <MastercardLogo size={Math.max(24, 30)} />
        </div>
      </div>
    </div>
  );
}
