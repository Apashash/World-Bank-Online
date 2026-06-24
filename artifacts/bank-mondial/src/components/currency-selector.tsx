import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useCurrency, CURRENCIES, type CurrencyCode } from "@/contexts/currency-context";

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors text-white text-xs font-semibold"
        title="Changer de devise"
      >
        <span className="text-base leading-none">{currency.flag}</span>
        <span className="hidden sm:inline tracking-wide">{currency.code}</span>
        <ChevronDown
          className={`h-3 w-3 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden"
          style={{ background: "#001a4d" }}
        >
          <div className="px-3 py-2 border-b border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Devise d'affichage</p>
          </div>
          <div className="py-1 max-h-72 overflow-y-auto">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setCurrency(c.code as CurrencyCode);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  c.code === currency.code
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-base w-6 text-center">{c.flag}</span>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-semibold text-xs leading-none">{c.code}</span>
                  <span className="text-[10px] text-white/50 leading-none mt-0.5 truncate">{c.label}</span>
                </div>
                {c.code === currency.code && (
                  <span className="ml-auto text-[#6DC142] text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
