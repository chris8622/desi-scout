"use client";

import { useState, useRef } from "react";

interface Source {
  title: string;
  url: string;
  source: string;
  snippet: string;
  hasContent: boolean;
}
interface Result {
  query: string;
  summary: string;
  sources: Source[];
}

export default function Home() {
  const [query, setQuery]     = useState("");
  const [status, setStatus]   = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<Result | null>(null);
  const [error, setError]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function doSearch() {
    const q = query.trim();
    if (!q || loading) return;

    setLoading(true);
    setStatus("Verbinde…");
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const { type, data } = JSON.parse(line.slice(6));
            if (type === "status") setStatus(data);
            if (type === "error")  { setError(data); setLoading(false); }
            if (type === "result") { setResult(data); setLoading(false); setStatus(""); }
          } catch {}
        }
      }
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: "2rem", maxWidth: 900, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
        <div style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: "clamp(2rem, 5vw, 3rem)",
          background: "linear-gradient(135deg, #a855f7, #6366f1)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "0.5rem",
        }}>
          Desi Scout
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
          Durchsucht öffentliche Foren &amp; fasst Diskussionen zusammen
        </p>
      </div>

      {/* Suchbox */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: "1.5rem",
        marginBottom: "2rem",
      }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder='z.B. "Rückenschmerzen Physiotherapie" oder "Webdesign Kosten Erfahrungen"'
            disabled={loading}
            style={{
              flex: 1,
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "0.85rem 1.1rem",
              color: "var(--text)",
              fontSize: "1rem",
              fontFamily: "inherit",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
          <button
            onClick={doSearch}
            disabled={loading || !query.trim()}
            style={{
              background: loading || !query.trim()
                ? "rgba(168,85,247,0.3)"
                : "linear-gradient(135deg, #a855f7, #6366f1)",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: "0.85rem 1.5rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: loading || !query.trim() ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "opacity 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Läuft…" : "🔍 Suchen"}
          </button>
        </div>

        {/* Vorschläge */}
        <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {["Rückenschmerzen Erfahrungen", "Webdesign Kosten", "Physiotherapie Wien", "Steuerberater Empfehlung", "Elektriker Preise"].map(s => (
            <button
              key={s}
              onClick={() => { setQuery(s); inputRef.current?.focus(); }}
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                color: "var(--muted)",
                borderRadius: 999,
                padding: "0.28rem 0.75rem",
                fontSize: "0.78rem",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
              onMouseOver={e => {
                (e.target as HTMLElement).style.borderColor = "var(--accent)";
                (e.target as HTMLElement).style.color = "var(--text)";
              }}
              onMouseOut={e => {
                (e.target as HTMLElement).style.borderColor = "var(--border)";
                (e.target as HTMLElement).style.color = "var(--muted)";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          background: "var(--surface)", border: "1px solid rgba(168,85,247,0.3)",
          borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.5rem",
        }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)", animation: "pulse 1.2s infinite" }} />
          <span style={{ color: "var(--accent)", fontSize: "0.9rem", fontWeight: 500 }}>{status}</span>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
        </div>
      )}

      {/* Fehler */}
      {error && (
        <div style={{
          background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.25)",
          borderRadius: 12, padding: "1rem 1.25rem", color: "var(--hot)",
          fontSize: "0.9rem", marginBottom: "1.5rem",
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Ergebnis */}
      {result && (
        <div>
          {/* Query Header */}
          <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Ergebnis für
            </span>
            <span style={{
              background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)",
              borderRadius: 999, padding: "0.2rem 0.75rem", fontSize: "0.82rem",
              color: "var(--accent)", fontWeight: 600,
            }}>
              {result.query}
            </span>
          </div>

          {/* KI-Zusammenfassung */}
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "0.65rem" }}>
              🤖 KI-Zusammenfassung
            </div>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(168,85,247,0.25)",
                borderRadius: 16,
                padding: "1.5rem",
                marginBottom: "1.5rem",
              }}
              dangerouslySetInnerHTML={{ __html: result.summary }}
            />
          </div>

          {/* Quellen */}
          {result.sources.length > 0 && (
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "0.65rem" }}>
                📋 Quellen ({result.sources.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.65rem" }}>
                {result.sources.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "1rem 1.1rem",
                      textDecoration: "none",
                      transition: "border-color 0.2s",
                    }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = "rgba(168,85,247,0.5)")}
                    onMouseOut={e => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <div style={{ fontSize: "0.68rem", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" }}>
                      {s.source}
                      {!s.hasContent && <span style={{ color: "var(--muted)", marginLeft: "0.4rem" }}>· kein Zugriff</span>}
                    </div>
                    <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.3rem", lineHeight: 1.4 }}>
                      {s.title}
                    </div>
                    {s.snippet && (
                      <div style={{ fontSize: "0.76rem", color: "var(--muted)", lineHeight: 1.5 }}>
                        {s.snippet}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leer-State */}
      {!loading && !result && !error && (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--muted)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💬</div>
          <p style={{ fontSize: "0.95rem" }}>Thema eingeben und auf <strong style={{ color: "var(--text)" }}>Suchen</strong> klicken.</p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>Der Scout durchsucht Foren &amp; fasst zusammen, was diskutiert wird.</p>
        </div>
      )}

      {/* Summary Card Styles */}
      <style>{`
        .summary-card h3, [dangerouslySetInnerHTML] h3 { font-family:'DM Sans',sans-serif; font-size:.95rem; font-weight:700; color:var(--accent); margin:1rem 0 .35rem }
        [dangerouslySetInnerHTML] h3:first-child { margin-top:0 }
        [dangerouslySetInnerHTML] p { font-size:.88rem; line-height:1.65; color:var(--text); margin-bottom:.5rem }
        [dangerouslySetInnerHTML] ul { padding-left:1.2rem; margin-bottom:.75rem }
        [dangerouslySetInnerHTML] li { font-size:.88rem; line-height:1.65; color:var(--text); margin-bottom:.25rem }
        [dangerouslySetInnerHTML] strong { color:var(--accent) }
        [dangerouslySetInnerHTML] em { color:var(--muted) }
      `}</style>
    </main>
  );
}
