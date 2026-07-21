const savedTheme = localStorage.getItem('de-theme') || 'system';

export const state = {
  theme: savedTheme,
  mode: null,
  step: null,
  intake: {
    pageName: 'Stasis — Science page',
    primary: 'brief',
    brief: { text: '' },
    wireframes: [],
    figma: { url: '', fileKey: '', nodeIds: [] },
    referenceUrl: '',
    freeText: '',
    resources: [],
    testimonialIntent: '',
    testimonialSelections: []
  },
  plan: { sections: [] },
  job: { status: 'idle', steps: [] },
  result: { mode: null, prNumber: null, prUrl: '', scorecard: null, sections: [], warnings: [] },
  changes: []
};

const listeners = new Set();
export function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function notify() { listeners.forEach((listener) => listener(state)); }
export function setRoute(route) { state.mode = route.mode; state.step = route.step; notify(); }
export function resetMode(mode) {
  state.mode = mode;
  state.step = null;
  state.intake = { pageName: 'Stasis — Science page', primary: mode === 'section' ? 'wireframe' : 'brief', brief: { text: '' }, wireframes: [], figma: { url: '', fileKey: '', nodeIds: [] }, referenceUrl: '', freeText: '', resources: [], testimonialIntent: '', testimonialSelections: [] };
  state.plan = { sections: [] };
  state.job = { status: 'idle', steps: [] };
  state.result = { mode: null, prNumber: null, prUrl: '', scorecard: null, sections: [], warnings: [] };
  state.changes = [];
  notify();
}
export function setTheme(theme) {
  state.theme = theme;
  localStorage.setItem('de-theme', theme);
  document.documentElement.dataset.theme = theme === 'system' ? '' : theme;
  notify();
}
export function hasIntake() {
  const i = state.intake;
  return Boolean(i.brief.text.trim() || i.wireframes.length || i.figma.fileKey || i.referenceUrl.trim() || i.freeText.trim() || i.resources.length);
}
export function contractIntake() {
  const i = state.intake;
  const intake = {};
  if (i.brief.text.trim()) intake.brief = { text: i.brief.text.trim() };
  if (i.wireframes.length) intake.wireframes = i.wireframes.map(({ imageBase64, imageMediaType, label }) => ({ imageBase64, imageMediaType, label }));
  if (i.figma.fileKey) intake.figma = { fileKey: i.figma.fileKey, nodeIds: i.figma.nodeIds };
  if (i.referenceUrl.trim()) intake.referenceUrl = i.referenceUrl.trim();
  if (i.freeText.trim()) intake.freeText = i.freeText.trim();
  return intake;
}
export function resourceContext() {
  const i = state.intake;
  return {
    resources: i.resources.map(({ id, kind, sourceType, label, url, mediaType, fileBase64, access }) => ({ id, kind, sourceType, label, ...(url ? { url } : {}), ...(mediaType ? { mediaType } : {}), ...(fileBase64 ? { fileBase64 } : {}), access })),
    testimonialIntent: i.testimonialIntent.trim(),
    testimonialSelections: [...i.testimonialSelections]
  };
}
