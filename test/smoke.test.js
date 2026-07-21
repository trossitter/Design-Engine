import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

globalThis.localStorage = {
  values: new Map(),
  getItem(key) { return this.values.get(key) || null; },
  setItem(key, value) { this.values.set(key, value); }
};
globalThis.matchMedia = () => ({ matches: true });
globalThis.document = { documentElement: { dataset: {} } };

const { parseHash, nextStep, routes } = await import('../src/router.js');
const { state, hasIntake, contractIntake, resourceContext, setTheme } = await import('../src/state.js?v=resources-1');
const { planPage, generatePage, normalizePlan, normalizeResult, toGeneratePageRequest, ADAPTER } = await import('../src/api.js');
const { intakeView } = await import('../src/components/intake.js');
const { reviewView } = await import('../src/components/review.js');
const { sourceLibraryView, rankTestimonials } = await import('../src/components/resources.js');

test('hash grammar supports hub, canonical deep links, and rejects unknown routes', () => {
  assert.deepEqual(parseHash('#/'), { mode: null, step: null, valid: true });
  assert.deepEqual(parseHash('#/page/review'), { mode: 'page', step: 'review', valid: true });
  assert.equal(parseHash('#/page/nope').valid, false);
  assert.equal(nextStep('page', 'plan'), 'build');
  assert.deepEqual(routes.section, ['design', 'build', 'review', 'publish']);
});

test('intake requires a real modality and maps to the A3 contract', () => {
  state.intake.brief.text = '';
  state.intake.wireframes = [];
  state.intake.figma = { url: 'not a figma URL', fileKey: '', nodeIds: [] };
  state.intake.referenceUrl = '';
  state.intake.freeText = '';
  state.intake.resources = [];
  state.intake.testimonialIntent = '';
  state.intake.testimonialSelections = [];
  assert.equal(hasIntake(), false);

  state.intake.brief.text = '# Brief';
  state.intake.referenceUrl = 'https://example.com/reference';
  assert.equal(hasIntake(), true);
  assert.deepEqual(contractIntake(), {
    brief: { text: '# Brief' },
    referenceUrl: 'https://example.com/reference'
  });
});

test('source library preserves the A3 request and exposes the contract addendum separately', () => {
  state.intake.resources = [{ id: 'drive-1', kind: 'testimonials', sourceType: 'link', label: 'Testimonial library', url: 'https://drive.google.com/file/d/abc/view', access: 'ready' }];
  state.intake.testimonialIntent = 'stress';
  state.intake.testimonialSelections = ['oxidative-stress', 'daily-calm'];
  assert.deepEqual(contractIntake(), { brief: { text: '# Brief' }, referenceUrl: 'https://example.com/reference' });
  assert.deepEqual(resourceContext(), {
    resources: [{ id: 'drive-1', kind: 'testimonials', sourceType: 'link', label: 'Testimonial library', url: 'https://drive.google.com/file/d/abc/view', access: 'ready' }],
    testimonialIntent: 'stress',
    testimonialSelections: ['oxidative-stress', 'daily-calm']
  });
  assert.equal(rankTestimonials('stress')[0].id, 'oxidative-stress');
  const library = sourceLibraryView();
  assert.match(library, /Paste a Google Drive or file link/);
  assert.match(library, /Access ready · demo/);
  assert.match(library, /Top matches/);
});

test('mock plan and generation match the full-page response seam', async () => {
  assert.equal(ADAPTER, 'MOCK');
  const { plan } = await planPage({ pageName: 'Science LP', intake: { brief: { text: '# Brief' } } });
  assert.equal(plan.sections.length, 12);
  assert.equal(plan.sections[1].sectionType, 'hero');
  assert.equal(plan.sections[3].sectionType, 'benefits');
  assert.equal(plan.sections[5].sectionType, 'ingredient-story');

  const progress = [];
  const result = await generatePage({ pageName: 'Science LP', intake: { brief: { text: '# Brief' } }, plan, mode: 'page' }, (index) => progress.push(index));
  assert.equal(result.sections.length, 12);
  assert.equal(result.scorecard.sections.length, 12);
  assert.equal(result.scorecard.pageScore, 92);
  assert.match(result.prUrl, /design-engine-sandbox/);
  assert.ok(result.pageJson.includes('science-results'));
  assert.deepEqual(progress, [0, 1, 2, 3, 4]);

  const quickProgress = [];
  const quick = await generatePage({ pageName: 'Science LP', intake: { wireframes: [{ imageBase64: 'AA==', imageMediaType: 'image/png', label: 'frame' }] }, plan: { sections: [] }, mode: 'section' }, (index) => quickProgress.push(index));
  assert.equal(quick.sections.length, 1);
  assert.equal(quick.sections[0].sectionType, 'science-results');
  assert.equal(quick.sections[0].preview.variant, 'science');
  assert.deepEqual(quickProgress, [0, 1, 2]);

  const tweakProgress = [];
  const tweak = await generatePage({ pageName: 'Science LP', intake: { referenceUrl: 'https://example.com', freeText: 'Tighten spacing' }, plan: { sections: [] }, mode: 'tweak' }, (index) => tweakProgress.push(index));
  assert.equal(tweak.sections[0].sectionType, 'targeted-update');
  assert.deepEqual(tweakProgress, [0, 1, 2, 3]);
});

test('live response normalization consumes per-section scorecards', () => {
  const normalized = normalizeResult({
    scorecard: { pageScore: 88, failures: 1 },
    sections: [{ sectionType: 'hero', scorecard: { score: 88, issues: ['CTA contrast'] } }]
  });
  assert.equal(normalized.scorecard.sections[0].sectionType, 'hero');
  assert.equal(normalized.scorecard.sections[0].pass, false);
  assert.deepEqual(normalized.scorecard.sections[0].flags, ['CTA contrast']);
  assert.deepEqual(normalizePlan([{ sectionType: 'hero' }]), { sections: [{ sectionType: 'hero' }] });
  assert.deepEqual(toGeneratePageRequest({ pageName: 'Science LP', intake: { brief: { text: '# Brief' } }, plan: { sections: [] }, mode: 'page', options: { concurrency: 3 } }), {
    pageName: 'Science LP', intake: { brief: { text: '# Brief' } }, options: { concurrency: 3 }
  });
});

test('intake and review components expose the Phase 1 interaction seams', () => {
  state.intake.brief.text = '# Brief';
  state.intake.referenceUrl = 'https://example.com/reference';
  const intake = intakeView();
  assert.match(intake, /class="start-chooser"/);
  assert.match(intake, /<details class="context-acc">/);
  assert.match(intake, /aria-label="Attached sources"/);

  const review = reviewView({
    mode: 'page', changes: [],
    result: {
      prNumber: 42, prUrl: 'https://github.com/example/sandbox/pull/42', warnings: [],
      scorecard: { pageScore: 91, failures: 0, sections: [{ sectionType: 'hero', score: 91, pass: true, fidelity: 'High', flags: [], iterations: [{ score: 82 }], critique: 'Spacing improved.' }] },
      sections: [{ sectionType: 'hero', previewHtml: '<main><h1>Preview</h1></main>' }]
    }
  });
  assert.match(review, /data-preview-index="0"/);
  assert.match(review, /1 iteration/);
  assert.match(review, /Spacing improved\./);
  assert.match(review, /<iframe class="preview-frame"[^>]+sandbox/);
  assert.match(review, /id="publish"/);
  assert.match(review, /Advisory score/);
  assert.match(review, /Mark ready →/);
  assert.doesNotMatch(review, /taste test|final say/);
});

test('static shell stays build-free and preserves accessibility hooks', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  const renderSource = readFileSync(new URL('../src/render.js', import.meta.url), 'utf8');
  assert.match(html, /<main id="stage" tabindex="-1">/);
  assert.match(html, /<title>Foundry<\/title>/);
  assert.match(html, /aria-label="Foundry home"/);
  assert.match(html, /<script type="module" src="\.\/src\/render\.js\?v=resources-1">/);
  assert.match(html, /id="step-rail"[^>]+aria-label="Build progress"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /--warn:/);
  assert.match(renderSource, /state\.result\.mode === state\.mode/);
  assert.match(renderSource, /state\.plan\.sections\.length >= 14/);
  assert.match(renderSource, /DEMO_BRIEF/);
});

test('theme preference cycles through the persistent state seam', () => {
  setTheme('dark');
  assert.equal(state.theme, 'dark');
  assert.equal(localStorage.getItem('de-theme'), 'dark');
  assert.equal(document.documentElement.dataset.theme, 'dark');
});
