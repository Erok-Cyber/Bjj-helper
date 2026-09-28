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
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return json({ error: "Unauthorized" }, 401);

    const { text } = await req.json();
    const source = String(text || "").trim().slice(0,24000);
    if (!source) return json({ error: "Notes are required" }, 400);
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured" }, 503);

    const instructions = [
      "Extract Brazilian Jiu-Jitsu techniques from messy personal notes.",
      "Return ONLY a valid JSON array. Do not add commentary.",
      "Each item must have: name, category, position, giMode, notes, tags, confidence.",
      "category must be one of Takedown, Guard, Pass, Sweep, Escape, Submission, Control, Defense, Transition, Other.",
      "giMode must be Gi, No-Gi, or Both.",
      "confidence is an integer 1-5; default to 2 unless the notes clearly indicate confidence.",
      "tags is an array of short lowercase strings.",
      "Keep useful execution cues in notes. Do not invent details absent from the source.",
      "Merge obvious duplicates. Maximum 40 items."
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method:"POST",
      headers:{ Authorization:"Bearer " + apiKey, "Content-Type":"application/json" },
      body:JSON.stringify({ model:"gpt-5.6-luna", instructions, input:source, max_output_tokens:2500 })
    });
    if(!response.ok) return json({error:"AI import failed"},502);
    const data=await response.json();
    const out=outputText(data).replace(/^\`\`\`(?:json)?/i,"").replace(/\`\`\`$/,"").trim();
    const techniques=JSON.parse(out);
    return json({techniques:Array.isArray(techniques)?techniques:[]});
  } catch (error) {
    console.error(error);
    return json({ error: "Unexpected server error" }, 500);
  }
});

function outputText(data:any) {
  return (data.output || []).flatMap((i:any)=>i.content||[]).filter((p:any)=>p.type==="output_text").map((p:any)=>p.text).join("\n") || data.output_text || "";
}
function publishableKey() {
  const legacy=Deno.env.get("SUPABASE_ANON_KEY"); if(legacy)return legacy;
  const raw=Deno.env.get("SUPABASE_PUBLISHABLE_KEYS"); if(raw)return JSON.parse(raw).default;
  throw new Error("No Supabase publishable key");
}
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}})}
