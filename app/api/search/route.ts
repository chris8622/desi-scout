import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const SERPER_API_KEY = process.env.SERPER_API_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

// ─── Types ───────────────────────────────────────────────
interface SerperResult {
  title: string;
  link: string;
  snippet: string;
}
interface Thread {
  title: string;
  url: string;
  source: string;
  snippet: string;
  content: string;
}

// ─── Serper Suche ────────────────────────────────────────
async function forumSearch(query: string): Promise<Thread[]> {
  const searches = [
    { q: `${query} forum diskussion erfahrungen`, gl: "at", hl: "de", num: 8 },
    { q: `${query} site:reddit.com`, gl: "at", hl: "de", num: 5 },
  ];

  const seen = new Set<string>();
  const results: Thread[] = [];

  for (const params of searches) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-KEY": SERPER_API_KEY },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      for (const item of (data.organic ?? []) as SerperResult[]) {
        if (!seen.has(item.link)) {
          seen.add(item.link);
          results.push({
            title: item.title,
            url: item.link,
            source: new URL(item.link).hostname.replace("www.", ""),
            snippet: item.snippet ?? "",
            content: "",
          });
        }
      }
    } catch {}
  }
  return results.slice(0, 12);
}

// ─── Seiten laden ────────────────────────────────────────
async function fetchContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DesiScout/1.0)", "Accept-Language": "de-AT,de;q=0.9" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
      .trim()
      .substring(0, 5000);
  } catch {
    return "";
  }
}

// ─── Claude Zusammenfassung ──────────────────────────────
async function summarize(query: string, threads: Thread[]): Promise<string> {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const context = threads
    .filter(t => t.content.length > 150)
    .slice(0, 8)
    .map((t, i) => `--- Quelle ${i + 1}: ${t.title} (${t.source}) ---\n${t.content.substring(0, 1500)}`)
    .join("\n\n");

  if (!context) {
    return `<p style="color:var(--muted)">Keine lesbaren Inhalte gefunden – die meisten Seiten blockieren automatische Zugriffe. Die Snippet-Vorschau der Quellen gibt trotzdem erste Hinweise.</p>`;
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1800,
    messages: [{
      role: "user",
      content: `Du analysierst Forum-Diskussionen zum Thema: "${query}"

Gesammelte Beiträge aus verschiedenen Foren:

${context}

Erstelle eine präzise Analyse auf Deutsch. Antworte in sauberem HTML mit <h3>, <p>, <ul><li> – kein <html>/<body>/<head>.

Struktur:
<h3>Kurzzusammenfassung</h3>
<p>3–4 Sätze: Was wird hauptsächlich diskutiert?</p>

<h3>Häufige Themen & Fragen</h3>
<ul><li>...</li></ul>

<h3>Stimmungsbild</h3>
<p>Positiv / Gemischt / Negativ + kurze Begründung</p>

<h3>Interessante Aussagen</h3>
<ul><li>"Zitat" – <em>Quelle</em></li></ul>

<h3>Mögliche Handlungsfelder</h3>
<ul><li>Was wünschen sich die Menschen? Was fehlt?</li></ul>`,
    }],
  });

  return (message.content[0] as { text: string }).text;
}

// ─── POST Handler (Streaming) ────────────────────────────
export async function POST(req: Request) {
  const { query } = await req.json();
  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: "Kein Suchbegriff" }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
      };

      try {
        // 1. Foren suchen
        send("status", "🔍 Durchsuche öffentliche Foren…");
        const threads = await forumSearch(query.trim());
        send("status", `📋 ${threads.length} Quellen gefunden – lade Inhalte…`);

        // 2. Inhalte parallel laden
        const loaded = await Promise.all(
          threads.map(async (t) => ({ ...t, content: await fetchContent(t.url) }))
        );
        const withContent = loaded.filter(t => t.content.length > 0).length;
        send("status", `🤖 ${withContent} Seiten geladen – KI analysiert…`);

        // 3. Zusammenfassung
        const summaryHtml = await summarize(query.trim(), loaded);

        // 4. Ergebnis senden
        send("result", {
          query: query.trim(),
          summary: summaryHtml,
          sources: loaded.map(t => ({
            title: t.title,
            url: t.url,
            source: t.source,
            snippet: t.snippet,
            hasContent: t.content.length > 150,
          })),
        });
      } catch (err) {
        send("error", (err as Error).message);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
