
const BASE = "appEBALFjxF1Uxqfj";
const TABLE = "tblgd0S8yuysxmsVk";

const fields = [
  "Runner ID",
  "Race ID",
  "Horse",
  "Recent form and class",
  "Distance and track evidence",
  "Sectionals and speed evidence",
  "Map and tempo position",
  "Strengths",
  "Weaknesses / contradictory evidence",
  "Missing evidence",
  "Official runner source URL",
  "Last checked at"
];

export default async function handler(request) {
  const token = process.env.AIRTABLE_PAT;

  if (!token) {
    return Response.json(
      { error: "AIRTABLE_PAT not configured" },
      { status: 503 }
    );
  }

  const raceId = new URL(request.url)
    .searchParams.get("raceId");

  if (!raceId || raceId.length > 120) {
    return Response.json(
      { error: "A valid raceId is required" },
      { status: 400 }
    );
  }

  try {
    const runners = [];
    let offset;

    do {
      const url = new URL(
        `https://api.airtable.com/v0/${BASE}/${TABLE}`
      );

      url.searchParams.set("pageSize", "100");
      url.searchParams.set(
        "filterByFormula",
        `{Race ID}="${raceId.replace(/["\\]/g, "")}"`
      );

      fields.forEach(field =>
        url.searchParams.append("fields[]", field)
      );

      if (offset) url.searchParams.set("offset", offset);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Airtable HTTP ${response.status}`);
      }

      const data = await response.json();

      for (const record of data.records || []) {
        const f = record.fields;

        runners.push({
          id: f["Runner ID"],
          raceId: f["Race ID"],
          horse: f["Horse"],
          positives: f["Strengths"] || "",
          negatives:
            f["Weaknesses / contradictory evidence"] || "",
          recentForm: f["Recent form and class"] || "",
          trackDistance:
            f["Distance and track evidence"] || "",
          sectionals:
            f["Sectionals and speed evidence"] || "",
          pace: f["Map and tempo position"] || "",
          missing: f["Missing evidence"] || "",
          source: f["Official runner source URL"] || "",
          checkedAt: f["Last checked at"] || null
        });
      }

      offset = data.offset;
    } while (offset && runners.length < 500);

    return Response.json({
      raceId,
      runners,
      count: runners.length,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Runner research error:", error);

    return Response.json(
      { error: "Unable to retrieve runner research" },
      { status: 502 }
    );
  }
}

export const config = {
  path: "/api/runner-research"
};
