import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Container, Form, Spinner } from "react-bootstrap";
import { chat } from "../api/ai";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const PROMPT_CATEGORIES = [
  {
    label: "📊 Sales",
    prompts: [
      "How much today?",
      "Top sellers this week?",
      "Sales summary",
    ],
  },
  {
    label: "📦 Inventory",
    prompts: [
      "What's running low?",
      "What needs restocking?",
    ],
  },
  {
    label: "🔍 Lookup",
    prompts: [
      "Tell me about Coca-Cola",
      "Find products with 'bread'",
    ],
  },
];

const TOOL_LABELS = {
  get_low_stock_products: "Checked low stock",
  get_top_selling_products: "Checked top sellers",
  get_revenue_total: "Checked revenue",
  get_product_by_name: "Looked up product",
  get_sales_summary: "Checked sales summary",
};

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hi! I'm StockMind 👋\n\nAsk me anything about your store — sales numbers, what's running low, top sellers, or details about a specific product. I'll check the data and answer right away.\n\nPick a suggestion below or just type your question.",
  ts: new Date().toISOString(),
};

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Assistant() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const storageKey = useMemo(
    () => `stockmind_chat_${user?.username || "guest"}`,
    [user?.username]
  );

  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [WELCOME_MESSAGE];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      /* ignore quota errors */
    }
  }, [messages, storageKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userMsg = {
      role: "user",
      content: text,
      ts: new Date().toISOString(),
    };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const payload = newHistory
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await chat(payload);
      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content: res.message,
          tools_used: res.tools_used || [],
          ts: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content: "Sorry, I had trouble answering. Try again in a moment.",
          error: true,
          ts: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClearChat = () => {
    if (!window.confirm("Clear chat history? This cannot be undone.")) return;
    setMessages([WELCOME_MESSAGE]);
  };

  const isOnlyWelcome = messages.length === 1 && messages[0] === WELCOME_MESSAGE;

  return (
    <Container fluid="lg" style={{ maxWidth: 960 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">{t("assistant.title")}</h1>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={handleClearChat}
          disabled={isOnlyWelcome}
        >
          🗑 {t("assistant.clear_chat", "Clear chat")}
        </Button>
      </div>

      <div
        className="border rounded bg-white"
        style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 240px)", minHeight: 500 }}
      >
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: "auto" }}
          className="p-3"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`mb-3 d-flex ${
                m.role === "user" ? "justify-content-end" : "justify-content-start"
              }`}
            >
              <div style={{ maxWidth: "78%" }}>
                {m.role === "assistant" && m.tools_used?.length > 0 && (
                  <div className="mb-1 d-flex flex-wrap gap-1">
                    {m.tools_used.map((tool, idx) => (
                      <Badge key={idx} bg="light" text="dark" className="border">
                        🔧 {TOOL_LABELS[tool] || tool}
                      </Badge>
                    ))}
                  </div>
                )}
                <div
                  className={`p-3 rounded ${
                    m.role === "user"
                      ? "bg-primary text-white"
                      : m.error
                      ? "bg-danger-subtle border border-danger-subtle"
                      : "bg-light border"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {m.content}
                </div>
                {m.ts && (
                  <div
                    className={`small text-muted mt-1 ${
                      m.role === "user" ? "text-end" : ""
                    }`}
                  >
                    {formatTime(m.ts)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="d-flex justify-content-start mb-3">
              <div className="p-3 rounded bg-light border">
                <Spinner animation="grow" size="sm" className="me-1" />
                <Spinner animation="grow" size="sm" className="me-1" />
                <Spinner animation="grow" size="sm" />
              </div>
            </div>
          )}
        </div>

        {isOnlyWelcome && (
          <div className="border-top px-3 py-2 bg-light">
            <div className="d-flex flex-column gap-1">
              {PROMPT_CATEGORIES.map((cat) => (
                <div
                  key={cat.label}
                  className="d-flex align-items-center flex-wrap gap-1"
                >
                  <div
                    className="text-muted small me-2"
                    style={{ minWidth: 90 }}
                  >
                    {cat.label}
                  </div>
                  {cat.prompts.map((p) => (
                    <Button
                      key={p}
                      variant="outline-primary"
                      onClick={() => sendMessage(p)}
                      disabled={loading}
                      className="py-0 px-2"
                      style={{ fontSize: 12 }}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-top p-2">
          <Form onSubmit={handleSubmit}>
            <div className="d-flex gap-2">
              <Form.Control
                ref={inputRef}
                as="textarea"
                rows={1}
                placeholder={t("assistant.placeholder", "Ask anything about your store... (Enter to send, Shift+Enter for newline)")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoFocus
                style={{ resize: "none" }}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !input.trim()}
              >
                {t("assistant.send")}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </Container>
  );
}
