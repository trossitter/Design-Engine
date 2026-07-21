export const routes = {
  page: ['brief', 'plan', 'build', 'review', 'publish'],
  section: ['design', 'build', 'review', 'publish'],
  tweak: ['target', 'describe', 'build', 'review', 'publish']
};

export function parseHash(hash = location.hash) {
  const clean = hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (!clean) return { mode: null, step: null, valid: true };
  const [mode, suppliedStep, ...extra] = clean.split('/');
  if (!routes[mode] || extra.length) return { mode, step: suppliedStep, valid: false };
  const step = suppliedStep || routes[mode][0];
  return { mode, step, valid: routes[mode].includes(step) };
}
export function go(mode, step, { replace = false } = {}) {
  const hash = mode ? `#/${mode}/${step || routes[mode][0]}` : '#/';
  if (replace) location.replace(hash); else location.hash = hash;
}
export function nextStep(mode, step) {
  const list = routes[mode] || [];
  return list[list.indexOf(step) + 1] || step;
}
export function startRouter(onRoute) {
  const route = () => onRoute(parseHash());
  window.addEventListener('hashchange', route);
  if (!location.hash) location.replace('#/'); else route();
}
