import category01 from "../FAQ-V2/category_01_working_extract.json" with { type: "json" };
import category02 from "../FAQ-V2/category_02_working_extract.json" with { type: "json" };
import category03 from "../FAQ-V2/category_03_working_extract.json" with { type: "json" };
import category04 from "../FAQ-V2/category_04_working_extract.json" with { type: "json" };
import category05 from "../FAQ-V2/category_05_working_extract.json" with { type: "json" };
import category06 from "../FAQ-V2/category_06_working_extract.json" with { type: "json" };
import category07 from "../FAQ-V2/category_07_working_extract.json" with { type: "json" };
import category08 from "../FAQ-V2/category_08_working_extract.json" with { type: "json" };

const CATEGORY_DATA = [
  category01,
  category02,
  category03,
  category04,
  category05,
  category06,
  category07,
  category08
];

export const FAQ_V2_SCENARIOS = CATEGORY_DATA.flatMap((category) =>
  Array.isArray(category?.scenarios) ? category.scenarios : []
);

export const FAQ_V2_SCENARIO_COUNT = FAQ_V2_SCENARIOS.length;

const STOP_WORDS = new Set([
  "anh", "chi", "ban", "minh", "toi", "em", "hay", "giup", "voi", "cho",
  "cua", "nhung", "duoc", "khong", "mot", "nay", "la", "co", "can", "ve",
  "the", "nao", "khi", "neu", "da", "dang", "voi", "robot", "lau", "nha"
]);

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function meaningfulTokens(value) {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
  );
}

function asStrings(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : [];
}

function scenarioSignals(scenario) {
  const recognition = scenario?.recognition || {};
  const testInputs = Array.isArray(scenario?.test_cases)
    ? scenario.test_cases
        .map((testCase) => testCase?.input)
        .filter((value) => typeof value === "string")
    : [];

  return [
    scenario?.user_question,
    scenario?.scenario,
    scenario?.intent,
    ...asStrings(scenario?.question_variants),
    ...asStrings(recognition.signals),
    ...asStrings(recognition.positive_signals),
    ...testInputs
  ].filter((value) => typeof value === "string" && value.trim());
}

function excludedSignals(scenario) {
  const recognition = scenario?.recognition || {};

  return [
    ...asStrings(recognition.exclude_if),
    ...asStrings(recognition.negative_signals)
  ];
}

function scoreScenario(message, scenario) {
  const normalizedMessage = normalizeText(message);
  const messageTokens = meaningfulTokens(message);
  let bestScore = 0;

  for (const signal of scenarioSignals(scenario)) {
    const normalizedSignal = normalizeText(signal);
    const signalTokens = meaningfulTokens(signal);
    const overlap = [...signalTokens].filter((token) => messageTokens.has(token));
    let score = overlap.length * 2;

    if (
      normalizedSignal.length >= 8 &&
      normalizedMessage.includes(normalizedSignal)
    ) {
      score += 12;
    }

    if (
      signalTokens.size >= 2 &&
      overlap.length === signalTokens.size
    ) {
      score += 4;
    }

    bestScore = Math.max(bestScore, score);
  }

  for (const signal of excludedSignals(scenario)) {
    const normalizedSignal = normalizeText(signal);

    if (
      normalizedSignal.length >= 10 &&
      normalizedMessage.includes(normalizedSignal)
    ) {
      bestScore -= 8;
    }
  }

  // Kịch bản 08.01 là luồng tư vấn tổng quát. Khi người dùng hỏi chọn
  // robot theo nhu cầu, ưu tiên luồng này thay vì suy ra một tiêu chí riêng
  // (ví dụ chỉ vì họ có nhắc đến loại sàn).
  if (
    String(scenario?.category_id || "") === "08" &&
    /\b(tu van|nen chon|chon robot)\b/.test(normalizedMessage)
  ) {
    bestScore += 12;
  }

  return bestScore;
}

export function findFaqV2Scenario(message) {
  const normalizedMessage = normalizeText(message);

  if (!normalizedMessage) return null;

  const candidates = FAQ_V2_SCENARIOS
    .map((scenario) => ({ scenario, score: scoreScenario(normalizedMessage, scenario) }))
    .filter((candidate) => candidate.score >= 4)
    .sort((a, b) => b.score - a.score);
  const best = candidates[0];

  if (!best) return null;

  return {
    ...best,
    ambiguous: candidates.filter((candidate) => candidate.score === best.score).length > 1
  };
}

function findScenarioById(scenarioId) {
  return FAQ_V2_SCENARIOS.find(
    (scenario) =>
      scenario.scenario_id === scenarioId ||
      scenario.branch_id === scenarioId
  ) || null;
}

function firstSentence(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(.+?[.!?])(?:\s|$)/);

  return match ? match[1] : text;
}

function firstClarification(scenario) {
  const flow = Array.isArray(scenario?.clarification_flow)
    ? scenario.clarification_flow[0]
    : null;

  return String(flow?.ask || flow?.question || "").trim();
}

function asksForBudget(message) {
  return /\b(ngan sach|gia|tam tien|trieu|dong)\b/.test(normalizeText(message));
}

function mentionsArea(message) {
  return /\b\d{1,4}\s*(m2|met vuong)\b/.test(normalizeText(message));
}

function selectClarification(scenario, message) {
  const categoryId = String(scenario?.category_id || "");

  if (
    categoryId === "08" &&
    !asksForBudget(message) &&
    mentionsArea(message)
  ) {
    return "Để tư vấn có căn cứ, bạn cho mình biết ngân sách dự kiến nhé?";
  }

  return firstClarification(scenario);
}

function isSafetyConcern(message) {
  return /\b(khoi|mui khet|qua nhiet|pin phong|vao nuoc|chay no)\b/.test(
    normalizeText(message)
  );
}

function makeInitialReply(scenario, message) {
  if (isSafetyConcern(message)) {
    return (
      "Nếu robot có khói, mùi khét, nóng bất thường, dấu hiệu vào nước " +
      "hoặc pin phồng, bạn nên dừng sử dụng và không tự tháo máy. " +
      "Hãy liên hệ kỹ thuật viên để kiểm tra an toàn."
    );
  }

  const strategy = firstSentence(scenario?.answer_strategy);
  const clarification = selectClarification(scenario, message);
  const introduction = strategy
    ? `Mình sẽ xử lý theo FAQ-V2: ${strategy}`
    : "Mình sẽ chỉ dùng thông tin đã xác minh để hỗ trợ bạn.";

  return clarification
    ? `${introduction}\n\n${clarification}`
    : introduction;
}

function makeContinuationReply(scenario) {
  const strategy = firstSentence(scenario?.answer_strategy);
  const flow = Array.isArray(scenario?.clarification_flow)
    ? scenario.clarification_flow[0]
    : null;
  const afterAnswer = String(flow?.if_answered || "").trim();
  const parts = [
    "Mình đã ghi nhận thông tin bạn vừa cung cấp và sẽ không suy đoán thông số, giá hoặc tình trạng hàng.",
    afterAnswer
      ? `Hướng xử lý tiếp theo: ${afterAnswer}`
      : strategy
        ? `Hướng xử lý tiếp theo: ${strategy}`
        : ""
  ];

  return parts.filter(Boolean).join("\n\n");
}

function makeCompletionReply(scenario) {
  const routing = scenario?.routing || {};
  const handoff = String(
    routing.handoff_message || routing.message || ""
  ).trim();
  const requirements = asStrings(scenario?.context_required).slice(0, 3);
  const parts = [
    "Mình đã ghi nhận phần bổ sung. Để tránh lặp lại câu trả lời hoặc suy đoán nguyên nhân, kịch bản này cần được đối chiếu với dữ liệu model hoặc tài liệu đã xác minh trước khi kết luận.",
    handoff
      ? `Bước tiếp theo: ${handoff}`
      : requirements.length
        ? `Khi cần đối chiếu thêm, thông tin hữu ích nhất là: ${requirements.join("; ")}.`
        : "Nếu bạn có câu hỏi mới, hãy nêu rõ model hoặc biểu hiện cần kiểm tra."
  ];

  return parts.filter(Boolean).join("\n\n");
}

function normalizedSession(session) {
  const scenarioId = String(session?.scenarioId || "").trim();
  const turn = Number(session?.turn || 0);

  if (!scenarioId || !Number.isInteger(turn) || turn < 1 || turn > 2) {
    return null;
  }

  const scenario = findScenarioById(scenarioId);

  return scenario ? { scenario, turn } : null;
}

export function handleFaqV2Message({ message, session }) {
  const match = findFaqV2Scenario(message);
  const activeSession = normalizedSession(session);

  // Một lượt trả lời cho câu hỏi làm rõ có thể tình cờ trùng vài từ với
  // kịch bản khác. Chỉ chuyển kịch bản giữa chừng khi tín hiệu mới đủ mạnh.
  const shouldStartFreshScenario =
    match &&
    (!activeSession ||
      match.scenario === activeSession.scenario ||
      (!match.ambiguous && match.score >= 16));

  if (
    shouldStartFreshScenario &&
    (!activeSession || match.scenario !== activeSession.scenario)
  ) {
    const scenarioId = match.scenario.scenario_id || match.scenario.branch_id;

    return {
      reply: makeInitialReply(match.scenario, message),
      scenarioId,
      score: match.score,
      session: { scenarioId, turn: 1 }
    };
  }

  if (activeSession) {
    const scenarioId =
      activeSession.scenario.scenario_id || activeSession.scenario.branch_id;

    if (activeSession.turn === 2) {
      return {
        reply: makeCompletionReply(activeSession.scenario),
        scenarioId,
        score: null,
        session: null
      };
    }

    return {
      reply: makeContinuationReply(activeSession.scenario),
      scenarioId,
      score: null,
      session: {
        scenarioId,
        turn: 2
      }
    };
  }

  return null;
}
