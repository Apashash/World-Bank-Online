import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageCircle, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Message = {
  id: number;
  content: string;
  isFromAdmin: boolean;
  isRead: boolean;
  createdAt: string;
};

function authHeaders() {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export default function Support() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const r = await fetch("/api/support/messages", { headers: authHeaders() });
    if (r.ok) {
      const data = await r.json();
      setMessages(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll every 15s for new admin replies
  useEffect(() => {
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      const r = await fetch("/api/support/messages", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content: input.trim() }),
      });
      if (!r.ok) throw new Error();
      const msg = await r.json();
      setMessages((p) => [...p, msg]);
      setInput("");
    } catch {
      toast({ title: "Erreur d'envoi", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003087]/10">
          <Headphones className="h-5 w-5 text-[#003087]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Support client</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
            En ligne · Réponse sous 24h
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 px-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-muted-foreground animate-pulse">Chargement...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <MessageCircle className="h-7 w-7 text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">Démarrez la conversation</p>
              <p className="text-sm text-muted-foreground mt-1">Notre équipe est disponible pour vous aider.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isFromAdmin ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.isFromAdmin
                  ? "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
                  : "bg-[#003087] text-white rounded-tr-sm"
              }`}>
                {msg.isFromAdmin && (
                  <p className="text-[10px] font-semibold text-[#003087] mb-1 uppercase tracking-wide">Support</p>
                )}
                <p className="leading-relaxed">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${msg.isFromAdmin ? "text-gray-400" : "text-white/60"}`}>
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: fr })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t pt-4 flex gap-2">
        <input
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#003087] transition-colors placeholder:text-gray-400"
          placeholder="Écrivez votre message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <Button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-[#003087] hover:bg-[#003087]/90 text-white rounded-xl px-4"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
