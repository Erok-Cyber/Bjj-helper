import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);
    const client = createClient(Deno.env.get("SUPABASE_URL")!, publishableKey(), { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    let transcript = String(body?.text || "").trim();
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured" }, 503);

    if (!transcript && body?.audioBase64) {
      const bytes = Uint8Array.from(atob(String(body.audioBase64)), c => c.charCodeAt(0));
      const mime = String(body?.mimeType || "audio/webm");
      const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";
      const form = new FormData();
      form.append("file", new Blob([bytes], { type: mime }), "session." + ext);
      form.append("model", "gpt-transcribe");
      const tr = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST", headers: { Authorization: "Bearer " + apiKey }, body: form
      });
      if (!tr.ok) {
        console.error("transcription", tr.status, (await tr.text()).slice(0,500));
        return json({ error: "Transcription failed" }, 502);
      }
      const trData = await tr.json();
      transcript = String(trData.text || "").trim();
    }
    if (!transcript) return json({ error: "No speech or text received" }, 400);

    const techniques = Array.isArray(body?.techniques) ? body.techniques.slice(0,100) : [];
    const instructions = [
      "Convert a Brazilian Jiu-Jitsu training recap into one session JSON object.",
      "Use only facts stated in the recap. If unknown, use sensible neutral defaults: rating 4, counts 0, duration 90.",
      "Allowed mode: Gi or No-Gi.",
      "Allowed sessionType: Class + Sparring, Open Mat, Positional, Drilling.",
      "Match techniqueNames only to names in the supplied technique library; never invent a library match.",
      "Return ONLY valid JSON with keys: mode, sessionType, durationMin, rounds, positionalRounds, submissions, taps, rating, focusPosition, notes, partners, techniqueNames.",
      "rating must be integer 1-5. partners and techniqueNames must be arrays of strings.",
      "Technique library: " + JSON.stringify(techniques)
    ].join("\n");

    const parsed = await responseJson(apiKey, instructions, transcript);
    return json({ transcript, session: parsed });
  } catch (error) {
    console.error(error);
    return json({ error: "Unexpected server error" }, 500);
  }
});

async function responseJson(apiKey: string, instructions: string, input: string) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-5.6-luna", instructions, input, max_output_tokens: 700 })
  });
  if (!response.ok) throw new Error("AI parse failed");
  const data = await response.json();
  const text = outputText(data).replace(/^\`\`\`(?:json)?/i,"").replace(/\`\`\`$/,"").trim();
  return JSON.parse(text);
}
function outputText(data:any) {
  return (data.output || []).flatMap((i:any)=>i.content||[]).filter((p:any)=>p.type==="output_text").map((p:any)=>p.text).join("\n") || data.output_text || "";
}
function publishableKey() {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY"); if (legacy) return legacy;
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS"); if (raw) return JSON.parse(raw).default;
  throw new Error("No Supabase publishable key");
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
