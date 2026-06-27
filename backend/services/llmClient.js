function parseJsonFromContent(content) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

async function callOpenAI(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error("Service LLM non configuré (OPENAI_API_KEY manquante).");
    err.status = 503;
    throw err;
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch {}
    const code = body?.error?.code || "";
    console.error(`[LLM] OpenAI ${res.status} (${code}):`, body?.error?.message || "");
    const msg =
      code === "insufficient_quota"
        ? "Quota OpenAI épuisé. Rechargez votre crédit sur platform.openai.com/settings/billing."
        : code === "invalid_api_key"
        ? "Clé OpenAI invalide. Vérifiez OPENAI_API_KEY dans backend/.env."
        : `Erreur OpenAI (${res.status}${code ? ` – ${code}` : ""}).`;
    const err = new Error(msg);
    err.status = 502;
    throw err;
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error("Réponse LLM vide.");
    err.status = 502;
    throw err;
  }

  return parseJsonFromContent(content);
}

/**
 * Point d'entrée LLM extensible (OpenAI par défaut ; autres providers via LLM_PROVIDER).
 */
async function callLLM(systemPrompt, userPrompt) {
  const provider = (process.env.LLM_PROVIDER || "openai").toLowerCase();

  if (provider === "openai") {
    return callOpenAI(systemPrompt, userPrompt);
  }

  const err = new Error(`Fournisseur LLM non supporté : ${provider}. Utilisez LLM_PROVIDER=openai.`);
  err.status = 503;
  throw err;
}

module.exports = { callLLM, parseJsonFromContent };
