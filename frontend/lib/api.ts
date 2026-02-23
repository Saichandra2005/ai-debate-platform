const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function apiPost(
  endpoint: string,
  body: any,
  token?: string
) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.error || "API error");
    (error as any).status = res.status;
    throw error;
  }

  return data;
}

export async function apiGet(endpoint: string, token?: string) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.error || "API error");
    (error as any).status = res.status;
    throw error;
  }

  return data;
}

export async function getDashboard(token: string) {
  return apiGet("/api/dashboard", token);
}

export async function apiDebateStream(
  topic: string,
  argument: string,
  token: string,
  onChunk: (text: string) => void,
  onComplete: (response: any) => void,
  onError: (error: Error) => void
) {
  try {
    const response = await fetch(`${API_BASE}/api/debate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topic, argument }),
    });

    if (!response.ok) {
      const data = await response.json();
      const error = new Error(data.error || "Failed to get AI response");
      (error as any).status = response.status;
      throw error;
    }

    const data = await response.json();

    // Simulate streaming by breaking response into chunks
    const aiResponse = data.ai_response || "";
    const words = aiResponse.split(" ");
    let accumulated = "";

    for (let i = 0; i < words.length; i++) {
      accumulated += (i > 0 ? " " : "") + words[i];
      onChunk(accumulated);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    onComplete(data);
  } catch (error) {
    onError(error as Error);
  }
}

export async function generateDebateSummary(
  topic: string,
  debateIds: string[],
  token: string
) {
  return apiPost(
    "/api/debate/summary",
    { topic, debate_ids: debateIds },
    token
  );
}

export async function getDebateSummary(summaryId: string, token: string) {
  return apiGet(`/api/debate/summary/${summaryId}`, token);
}

export async function getDebateHistory(debateId: string, token: string) {
  return apiGet(`/api/debate/history/${debateId}`, token);
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return await response.json();
  } catch (error) {
    console.error("Health check failed:", error);
    return { status: "unhealthy" };
  }
}