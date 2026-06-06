"use client";

import { useState, useEffect, useRef } from "react";

interface Source {
  title: string; url: string; source: string; snippet: string; hasContent: boolean;
}
interface Result {
  query: string; summary: string; sources: Source[];
}

// ─── Gemeinsame Styles ───────────────────────────────────
const card = {
  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.5rem",
} as const;

const inputStyle = {
  background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10,
  padding: "0.75rem 1rem", color: "var(--text)", fontSize: "0.95rem",
  fontFamily: "inherit", outline: "none", width: "100%",
} as const;

const btnPrimary = {
  background: "linear-gradient(135deg, #a855f7, #6366f1)", color: "white",
  border: "none", borderRadius: 10, padding: "0.75rem 1.5rem",
  fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  width: "100%", marginTop: "0.75rem",
} as const;

// ─── Login Screen ────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey]     = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || !apiKey.startsWith("sk-ant-")) {
      setError("Bitte Passwort und gültigen Claude API Key eingeben.");
      return;
    }
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!data.ok) { setError("Falsches Passwort."); setLoading(false); return; }
      localStorage.setItem("desi_auth", "1");
      localStorage.setItem("desi_apikey", apiKey);
      onLogin();
    } catch {
      setError("Verbindungsfehler."); setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "2.5rem", background: "linear-gradient(135deg, #a855f7, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Desi Scout
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginTop: "0.3rem" }}>Forum Research Tool</p>
        </div>

        <form onSubmit={handleSubmit} style={{ ...card }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginBottom: "0.4rem" }}>
              Passwort
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Zugangspasswort" style={inputStyle} autoFocus
            />
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginBottom: "0.4rem" }}>
              Claude API Key
            </label>
            <input
              type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..." style={inputStyle}
            />
            <p style={{ fontSize: "0.73rem", color: "var(--muted)", marginTop: "0.35rem" }}>
              Holen unter{" "}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>
                console.anthropic.com
              </a>
              {" "}→ API Keys → Create Key. Wird nur in deinem Browser gespeichert.
            </p>
          </div>

          {error && (
            <p style={{ color: "var(--hot)", fontSize: "0.82rem", margin: "0.5rem 0" }}>⚠️ {error}</p>
          )}

          <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.5 : 1 }}>
            {loading ? "Prüfe…" : "Einloggen →"}
          </button>
        </form>
      </div>
    </main>
  );
}

// ─── Settings Modal ──────────────────────────────────────
function SettingsModal({ onClose, currentKey, onSave }: { onClose: () => void; currentKey: string; onSave: (k: string) => void }) {
  const [key, setKey] = useState(currentKey);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
      <div style={{ ...card, width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <span style={{ fontWeight: 700 }}>⚙️ Einstellungen</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "1.3rem", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginBottom: "0.4rem" }}>
          Claude API Key
        </label>
        <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="sk-ant-api03-..." style={inputStyle} />
        <p style={{ fontSize: "0.73rem", color: "var(--muted)", marginTop: "0.35rem", marginBottom: "0.75rem" }}>
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>console.anthropic.com</a> → API Keys
        </p>
        <button
          onClick={() => { localStorage.setItem("desi_apikey", key); onSave(key); onClose(); }}
          style={{ ...btnPrimary, marginTop: 0 }}
        >
          Speichern
        </button>
      </div>
    </div>
  );
}

// ─── Haupt-App ───────────────────────────────────────────
function App() {
  const [query, setQuery]       = useState("");
  const [status, setStatus]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<Result | null>(null);
  const [error, setError]       = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey]     = useState(() => typeof window !== "undefined" ? localStorage.getItem("desi_apikey") || "" : "");
  const inputRef = useRef<HTMLInputElement>(null);

  function logout() { localStorage.removeItem("desi_auth"); window.location.reload(); }

  async function doSearch() {
    const q = query.trim();
    if (!q || loading) return;
    if (!apiKey) { setError("Bitte zuerst den Claude API Key in den Einstellungen (⚙️) eintragen."); return; }
    setLoading(true); setStatus("Verbinde…"); setResult(null); setError("");
    try {
      const res = await fetch("/api/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, apiKey }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
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
    } catch (err) { setError((err as Error).message); setLoading(false); }
  }

  const suggestions = ["Rückenschmerzen Erfahrungen", "Webdesign Kosten", "Physiotherapie Wien", "Steuerberater Empfehlung", "Elektriker Preise Österreich"];

  return (
    <main style={{ minHeight: "100vh", padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      {showSettings && <SettingsModal currentKey={apiKey} onSave={setApiKey} onClose={() => setShowSettings(false)} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.8rem,4vw,2.5rem)", background: "linear-gradient(135deg,#a855f7,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Desi Scout
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Durchsucht öffentliche Foren &amp; fasst Diskussionen zusammen
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setShowSettings(true)} style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 10, padding: "0.5rem 0.9rem", fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
            ⚙️ API Key
          </button>
          <button onClick={logout} style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 10, padding: "0.5rem 0.9rem", fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit" }}>
            Abmelden
          </button>
        </div>
      </div>

      {/* Suchbox */}
      <div style={{ ...card, marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input
            ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
            placeholder='z.B. "Rückenschmerzen Physiotherapie" oder "Webdesign Kosten Erfahrungen"'
            disabled={loading} style={{ ...inputStyle, flex: 1 }}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
          <button onClick={doSearch} disabled={loading || !query.trim()} style={{ background: loading || !query.trim() ? "rgba(168,85,247,0.3)" : "linear-gradient(135deg,#a855f7,#6366f1)", color: "white", border: "none", borderRadius: 10, padding: "0.75rem 1.4rem", fontSize: "0.95rem", fontWeight: 600, cursor: loading || !query.trim() ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            {loading ? "Läuft…" : "🔍 Suchen"}
          </button>
        </div>
        <div style={{ marginTop: "0.85rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => { setQuery(s); inputRef.current?.focus(); }}
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 999, padding: "0.28rem 0.75rem", fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--surface)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)", animation: "pulse 1.2s infinite" }} />
          <span style={{ color: "var(--accent)", fontSize: "0.9rem", fontWeight: 500 }}>{status}</span>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
        </div>
      )}

      {/* Fehler */}
      {error && (
        <div style={{ background: "rgba(255,71,87,.08)", border: "1px solid rgba(255,71,87,.25)", borderRadius: 12, padding: "1rem 1.25rem", color: "var(--hot)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Ergebnis */}
      {result && (
        <div>
          <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Ergebnis für</span>
            <span style={{ background: "rgba(168,85,247,.15)", border: "1px solid rgba(168,85,247,.3)", borderRadius: 999, padding: "0.2rem 0.75rem", fontSize: "0.82rem", color: "var(--accent)", fontWeight: 600 }}>
              {result.query}
            </span>
          </div>

          <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "0.6rem" }}>🤖 KI-Zusammenfassung</div>
          <div style={{ background: "var(--surface)", border: "1px solid rgba(168,85,247,.25)", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}
            dangerouslySetInnerHTML={{ __html: result.summary }} />

          {result.sources.length > 0 && (
            <>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "0.6rem" }}>
                📋 Quellen ({result.sources.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "0.65rem" }}>
                {result.sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "block", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem 1.1rem", textDecoration: "none", transition: "border-color .2s" }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = "rgba(168,85,247,.5)")}
                    onMouseOut={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                    <div style={{ fontSize: "0.68rem", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.3rem" }}>
                      {s.source}{!s.hasContent && <span style={{ color: "var(--muted)", marginLeft: "0.4rem" }}>· kein Zugriff</span>}
                    </div>
                    <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.3rem", lineHeight: 1.4 }}>{s.title}</div>
                    {s.snippet && <div style={{ fontSize: "0.76rem", color: "var(--muted)", lineHeight: 1.5 }}>{s.snippet}</div>}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!loading && !result && !error && (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--muted)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💬</div>
          <p style={{ fontSize: "0.95rem" }}>Thema eingeben und auf <strong style={{ color: "var(--text)" }}>Suchen</strong> klicken.</p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>Der Scout durchsucht Foren &amp; fasst zusammen, was diskutiert wird.</p>
        </div>
      )}

      <style>{`
        [dangerouslySetInnerHTML] h3, div[dangerouslySetInnerHTML] h3 { display:block }
        div > div h3 { font-family:'DM Sans',sans-serif; font-size:.95rem; font-weight:700; color:var(--accent); margin:1rem 0 .35rem }
        div > div h3:first-child { margin-top:0 }
        div > div p { font-size:.88rem; line-height:1.65; color:var(--text); margin-bottom:.5rem }
        div > div ul { padding-left:1.2rem; margin-bottom:.75rem }
        div > div li { font-size:.88rem; line-height:1.65; color:var(--text); margin-bottom:.25rem }
        div > div strong { color:var(--accent) }
        div > div em { color:var(--muted) }
      `}</style>
    </main>
  );
}

// ─── Root – Login Gate ───────────────────────────────────
export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAuthed(localStorage.getItem("desi_auth") === "1");
    setChecked(true);
  }, []);

  if (!checked) return null;
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;
  return <App />;
}
