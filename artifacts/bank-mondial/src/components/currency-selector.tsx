import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useCurrency, CURRENCIES, type CurrencyCode } from "@/contexts/currency-context";

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  const filtered = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.symbol.toLowerCase().includes(query.toLowerCase()),
  );

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
        <div
          className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col"
          style={{ background: "#001a4d", maxHeight: "340px" }}
        >
          <div className="px-3 py-2 border-b border-white/10 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
              Devise d'affichage
            </p>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1.5">
              <Search className="h-3 w-3 text-white/40 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="bg-transparent text-white text-xs placeholder-white/30 outline-none w-full"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-center text-white/30 text-xs py-6">Aucun résultat</p>
            ) : (
              filtered.map((c) => (
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
                  <span className="text-base w-6 text-center shrink-0">{c.flag}</span>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-semibold text-xs leading-none">{c.code}</span>
                    <span className="text-[10px] text-white/50 leading-none mt-0.5 truncate w-full text-left">
                      {c.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/40 shrink-0 font-mono">{c.symbol}</span>
                  {c.code === currency.code && (
                    <span className="text-[#6DC142] text-xs ml-1">✓</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
