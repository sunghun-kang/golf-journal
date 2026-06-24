// Supabase Edge Function: polish
// 가족앱 "✨ 꾸미기" — Claude(Anthropic)로 글을 다듬어 돌려줍니다.
// 배포: Supabase 대시보드 → Edge Functions → Deploy a new function → 이름 'polish' → 아래 코드 붙여넣기 → Deploy
// 비밀키: 대시보드 → Edge Functions → Secrets 에 ANTHROPIC_API_KEY 추가

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const { text } = await req.json();
    if (!text || !String(text).trim()) return json({ error: "내용이 없습니다." }, 400);

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "ANTHROPIC_API_KEY 미설정" }, 500);

    const prompt =
      "다음은 가족에게 남기는 글입니다. 글쓴이의 뜻과 진심은 그대로 두되, " +
      "맞춤법과 띄어쓰기를 바로잡고, 과하거나 거친 표현은 부드럽고 따뜻하게 다듬어 주세요. " +
      "새로운 내용을 지어내지 말고 길이는 비슷하게 유지하세요. " +
      "설명 없이 '다듬은 글'만 출력하세요.\n\n[원문]\n" + String(text);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const j = await r.json();
    if (!r.ok) return json({ error: "AI 호출 실패", detail: j }, 502);
    const result = j?.content?.[0]?.text ?? "";
    return json({ result });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
