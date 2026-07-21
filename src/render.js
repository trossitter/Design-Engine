import { state, subscribe, setRoute, resetMode, setTheme, notify, contractIntake, resourceContext } from './state.js?v=resources-1';
import { routes, go, nextStep, startRouter } from './router.js?v=resources-1';
import { planPage, generatePage } from './api.js?v=resources-1';
import { intakeView } from './components/intake.js?v=resources-1';
import { reviewView } from './components/review.js?v=resources-1';
import { rankTestimonials } from './components/resources.js?v=resources-1';

const stage = document.querySelector('#stage');
const rail = document.querySelector('#step-rail');
const shell = document.querySelector('#shell');
const toast = document.querySelector('#toast');
let toastTimer;
const DEMO_BRIEF = `# Science landing page\n\n## Goal\nExplain how Stasis supports steadier energy and focus, then drive qualified visitors to learn more.\n\n## Audience\nPeople looking for sustainable daily support without overpromising.\n\n## Direction\nBenefits first. Feature the hero ingredients, measured outcomes, customer proof, FAQ, and a clear final CTA. Keep compliance language visible and avoid disease or treatment claims.`;

applyTheme();
subscribe(render);
startRouter((route) => { if (!route.valid) { setRoute(route); return; } setRoute(route); });
document.querySelector('#theme-toggle').addEventListener('click', () => { const cycle = ['system', 'light', 'dark']; setTheme(cycle[(cycle.indexOf(state.theme) + 1) % cycle.length]); applyTheme(); });

function render() {
  applyTheme();
  renderRail();
  if (!state.mode) stage.innerHTML = hubView();
  else if (!routes[state.mode]?.includes(state.step)) stage.innerHTML = document.querySelector('#empty-template').innerHTML;
  else stage.innerHTML = routeView();
  bindCommon();
}

function routeView() {
  const { mode, step } = state;
  if (mode === 'page' && step === 'brief') return intakeView();
  if (mode === 'page' && step === 'plan') return planView();
  if (mode === 'section' && step === 'design') return intakeView({ sectionOnly: true });
  if (mode === 'tweak' && step === 'target') return tweakTargetView();
  if (mode === 'tweak' && step === 'describe') return tweakDescribeView();
  if (step === 'build') return buildView();
  if (step === 'review') return state.result.mode === state.mode && state.result.sections.length ? reviewView(state) : missingRunView();
  if (step === 'publish') return state.result.mode === state.mode && state.result.sections.length ? publishedView() : missingRunView();
  return missingRunView();
}

function hubView() { return `<section class="surface hub-surface"><div class="hub-intro"><div class="forge-orbit" aria-hidden="true"><span></span><span></span><span></span></div><h1>What are we forging?</h1><p>Brief, frame, or reference in. Deploy-ready code out.</p></div><div class="hub">
  <a class="mode-card mode-card--flagship" href="#/page/brief"><span class="mode-card__icon" aria-hidden="true">✦</span><h2>Full Page</h2><p>Brief to complete landing page.</p><span class="mode-card__go">Light the forge <b>→</b></span></a>
  <a class="mode-card mode-card--quick" href="#/section/design"><span class="mode-card__icon" aria-hidden="true">▣</span><h2>Quick Section</h2><p>Finished frame to store-ready section.</p><span class="mode-card__go">Make a section <b>→</b></span></a>
  <a class="mode-card mode-card--tweak" href="#/tweak/target"><span class="mode-card__icon" aria-hidden="true">↝</span><h2>Tweak in words</h2><p>Describe the change.</p><span class="mode-card__go">Refine a page <b>→</b></span></a>
  </div></section>`; }

function planView() { return `<a class="crumb" href="#/page/brief">← Back to the inputs</a><section class="surface"><p class="eyebrow">Full page · Plan</p><h1 class="step-h">Page blueprint</h1><div class="plan-vibe"><span><b>${state.plan.sections.length}</b> sections</span></div><div class="plan-list">${state.plan.sections.map((s, i) => `<div class="plan-row"><div class="plan-move"><button data-plan-move="${i}" data-direction="up" aria-label="Move ${escapeAttr(s.sectionType)} up" ${i === 0 ? 'disabled' : ''}>↑</button><button data-plan-move="${i}" data-direction="down" aria-label="Move ${escapeAttr(s.sectionType)} down" ${i === state.plan.sections.length - 1 ? 'disabled' : ''}>↓</button></div><input data-plan-type="${i}" aria-label="Section ${i + 1} type" value="${escapeAttr(s.sectionType)}"><input data-plan-intent="${i}" aria-label="Section ${i + 1} intent" value="${escapeAttr(s.intent)}"><button class="plan-remove" data-plan-remove="${i}" aria-label="Remove ${escapeAttr(s.sectionType)}">×</button></div>`).join('')}</div><div class="actions"><button class="btn btn--ghost" id="add-section">+ Add a section</button><button class="btn btn--primary" id="build-page" ${state.plan.sections.length ? '' : 'disabled'}>Start forging →</button></div></section>`; }

function tweakTargetView() { return `<a class="crumb" href="#/">← All modes</a><section class="surface"><p class="eyebrow">Tweak · Target</p><h1 class="step-h">What should change?</h1><div class="field"><label class="lbl" for="target-url">Page or preview URL</label><input id="target-url" type="url" value="${escapeAttr(state.intake.referenceUrl)}" placeholder="https://preview.example.com/page"></div><div class="actions"><button class="btn btn--primary" id="target-next" ${state.intake.referenceUrl ? '' : 'disabled'}>Describe the tweak →</button></div></section>`; }
function tweakDescribeView() { return `<a class="crumb" href="#/tweak/target">← Target</a><section class="surface"><p class="eyebrow">Tweak · Describe</p><h1 class="step-h">Describe the change</h1><div class="field"><label class="lbl" for="tweak-text">Change request</label><textarea id="tweak-text" placeholder="Tighten the mobile spacing and make the CTA more direct.">${escapeHtml(state.intake.freeText)}</textarea></div><div class="actions"><button class="btn btn--primary" id="tweak-build" ${state.intake.freeText ? '' : 'disabled'}>Build update →</button></div></section>`; }
function buildView() { return `<section class="surface build-surface"><div class="build-glyph" aria-hidden="true"><span></span><span></span><span></span></div><p class="eyebrow">${labelMode(state.mode)} · Build</p><h1 class="step-h">${state.job.status === 'error' ? 'The forging paused.' : 'Forging your page…'}</h1><ul class="steps">${state.job.steps.map((s) => `<li class="pstep ${s.state}"><span class="dot">${s.state === 'done' ? '✓' : s.state === 'error' ? '!' : ''}</span>${escapeHtml(s.label)}</li>`).join('')}</ul>${state.job.status === 'error' ? `<div class="plan-note">${escapeHtml(state.job.error)}</div><div class="actions"><button class="btn btn--ghost" id="retry-build">Return to the forge</button></div>` : ''}</section>`; }
function missingRunView() { return `<section class="surface empty-state"><h1>Start this run from the beginning</h1><p class="step-sub">This deep link has no generated result in the current browser session.</p><button class="btn btn--primary" id="start-mode">Start ${labelMode(state.mode)}</button></section>`; }
function publishedView() { return `<section class="surface"><div class="done-card"><div class="embers" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><div class="big" aria-hidden="true">✦</div><p class="eyebrow">Fresh off the anvil</p><h1>Ready for engineering.</h1><a class="btn btn--primary" href="${state.result.prUrl || '#/'}" ${state.result.prUrl ? 'target="_blank" rel="noreferrer"' : ''}>Open the draft PR →</a> <button class="btn btn--ghost" id="finish">Forge another</button></div></section>`; }

function renderRail() {
  const visible = Boolean(state.mode && routes[state.mode]?.includes(state.step));
  rail.classList.toggle('hidden', !visible); shell.classList.toggle('with-rail', visible);
  if (!visible) return;
  const list = routes[state.mode]; const current = list.indexOf(state.step);
  rail.innerHTML = `<span class="step-rail__title">${labelMode(state.mode)}</span><ol>${list.map((step, i) => `<li class="rail-step ${i < current ? 'done' : i === current ? 'active' : ''}" ${i === current ? 'aria-current="step"' : ''}><span class="dot">${i < current ? '✓' : i + 1}</span>${step === 'review' && state.mode === 'page' ? 'Review & Evaluate' : title(step)}</li>`).join('')}</ol>`;
}

function bindCommon() {
  document.querySelectorAll('[data-primary]').forEach((button) => button.addEventListener('click', () => { state.intake.primary = button.dataset.primary; notify(); }));
  bindIntake(); bindPlan();
  document.querySelector('#target-url')?.addEventListener('input', (event) => { state.intake.referenceUrl = event.target.value; document.querySelector('#target-next').disabled = !event.target.value.trim(); });
  document.querySelector('#target-next')?.addEventListener('click', () => go('tweak', 'describe'));
  document.querySelector('#tweak-text')?.addEventListener('input', (event) => { state.intake.freeText = event.target.value; document.querySelector('#tweak-build').disabled = !event.target.value.trim(); });
  document.querySelector('#tweak-build')?.addEventListener('click', () => beginBuild());
  document.querySelector('#retry-build')?.addEventListener('click', beginBuild);
  document.querySelector('#start-mode')?.addEventListener('click', () => go(state.mode, routes[state.mode][0]));
  document.querySelectorAll('[data-preview-index]').forEach((button) => button.addEventListener('click', () => document.querySelector(`#preview-${button.dataset.previewIndex}`)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' })));
  document.querySelector('#change-form')?.addEventListener('submit', (event) => { event.preventDefault(); const input = document.querySelector('#change-text'); if (!input.value.trim()) return say('Describe the change first'); state.changes.push({ sectionType: document.querySelector('#change-target').value, text: input.value.trim() }); notify(); say('Request logged'); });
  document.querySelector('#publish')?.addEventListener('click', () => go(state.mode, 'publish'));
  document.querySelector('#start-over')?.addEventListener('click', () => { const mode = state.mode; resetMode(mode); go(mode, routes[mode][0]); });
  document.querySelector('#finish')?.addEventListener('click', () => { resetMode(null); go(null); });
}

function bindIntake() {
  document.querySelector('[data-field="pageName"]')?.addEventListener('input', (e) => { state.intake.pageName = e.target.value; });
  const brief = document.querySelector('[data-field="brief"]');
  brief?.addEventListener('input', (e) => { state.intake.brief.text = e.target.value; syncIntakeButton(); });
  brief?.addEventListener('change', notify);
  document.querySelector('#sample-brief')?.addEventListener('click', () => { state.intake.pageName = 'Stasis — Science page'; state.intake.brief.text = DEMO_BRIEF; notify(); say('Sample brief loaded — shape it as you like'); });
  const figma = document.querySelector('[data-field="figma"]');
  figma?.addEventListener('input', (e) => { state.intake.figma.url = e.target.value; parseFigma(e.target.value); syncIntakeButton(); });
  figma?.addEventListener('change', notify);
  const reference = document.querySelector('[data-field="referenceUrl"]');
  reference?.addEventListener('input', (e) => { state.intake.referenceUrl = e.target.value; syncIntakeButton(); });
  reference?.addEventListener('change', notify);
  const drop = document.querySelector('#drop'), file = document.querySelector('#file');
  ['dragenter', 'dragover'].forEach((name) => drop?.addEventListener(name, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((name) => drop?.addEventListener(name, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop?.addEventListener('drop', (e) => addFiles(e.dataTransfer?.files));
  drop?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
  file?.addEventListener('change', () => addFiles(file.files));
  document.querySelectorAll('[data-remove-wireframe]').forEach((button) => button.addEventListener('click', () => { state.intake.wireframes.splice(Number(button.dataset.removeWireframe), 1); notify(); }));
  document.querySelectorAll('[data-remove-source]').forEach((button) => button.addEventListener('click', () => { removeSource(button.dataset.removeSource); notify(); }));
  document.querySelector('#intake-next')?.addEventListener('click', async () => { if (state.mode === 'section') return beginBuild(); const button = document.querySelector('#intake-next'); button.disabled = true; button.textContent = 'Planning…'; try { const response = await planPage({ pageName: state.intake.pageName, intake: contractIntake(), resourceContext: resourceContext() }); state.plan = response.plan; go('page', 'plan'); } catch (error) { say(error.message); button.disabled = false; button.textContent = 'Create page plan →'; } });
  bindResourceLibrary();
}
function bindResourceLibrary() {
  const link = document.querySelector('#resource-link');
  link?.addEventListener('input', (event) => { document.querySelector('#resource-link-add').disabled = !event.target.value.trim(); });
  document.querySelector('#resource-link-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const raw = link.value.trim();
    let parsed;
    try { parsed = new URL(raw); } catch { return say('Use a valid source link'); }
    if (!['http:', 'https:'].includes(parsed.protocol)) return say('Use an http or https source link');
    const kind = document.querySelector('#resource-kind').value;
    const id = resourceId();
    state.intake.resources.push({ id, kind, sourceType: 'link', label: linkedSourceLabel(kind, parsed), url: parsed.href, access: 'checking' });
    notify();
    setTimeout(() => { const resource = state.intake.resources.find((item) => item.id === id); if (!resource) return; resource.access = 'ready'; notify(); }, reduced() ? 40 : 650);
  });
  const resourceDrop = document.querySelector('#resource-drop');
  const resourceFiles = document.querySelector('#resource-files');
  ['dragenter', 'dragover'].forEach((name) => resourceDrop?.addEventListener(name, (event) => { event.preventDefault(); resourceDrop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((name) => resourceDrop?.addEventListener(name, (event) => { event.preventDefault(); resourceDrop.classList.remove('over'); }));
  resourceDrop?.addEventListener('drop', (event) => addResourceFiles(event.dataTransfer?.files));
  resourceDrop?.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); resourceFiles.click(); } });
  resourceFiles?.addEventListener('change', () => addResourceFiles(resourceFiles.files));
  document.querySelectorAll('[data-resource-remove]').forEach((button) => button.addEventListener('click', () => { state.intake.resources = state.intake.resources.filter((resource) => resource.id !== button.dataset.resourceRemove); notify(); }));
  const intent = document.querySelector('#testimonial-intent');
  intent?.addEventListener('input', (event) => { state.intake.testimonialIntent = event.target.value; document.querySelector('#testimonial-rank').disabled = !event.target.value.trim(); });
  document.querySelector('#testimonial-rank-form')?.addEventListener('submit', (event) => { event.preventDefault(); const matches = rankTestimonials(state.intake.testimonialIntent); state.intake.testimonialSelections = matches.slice(0, 2).map((item) => item.id); notify(); });
  document.querySelectorAll('[data-testimonial-pick]').forEach((input) => input.addEventListener('change', () => { const id = input.dataset.testimonialPick; state.intake.testimonialSelections = input.checked ? [...new Set([...state.intake.testimonialSelections, id])] : state.intake.testimonialSelections.filter((item) => item !== id); notify(); }));
}
function bindPlan() {
  document.querySelectorAll('[data-plan-type]').forEach((input) => input.addEventListener('input', () => { state.plan.sections[Number(input.dataset.planType)].sectionType = input.value; }));
  document.querySelectorAll('[data-plan-intent]').forEach((input) => input.addEventListener('input', () => { state.plan.sections[Number(input.dataset.planIntent)].intent = input.value; }));
  document.querySelectorAll('[data-plan-remove]').forEach((button) => button.addEventListener('click', () => { state.plan.sections.splice(Number(button.dataset.planRemove), 1); notify(); }));
  document.querySelectorAll('[data-plan-move]').forEach((button) => button.addEventListener('click', () => { const from = Number(button.dataset.planMove); const to = button.dataset.direction === 'up' ? from - 1 : from + 1; if (to < 0 || to >= state.plan.sections.length) return; const [section] = state.plan.sections.splice(from, 1); state.plan.sections.splice(to, 0, section); notify(); }));
  document.querySelector('#add-section')?.addEventListener('click', () => { if (state.plan.sections.length >= 14) return say('The Phase 1 limit is 14 sections'); state.plan.sections.push({ sectionType: 'new-section', intent: 'Describe the purpose of this section' }); notify(); });
  document.querySelector('#build-page')?.addEventListener('click', beginBuild);
}
async function beginBuild() {
  go(state.mode, 'build');
  state.job = { status: 'running', steps: ['Reading your inputs', 'Planning the page', 'Building sections in parallel', 'Running the advisory self-check', 'Opening one draft pull request'].map((label) => ({ label, state: 'pending' })) }; notify();
  try {
    const result = await generatePage({ pageName: state.intake.pageName, intake: contractIntake(), resourceContext: resourceContext(), options: { maxSections: 14, concurrency: 3, dryRunPlanOnly: false }, plan: state.plan, mode: state.mode }, (active, labels) => { state.job.steps = labels.map((label, index) => ({ label, state: index < active ? 'done' : index === active ? 'active' : 'pending' })); notify(); });
    state.job.steps = state.job.steps.map((s) => ({ ...s, state: 'done' })); state.job.status = 'done'; state.result = { ...result, mode: state.mode }; notify();
    setTimeout(() => go(state.mode, 'review'), reduced() ? 40 : 250);
  } catch (error) { state.job.status = 'error'; state.job.error = error.message; const active = state.job.steps.find((s) => s.state === 'active'); if (active) active.state = 'error'; notify(); }
}
function addFiles(fileList) { [...(fileList || [])].filter((f) => /^image\//.test(f.type)).forEach((file) => { const reader = new FileReader(); reader.onload = () => { const previewUrl = reader.result; state.intake.wireframes.push({ label: file.name, meta: `${Math.max(1, Math.round(file.size / 1024))} KB`, previewUrl, imageBase64: String(previewUrl).split(',')[1], imageMediaType: file.type }); notify(); }; reader.readAsDataURL(file); }); }
function addResourceFiles(fileList) { const kind = document.querySelector('#resource-kind')?.value || 'reference'; [...(fileList || [])].forEach((file) => { const id = resourceId(); const resource = { id, kind, sourceType: 'upload', label: file.name, access: 'ready', mediaType: file.type || 'application/octet-stream', fileBase64: '' }; state.intake.resources.push(resource); const reader = new FileReader(); reader.onload = () => { resource.fileBase64 = String(reader.result).split(',')[1] || ''; }; reader.readAsDataURL(file); }); notify(); }
function resourceId() { return `resource-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function linkedSourceLabel(kind, url) { return ({ testimonials: 'Testimonial library', compliance: 'Compliance source', reference: 'Reference source' })[kind] || url.hostname; }
function removeSource(key) { if (key === 'brief') state.intake.brief.text = ''; if (key === 'wireframes') state.intake.wireframes = []; if (key === 'figma') state.intake.figma = { url: '', fileKey: '', nodeIds: [] }; if (key === 'referenceUrl') state.intake.referenceUrl = ''; }
function parseFigma(url) { const match = url.match(/figma\.com\/(?:file|design)\/([^/?#]+)/i); state.intake.figma.fileKey = match?.[1] || ''; try { const node = new URL(url).searchParams.get('node-id'); state.intake.figma.nodeIds = node ? [node.replace('-', ':')] : []; } catch { state.intake.figma.nodeIds = []; } }
function syncIntakeButton() { const button = document.querySelector('#intake-next'); if (button) button.disabled = !Boolean(state.intake.brief.text.trim() || state.intake.wireframes.length || state.intake.figma.fileKey || state.intake.referenceUrl.trim()); }
function applyTheme() { document.documentElement.dataset.theme = state.theme === 'system' ? '' : state.theme; const button = document.querySelector('#theme-toggle'); if (button) { const labels = { system: ['◐', 'System'], light: ['☀', 'Light'], dark: ['☾', 'Dark'] }; button.querySelector('[aria-hidden]').textContent = labels[state.theme][0]; button.querySelector('.theme-label').textContent = labels[state.theme][1]; button.setAttribute('aria-label', `Theme: ${labels[state.theme][1].toLowerCase()}`); } }
function say(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 1900); }
function labelMode(mode) { return ({ page: 'Full Page', section: 'Quick Section', tweak: 'Tweak in words' })[mode] || 'Foundry'; }
function title(text) { return text.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase()); }
function escapeHtml(value = '') { return String(value).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function escapeAttr(value = '') { return escapeHtml(value).replace(/"/g, '&quot;'); }
function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
