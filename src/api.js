// One-line live switch for Phase 2. Track B Phase 1 intentionally stays mocked.
export const ADAPTER = 'MOCK';
export const LIVE_ENDPOINT = '/generate-page';

const pagePlan = [
  ['announcement-bar', 'Set campaign context and urgency'], ['hero', 'Lead with the product promise and primary CTA'],
  ['trust-bar', 'Establish credibility immediately'], ['benefits', 'Put scannable outcomes before mechanics'],
  ['how-it-works', 'Explain the daily routine'], ['ingredient-story', 'Show the hero ingredients and their roles'],
  ['science-results', 'Ground the story in measured outcomes'], ['comparison', 'Differentiate from common alternatives'],
  ['testimonials', 'Add specific customer proof'], ['faq', 'Resolve purchase objections'],
  ['final-cta', 'Repeat the offer with a clear next step'], ['compliance-note', 'Keep substantiation and review language visible']
].map(([sectionType, intent]) => ({ sectionType, intent }));

export async function planPage(payload) {
  if (ADAPTER === 'LIVE') {
    const result = await request(toGeneratePageRequest({ ...payload, options: { dryRunPlanOnly: true } }));
    return { ...result, plan: normalizePlan(result.plan) };
  }
  await pause(260);
  const sections = structuredClone(pagePlan);
  const testimonialIntent = payload.resourceContext?.testimonialIntent?.trim();
  if (testimonialIntent) {
    const testimonialSection = sections.find((section) => section.sectionType === 'testimonials');
    if (testimonialSection) testimonialSection.intent = `Feature approved testimonials for ${testimonialIntent}`;
  }
  return { plan: { sections } };
}

export async function generatePage(payload, onProgress = () => {}) {
  if (ADAPTER === 'LIVE') return normalizeResult(await request(toGeneratePageRequest(payload)));
  const progress = payload.mode === 'section'
    ? ['Reading your design', 'Generating the section (Liquid + styles)', 'Opening a pull request & preview']
    : payload.mode === 'tweak'
      ? ['Reading the target', 'Applying your change', 'Running the advisory self-check', 'Opening a pull request & preview']
      : ['Reading your inputs', 'Planning the page', 'Building sections in parallel', 'Running the advisory self-check', 'Opening one draft pull request'];
  for (let index = 0; index < progress.length; index += 1) { onProgress(index, progress); await pause(reducedMotion() ? 70 : 430); }
  const source = payload.mode === 'page' && payload.plan?.sections?.length ? payload.plan.sections : (payload.mode === 'page' ? pagePlan : quickPlan(payload.mode));
  const sections = source.map((spec, index) => makeSection(spec, index));
  const scorecardSections = sections.map((section, index) => ({ sectionType: section.sectionType, score: index === 5 ? 82 : 94 - (index % 3), pass: index !== 5, flags: index === 5 ? ['Image alt text needs review'] : [], fidelity: index === 5 ? 'Review' : 'High', iterations: [], critique: '' }));
  return {
    prNumber: 42, prUrl: 'https://github.com/trossitter/design-engine-sandbox/pull/42', branch: 'page-science-mock',
    slug: 'science', pageName: payload.pageName, plan: { sections: source }, sections,
    pageJson: JSON.stringify({ sections: Object.fromEntries(sections.map((s, i) => [`section_${i + 1}`, { type: s.sectionType }])), order: sections.map((_, i) => `section_${i + 1}`) }, null, 2),
    scorecard: { pageScore: 92, failures: 1, sections: scorecardSections }, warnings: ['Self-check is advisory; human compliance review remains required.']
  };
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
  }) || [];
  const failures = Number.isFinite(result.scorecard?.failures) ? result.scorecard.failures : sectionScores.filter((row) => !row.pass).length;
  const prNumber = result.prNumber || result.prUrl?.match(/\/pull\/(\d+)/)?.[1] || null;
  return {
    ...result,
    prNumber,
    plan: normalizePlan(result.plan),
    sections,
    warnings: result.warnings || [],
    scorecard: { ...result.scorecard, pageScore: result.scorecard?.pageScore ?? result.scorecard?.score ?? 0, failures, sections: sectionScores }
  };
}

export function normalizePlan(plan) {
  return Array.isArray(plan) ? { sections: plan } : { ...(plan || {}), sections: plan?.sections || [] };
}

export function toGeneratePageRequest(payload) {
  return { pageName: payload.pageName, ...(payload.slug ? { slug: payload.slug } : {}), intake: payload.intake, options: payload.options || {} };
}

async function request(body) {
  const response = await fetch(LIVE_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Generation failed (${response.status})`);
  return data;
}
function pause(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function reducedMotion() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
function quickPlan(mode) { return mode === 'tweak' ? [{ sectionType: 'targeted-update', intent: 'Apply the requested copy and layout change' }] : [{ sectionType: 'science-results', intent: 'Recreate the supplied finished design' }]; }
function makeSection(spec, index) {
  return { sectionType: spec.sectionType, files: [`sections/${spec.sectionType}.liquid`, `snippets/${spec.sectionType}.liquid`, `assets/${spec.sectionType}.css`], previewHtml: '', preview: { title: titleFor(spec.sectionType), body: spec.intent, variant: spec.sectionType === 'science-results' ? 'science' : index % 3 }, scorecard: null };
}
function titleFor(type) { return ({ hero: 'Feel like yourself, every day', benefits: 'Support for the whole day', 'science-results': 'Results you can feel after 30 days', testimonials: 'Built into better routines', 'final-cta': 'Make focus feel sustainable' })[type] || type.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' '); }
