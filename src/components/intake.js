import { state, hasIntake } from '../state.js?v=live-1';
import { sourceLibraryView } from './resources.js?v=live-1';

const labels = { brief: 'Brief', wireframe: 'Wireframe', figma: 'Figma', reference: 'Ref URL' };
const esc = (value = '') => String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));

export function intakeView({ sectionOnly = false } = {}) {
  const choices = sectionOnly ? ['wireframe', 'figma', 'reference', 'brief'] : ['brief', 'wireframe', 'figma', 'reference'];
  return `<a class="crumb" href="#/">← All modes</a><section class="surface">
    <p class="eyebrow">${sectionOnly ? 'Quick section' : 'Full page'} · Intake</p>
    <h1 class="step-h">${sectionOnly ? 'Drop in your design frames' : 'Give us the spark'}</h1>
    <div class="field"><label class="lbl" for="page-name">Page name</label><input id="page-name" data-field="pageName" value="${esc(state.intake.pageName)}"></div>
    <div class="start-chooser" role="group" aria-label="Primary source">${choices.map((key) => `<button class="start-choice" data-primary="${key}" aria-pressed="${state.intake.primary === key}">${labels[key]}</button>`).join('')}</div>
    <div class="input-panel">${primaryPanel(state.intake.primary)}</div>
    ${sectionOnly ? '' : sourceLibraryView()}
    <details class="context-acc"><summary>Add context</summary><div class="context-body">${choices.filter((key) => key !== state.intake.primary).map(primaryPanel).join('')}</div></details>
    ${chips()}
    <div class="actions"><button class="btn btn--primary" id="intake-next" ${hasIntake() ? '' : 'disabled'}>${sectionOnly ? 'Forge this section' : 'Plan the page'} →</button></div>
  </section>`;
}

function primaryPanel(key) {
  if (key === 'brief') return `<div class="field"><div class="field-top"><label class="lbl" for="brief">Brief</label><button class="mini-action" type="button" id="sample-brief">Try the science-page sample ✦</button></div><textarea id="brief" data-field="brief" placeholder="Paste a brief, goals, audience, required sections, and reviewer directives…">${esc(state.intake.brief.text)}</textarea></div>`;
  if (key === 'wireframe') return `<div><label class="drop" id="drop" tabindex="0"><span class="drop__icon" aria-hidden="true">↑</span><div class="drop__t">Drag wireframes or finished frames here</div><div class="drop__s">or <span class="drop__browse">browse files</span> — PNG, JPG</div><input type="file" id="file" accept="image/png,image/jpeg,image/webp" multiple></label>${fileList()}</div>`;
  if (key === 'figma') return `<div class="field"><label class="lbl" for="figma">Figma link</label><input id="figma" data-field="figma" type="url" value="${esc(state.intake.figma.url)}" placeholder="https://figma.com/design/…"><span class="field-help">Best-effort context; a failed fetch will not stop the run.</span></div>`;
  return `<div class="field"><label class="lbl" for="reference-url">Reference URL</label><input id="reference-url" data-field="referenceUrl" type="url" value="${esc(state.intake.referenceUrl)}" placeholder="https://example.com/landing-page"><span class="field-help">Used for visual and structural reference only.</span></div>`;
}
function fileList() { return `<ul class="files">${state.intake.wireframes.map((file, index) => `<li class="file"><img alt="" src="${file.previewUrl}"><div><div class="file__name">${esc(file.label)}</div><div class="file__meta">${esc(file.meta)}</div></div><button class="file__x" data-remove-wireframe="${index}" aria-label="Remove ${esc(file.label)}">×</button></li>`).join('')}</ul>`; }
function chips() {
  const items = [];
  if (state.intake.brief.text.trim()) items.push(['brief', 'Brief']);
  if (state.intake.wireframes.length) items.push(['wireframes', `${state.intake.wireframes.length} wireframe${state.intake.wireframes.length > 1 ? 's' : ''}`]);
  if (state.intake.figma.url.trim()) items.push(['figma', 'Figma']);
  if (state.intake.referenceUrl.trim()) items.push(['referenceUrl', 'Reference URL']);
  return items.length ? `<div class="chips" aria-label="Attached sources">${items.map(([key, text]) => `<span class="chip">${text}<button data-remove-source="${key}" aria-label="Remove ${text}">×</button></span>`).join('')}</div>` : '';
}
