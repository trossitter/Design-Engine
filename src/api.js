// Foundry is live-only. The Anthropic key stays on the server; this client
// knows only the public backend origin.
export const ADAPTER = 'LIVE';

const configuredOrigin = String(globalThis.FOUNDRY_API_ORIGIN || '').replace(/\/$/, '');
const localOrigin = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:8787' : '';
export const LIVE_ORIGIN = configuredOrigin || localOrigin;
export const LIVE_ENDPOINT = LIVE_ORIGIN ? `${LIVE_ORIGIN}/generate-page` : '';

export async function planPage(payload) {
  const result = await request(toGeneratePageRequest({
    ...payload,
    options: { ...(payload.options || {}), dryRunPlanOnly: true }
  }));
  return { ...result, plan: normalizePlan(result.plan) };
}

export async function generatePage(payload, onProgress = () => {}) {
  const labels = payload.mode === 'section'
    ? ['Reading your design', 'Generating the section', 'Opening a draft PR']
    : payload.mode === 'tweak'
      ? ['Reading the target', 'Applying your change', 'Running the self-check', 'Opening a draft PR']
      : ['Reading your inputs', 'Using your approved plan', 'Building sections in parallel', 'Running the self-check', 'Opening one draft PR'];
  let active = 0;
  onProgress(active, labels);
  const timer = setInterval(() => {
    active = Math.min(active + 1, labels.length - 1);
    onProgress(active, labels);
  }, 4500);
  try {
    return normalizeResult(await request(toGeneratePageRequest(payload)));
  } finally {
    clearInterval(timer);
  }
}

export function normalizeResult(result) {
  const sections = result.sections || [];
  const sectionScores = result.scorecard?.sections || sections.map((section) => {
    const card = section.scorecard || {};
    const issues = card.issues || [];
    return {
      sectionType: section.sectionType,
      score: card.score ?? 0,
      pass: card.pass ?? issues.length === 0,
      flags: card.flags || issues.map((issue) => typeof issue === 'string' ? issue : issue.message).filter(Boolean),
      fidelity: card.fidelity || (card.score >= 90 ? 'High' : 'Review'),
      iterations: card.iterations || [],
      critique: card.critique || ''
    };
  });
  const rawFailures = result.scorecard?.failures;
  const failures = Number.isFinite(rawFailures)
    ? rawFailures
    : Array.isArray(rawFailures)
      ? rawFailures.length
      : sectionScores.filter((row) => !row.pass).length;
  const prNumber = result.prNumber || result.prUrl?.match(/\/pull\/(\d+)/)?.[1] || null;
  return {
    ...result,
    prNumber,
    plan: normalizePlan(result.plan),
    sections,
    warnings: result.warnings || [],
    scorecard: {
      ...result.scorecard,
      pageScore: result.scorecard?.pageScore ?? result.scorecard?.score ?? 0,
      failures,
      sections: sectionScores
    }
  };
}

export function normalizePlan(plan) {
  return Array.isArray(plan) ? { sections: plan } : { ...(plan || {}), sections: plan?.sections || [] };
}

function oneSectionPlan(payload) {
  const tweak = payload.mode === 'tweak';
  return {
    summary: tweak ? 'Apply the requested change to the supplied target.' : 'Recreate the supplied section design.',
    audience: 'Page visitors', goal: tweak ? 'Make the requested targeted update.' : 'Ship one polished section.',
    sections: [{
      sectionType: tweak ? 'targeted-update' : 'quick-section', eyebrow: '',
      headline: payload.pageName || (tweak ? 'Targeted update' : 'Quick section'),
      intent: tweak ? 'Apply only the requested copy and layout change.' : 'Recreate the supplied finished design.',
      sourceNotes: [], claims: [], visualDirection: 'Follow the supplied visual source closely.'
    }],
    decisions: [], facts: [], risks: [], incompleteCopy: [], references: []
  };
}

export function toGeneratePageRequest(payload) {
  const plan = payload.plan?.sections?.length
    ? payload.plan
    : payload.mode && payload.mode !== 'page'
      ? oneSectionPlan(payload)
      : undefined;
  return {
    pageName: payload.pageName,
    ...(payload.slug ? { slug: payload.slug } : {}),
    intake: payload.intake,
    options: payload.options || {},
    ...(plan ? { plan } : {})
  };
}

async function request(body) {
  if (!LIVE_ENDPOINT) {
    throw new Error('Foundry’s live backend is not configured for this site. Set FOUNDRY_API_ORIGIN to the deployed backend URL.');
  }
  const response = await fetch(LIVE_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || `Generation failed (${response.status})`);
  return data;
}
