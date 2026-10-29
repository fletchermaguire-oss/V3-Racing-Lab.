
/* Racing Lab — Live Airtable Research Bridge */
(() => {
  "use strict";

  const cache = new Map();
  let requestId = 0;

  const normalize = value =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const lines = value =>
    Array.isArray(value)
      ? value.filter(Boolean)
      : String(value || "")
          .split(/\n+/)
          .map(x => x.trim())
          .filter(Boolean);

  function raceIdFromUI(id) {
    const match = String(id || "").match(/^(.+)_R(\d+)$/);
    if (!match) return null;

    const records = window.RacingLabApp?.data?.records ||
                    window.DATA?.records || [];

    const race = match[1].toUpperCase();
    const number = match[2].padStart(2, "0");

    const dated = records.find(r =>
      r.race === id &&
      /^\d{4}-\d{2}-\d{2}_/.test(r.raceId || "")
    );

    if (dated) return dated.raceId;

    // Do not guess a meeting date from the current calendar.
    const meetingDate =
      window.RacingLabApp?.data?.meetingDate ||
      window.DATA?.meetingDate;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(meetingDate || ""))
      return null;

    return `${meetingDate}_${race}_R${number}`;
  }

  async function loadResearch(raceId) {
    if (cache.has(raceId)) return cache.get(raceId);

    const response = await fetch(
      `/api/runner-research?raceId=${encodeURIComponent(raceId)}`,
      { cache: "no-store" }
    );

    if (!response.ok)
      throw new Error(`Research API returned ${response.status}`);

    const data = await response.json();
    cache.set(raceId, data.runners || []);
    return data.runners || [];
  }

  function replaceSection(card, heading, values) {
    const blocks = [...card.querySelectorAll(".ev2-item")];

    const block = blocks.find(item =>
      item.querySelector("strong")?.textContent
        ?.trim().toUpperCase() === heading
    );

    if (!block) return;

    block.querySelectorAll("p").forEach(p => p.remove());

    const flag = block.querySelector(".ev2-flag");
    if (flag) flag.textContent = "VERIFIED AIRTABLE RESEARCH";

    values.forEach(value => {
      const p = document.createElement("p");
      p.textContent = value;
      block.appendChild(p);
    });
  }

  async function update() {
    const board = document.querySelector("#screen .hu-board");
    const race = document.querySelector(
      '[data-change="race-jump"]'
    )?.value;

    if (!board || !race) return;

    const cards = [...board.querySelectorAll(".ev2-card")];
    if (!cards.length) return;

    const fullRaceId = raceIdFromUI(race);
    if (!fullRaceId) return;

    const currentRequest = ++requestId;

    try {
      const runners = await loadResearch(fullRaceId);
      if (currentRequest !== requestId) return;

      for (const card of cards) {
        const name = card.querySelector(".ev2-head b")
          ?.textContent?.trim();

        const runner = runners.find(r =>
          normalize(r.horse) === normalize(name)
        );

        if (!runner) continue;

        const positives = lines(runner.positives);
        const negatives = lines(runner.negatives);

        if (positives.length)
          replaceSection(card, "WHY IT CAN WIN", positives);

        if (negatives.length)
          replaceSection(card, "WHAT CAN BEAT IT", negatives);

        const flag = card.querySelector(".ev2-head .ev2-flag");
        if (flag && (positives.length || negatives.length))
          flag.textContent = "LIVE RESEARCH AVAILABLE";
      }
    } catch (error) {
      console.warn("Racing Lab research unavailable:", error);
    }
  }

  const observer = new MutationObserver(() => {
    if (observer.timer) clearTimeout(observer.timer);
    observer.timer = setTimeout(update, 250);
  });

  function start() {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    update();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start);
  else
    start();
})();
