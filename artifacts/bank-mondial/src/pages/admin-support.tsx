import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageCircle, Headphones, ChevronLeft, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Conversation = {
  user: { id: number; fullName: string; email: string };
  lastMessage: { content: string; createdAt: string; isFromAdmin: boolean };
  unread: number;
};

type Message = {
  id: number;
  content: string;
  isFromAdmin: boolean;
  createdAt: string;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export default function AdminSupport() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(async () => {
    const r = await fetch("/api/admin/support/conversations", { headers: authHeaders() });
    if (r.ok) setConvs(await r.json());
  }, []);

  const loadMessages = useCallback(async (userId: number) => {
    const r = await fetch(`/api/admin/support/${userId}/messages`, { headers: authHeaders() });
    if (r.ok) setMessages(await r.json());
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const openConv = async (conv: Conversation) => {
    setSelected(conv);
    setConvs((p) => p.map((c) => c.user.id === conv.user.id ? { ...c, unread: 0 } : c));
    await loadMessages(conv.user.id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selected) return;
    setSending(true);
    const r = await fetch(`/api/admin/support/${selected.user.id}/messages`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ content: input.trim() }),
    });
    if (r.ok) {
      const msg = await r.json();
      setMessages((p) => [...p, msg]);
      setInput("");
      loadConvs();
    }
    setSending(false);
  };

  return (
    <div className="space-y-0 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 pb-4 border-b mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003087]/10">
          <Headphones className="h-5 w-5 text-[#003087]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support — Conversations</h1>
          <p className="text-sm text-muted-foreground">{convs.length} conversation{convs.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-14rem)]">
        {/* Sidebar */}
        <div className="w-72 shrink-0 flex flex-col border rounded-xl bg-white overflow-hidden">
          <div className="p-3 border-b text-xs font-bold uppercase tracking-widest text-gray-400">Utilisateurs</div>
          <div className="flex-1 overflow-y-auto divide-y">
            {convs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-6">
                <MessageCircle className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">Aucune conversation</p>
              </div>
            ) : convs.map((c) => (
              <button
                key={c.user.id}
                onClick={() => openConv(c)}
                className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 ${selected?.user.id === c.user.id ? "bg-[#003087]/5 border-l-2 border-[#003087]" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#003087]/10 text-[#003087] text-sm font-bold">
                    {c.user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.user.fullName}</p>
                      {c.unread > 0 && (
                        <span className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#003087] text-[9px] font-bold text-white">{c.unread}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{c.lastMessage.content}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col border rounded-xl bg-white overflow-hidden">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <MessageCircle className="h-12 w-12 text-gray-200" />
              <p className="text-gray-400">Sélectionnez une conversation</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b">
                <button onClick={() => setSelected(null)} className="md:hidden text-gray-400 hover:text-gray-600">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#003087]/10 text-[#003087] font-bold text-sm">
                  {selected.user.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{selected.user.fullName}</p>
                  <p className="text-xs text-gray-400">{selected.user.email}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isFromAdmin ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.isFromAdmin
                        ? "bg-[#003087] text-white rounded-tr-sm"
                        : "bg-gray-100 text-gray-800 rounded-tl-sm"
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.isFromAdmin ? "text-white/60" : "text-gray-400"}`}>
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="border-t p-3 flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#003087] transition-colors"
                  placeholder={`Répondre à ${selected.user.fullName}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || !input.trim()} className="bg-[#003087] hover:bg-[#003087]/90 text-white rounded-xl px-4">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
