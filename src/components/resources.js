import { state } from '../state.js?v=live-1';

const esc = (value = '') => String(value).replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));

export function rankTestimonials(intent = '', library = []) {
  const terms = String(intent).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return library.map((item, index) => ({
    ...item,
    score: terms.reduce((total, term) => total + item.themes.reduce((sum, theme) => sum + (theme.includes(term) || term.includes(theme) ? 2 : 0), 0), 0) - index * 0.01
  })).sort((a, b) => b.score - a.score);
}

export function sourceLibraryView() {
  const { resources = [], testimonialIntent = '', testimonialSelections = [] } = state.intake;
  const matches = [];
  return `<section class="resource-panel" aria-labelledby="source-library-title">
    <div class="resource-panel__head"><div><h2 id="source-library-title">Source library</h2><p>Testimonials · compliance · claims</p></div>${resources.length ? `<span class="resource-count">${resources.length}</span>` : ''}</div>
    <form class="resource-link" id="resource-link-form"><select id="resource-kind" aria-label="Source type"><option value="testimonials">Testimonials</option><option value="compliance">Compliance</option><option value="reference">Reference</option></select><input id="resource-link" type="url" aria-label="Google Drive or file link" placeholder="Paste a Google Drive or file link"><button class="btn btn--ghost" id="resource-link-add" disabled>Add link</button></form>
    <label class="resource-drop" id="resource-drop" tabindex="0"><span aria-hidden="true">↑</span><strong>Upload files</strong><input class="resource-file-input" id="resource-files" type="file" accept=".pdf,.doc,.docx,.txt,.md,.csv,image/*" multiple></label>
    ${resourceList(resources)}
    <div class="testimonial-rank"><label class="lbl" for="testimonial-intent">Testimonial intent</label><div><input id="testimonial-intent" value="${esc(testimonialIntent)}" placeholder="e.g. oxidative stress"><span class="hint">Matched from the sources during planning.</span></div></div>
    ${matches.length ? `<div class="testimonial-results"><span class="preview-label">Top matches</span><ol>${matches.map((item, index) => `<li><label><input type="checkbox" data-testimonial-pick="${esc(item.id)}" ${testimonialSelections.includes(item.id) ? 'checked' : ''}><span class="match-rank">${index + 1}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.themes.join(' · '))}</small></span></label></li>`).join('')}</ol></div>` : ''}
  </section>`;
}

function resourceList(resources) {
  if (!resources.length) return '';
  return `<ul class="resource-list">${resources.map((resource) => `<li><span class="resource-kind">${esc(kindLabel(resource.kind))}</span><span><strong>${esc(resource.label)}</strong><small>${esc(accessLabel(resource))}</small></span><button data-resource-remove="${esc(resource.id)}" aria-label="Remove ${esc(resource.label)}">×</button></li>`).join('')}</ul>`;
}
function kindLabel(kind) { return ({ testimonials: 'Testimonial', compliance: 'Compliance', reference: 'Reference' })[kind] || 'Source'; }
function accessLabel(resource) {
  if (resource.sourceType === 'upload') return 'Uploaded';
  if (resource.access === 'checking') return 'Checking access…';
  if (resource.access === 'needs-access') return 'Needs access';
  return 'Access checked during planning';
}
