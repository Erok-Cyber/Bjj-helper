import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type WeeklyPriority = {
  title: string;
  why: string;
  drills: string[];
  live_goal: string;
  techniques: string[];
  systems: string[];
};

type WeeklyPlan = {
  summary: string;
  patterns: { theme: string; evidence: string; count: number }[];
  priorities: WeeklyPriority[];
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const publishable = getPublishableKey();
    const client = createClient(supabaseUrl, publishable, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured" }, 503);

    const body = await req.json().catch(() => ({}));
    const today = validDate(String(body?.today || "")) ? String(body.today) : new Date().toISOString().slice(0, 10);
    const locale = String(body?.locale || "en").slice(0, 24);
    const targetWeekStart = targetMonday(today);
    const sourceWeekStart = addDays(targetWeekStart, -7);
    const sourceWeekEnd = minDate(addDays(targetWeekStart, -1), today);
    const previousWeekStart = addDays(sourceWeekStart, -7);
    const previousWeekEnd = addDays(sourceWeekStart, -1);

    const [profileRes, sessionsRes, previousRes, techniquesRes, flowsRes] = await Promise.all([
      client.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      client.from("sessions").select("*").gte("trained_at", sourceWeekStart).lte("trained_at", sourceWeekEnd).order("trained_at", { ascending: true }),
      client.from("sessions").select("*").gte("trained_at", previousWeekStart).lte("trained_at", previousWeekEnd).order("trained_at", { ascending: true }),
      client.from("techniques").select("*").order("updated_at", { ascending: false }).limit(100),
      client.from("flows").select("*").order("updated_at", { ascending: false }).limit(12),
    ]);

    const dbError = profileRes.error || sessionsRes.error || previousRes.error || techniquesRes.error || flowsRes.error;
    if (dbError) throw dbError;

    const sessions = sessionsRes.data || [];
    if (!sessions.length) {
      return json({
        error: "Not enough session data",
        message: "Log at least one session in the source week before generating a weekly focus.",
        source_week_start: sourceWeekStart,
        source_week_end: sourceWeekEnd,
        week_start: targetWeekStart,
      }, 422);
    }

    const techniques = techniquesRes.data || [];
    const techniqueById = new Map(techniques.map((t: any) => [String(t.id), t]));
    const compactSessions = sessions.map((s: any) => ({
      date: s.trained_at,
      mode: s.mode,
      format: s.session_type,
      minutes: s.duration_min,
      rounds: s.rounds,
      positional_rounds: s.positional_rounds,
      rating: s.rating,
      focus: s.focus_position,
      notes: s.notes,
      what_worked: s.what_worked,
      what_failed: s.what_failed,
      next_focus: s.next_focus,
      techniques: (s.technique_ids || []).map((id: string) => techniqueById.get(String(id))?.name).filter(Boolean),
    }));

    const previousSessions = (previousRes.data || []).map((s: any) => ({
      date: s.trained_at,
      rating: s.rating,
      focus: s.focus_position,
      notes: s.notes,
      what_worked: s.what_worked,
      what_failed: s.what_failed,
      next_focus: s.next_focus,
    }));

    const techniqueContext = techniques.map((t: any) => ({
      name: t.name,
      category: t.category,
      position: t.position,
      confidence: t.confidence,
      drilled: t.drilling_count,
      a_game: t.is_favorite,
      drill_queue: t.in_drill_queue,
      tags: t.tags,
    }));

    const flowContext = (flowsRes.data || []).map((f: any) => ({
      name: f.name,
      description: f.description,
      tags: f.tags,
      nodes: Array.isArray(f.nodes) ? f.nodes.map((n: any) => String(n?.data?.label || "")).filter(Boolean) : [],
    }));

    const context = {
      athlete: profileRes.data ? {
        belt: profileRes.data.belt,
        stripes: profileRes.data.stripes,
        weekly_session_goal: profileRes.data.weekly_session_goal,
        current_focus: profileRes.data.focus_position,
        competition_date: profileRes.data.competition_date,
        competition_target: profileRes.data.competition_weight,
      } : {},
      target_week_start: targetWeekStart,
      source_week: { start: sourceWeekStart, end: sourceWeekEnd, sessions: compactSessions },
      previous_week: { start: previousWeekStart, end: previousWeekEnd, sessions: previousSessions },
      techniques: techniqueContext,
      systems: flowContext,
    };

    const safeContext = JSON.stringify(context).slice(0, 30000);
    const instructions = `You are the weekly planning engine inside a Brazilian Jiu-Jitsu training journal.

Your task is to synthesize the athlete's own written session notes into a focused plan for the coming week.

Rules:
- Treat notes, what_failed, what_worked and next_focus as important first-person evidence.
- Detect recurring concepts even when phrased differently. Example: "hard to pass guard", "stuck in open guard", and "couldn't get around the legs" may indicate a guard-passing theme.
- Prefer repeated themes across multiple sessions. A single note can still matter, but label it as a one-off signal rather than a recurring pattern.
- Cross-check note themes against techniques, confidence scores, drill queue, A-game and gameplan systems.
- Do not invent events, techniques, wins, failures or counts.
- Do not diagnose injuries.
- Recommend no more than 3 priorities. Prefer depth over collecting new techniques.
- A priority should be executable during normal BJJ classes: specific drilling ideas and one live-round goal.
- If a matching Library technique or system exists, use its exact name. Do not claim a match if none exists.
- Output concise, plain language appropriate for the user's locale (${locale}). If the notes are mostly Swedish, write Swedish.
- Keep summary to 1-2 short sentences.
- Keep each "why" to one short sentence.
- Return no more than 2 drills per priority.
- Avoid generic motivational filler and AI-sounding phrasing.
- Every JSON string value must be plain text only: no Markdown symbols, no **bold**, no asterisks, no headings, no code formatting.
- Return VALID JSON ONLY. No markdown and no code fences.

Required JSON:
{
  "summary": "1-2 short sentences about the week and next focus",
  "patterns": [
    {"theme":"short theme","evidence":"brief paraphrase of the logged evidence","count":2}
  ],
  "priorities": [
    {
      "title":"specific weekly focus",
      "why":"why this priority follows from the log",
      "drills":["drill idea 1","drill idea 2"],
      "live_goal":"one measurable goal for sparring/positional rounds",
      "techniques":["exact matching Library technique names only"],
      "systems":["exact matching system names only"]
    }
  ]
}

Athlete context:
${safeContext}`;

    const response = await fetch("https://api.groq.com/openai/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        instructions,
        input: "Create the weekly focus plan now.",
        max_output_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Groq error", response.status, detail.slice(0, 800));
      return json({ error: "AI provider error" }, 502);
    }

    const responseData = await response.json();
    const outputText = (responseData.output || [])
      .flatMap((item: any) => item.content || [])
      .filter((part: any) => part.type === "output_text")
      .map((part: any) => part.text)
      .join("\n") || responseData.output_text || "";

    const plan = parsePlan(outputText);
    const row = {
      user_id: user.id,
      week_start: targetWeekStart,
      source_week_start: sourceWeekStart,
      source_week_end: sourceWeekEnd,
      summary: plan.summary,
      patterns: plan.patterns,
      priorities: plan.priorities,
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error: saveError } = await client
      .from("weekly_focuses")
      .upsert(row, { onConflict: "user_id,week_start" })
      .select("*")
      .single();

    if (saveError) throw saveError;

    return json({ focus: saved }, 200);
  } catch (error) {
    console.error(error);
    return json({ error: "Unexpected server error" }, 500);
  }
});

function parsePlan(raw: string): WeeklyPlan {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI did not return JSON");
  const parsed = JSON.parse(raw.slice(start, end + 1));
  const patterns = Array.isArray(parsed.patterns) ? parsed.patterns.slice(0, 6).map((p: any) => ({
    theme: cleanPlainText(String(p?.theme || "")).slice(0, 120),
    evidence: cleanPlainText(String(p?.evidence || "")).slice(0, 500),
    count: Math.max(1, Number(p?.count || 1)),
  })).filter((p: any) => p.theme) : [];
  const priorities = Array.isArray(parsed.priorities) ? parsed.priorities.slice(0, 3).map((p: any) => ({
    title: cleanPlainText(String(p?.title || "")).slice(0, 160),
    why: cleanPlainText(String(p?.why || "")).slice(0, 700),
    drills: Array.isArray(p?.drills) ? p.drills.slice(0, 2).map((x: any) => cleanPlainText(String(x)).slice(0, 220)) : [],
    live_goal: cleanPlainText(String(p?.live_goal || "")).slice(0, 350),
    techniques: Array.isArray(p?.techniques) ? p.techniques.slice(0, 6).map((x: any) => String(x).slice(0, 160)) : [],
    systems: Array.isArray(p?.systems) ? p.systems.slice(0, 4).map((x: any) => String(x).slice(0, 160)) : [],
  })).filter((p: any) => p.title) : [];
  return {
    summary: cleanPlainText(String(parsed.summary || "")).slice(0, 1500),
    patterns,
    priorities,
  };
}

function cleanPlainText(value: string) {
  return String(value || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/[`*_#]/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function targetMonday(today: string) {
  const d = new Date(today + "T12:00:00Z");
  const day = d.getUTCDay();
  const add = day === 1 ? 0 : (8 - day) % 7;
  return addDays(today, add);
}

function addDays(value: string, days: number) {
  const d = new Date(value + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function minDate(a: string, b: string) {
  return a < b ? a : b;
}

function getPublishableKey() {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  const single = Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (single) return single;
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (raw) return JSON.parse(raw).default;
  throw new Error("No Supabase publishable key configured");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
