const esc = (value = '') => String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));

export function reviewView(state) {
  const { result } = state;
  const score = result.scorecard || { pageScore: 0, failures: 0, sections: [] };
  return `<a class="crumb" href="#/">← All modes</a><section class="surface">
    <p class="eyebrow">Review &amp; Evaluate</p><h1 class="step-h">Fresh off the anvil ✦</h1>
    <div class="pr"><span class="pr-spark" aria-hidden="true">✦</span> Draft PR <a href="${result.prUrl}" target="_blank" rel="noreferrer">#${result.prNumber}</a> · open</div>
    <div class="review-grid"><div><div class="scorecard"><div class="score-overall"><div><strong>Advisory score</strong><div class="hint">${score.failures} flagged section${score.failures === 1 ? '' : 's'}</div></div><span class="score-number">${score.pageScore}</span></div><ul class="score-list">${score.sections.map(scoreRow).join('')}</ul></div>${warnings(result.warnings)}</div>
      <div><p class="preview-label">Page preview</p><div class="preview-wrap"><div class="preview-page">${result.sections.map(preview).join('')}</div></div></div></div>
    <form class="change" id="change-form"><select id="change-target" aria-label="Section to change">${result.sections.map((s) => `<option value="${esc(s.sectionType)}">${esc(s.sectionType)}</option>`).join('')}</select><input id="change-text" aria-label="Change request" placeholder="Ask for a change in plain language"><button class="btn btn--ghost">Log request</button></form>
    ${state.changes.length ? `<ul class="change-log">${state.changes.map((c) => `<li><strong>${esc(c.sectionType)}:</strong> ${esc(c.text)}</li>`).join('')}</ul>` : ''}
    <div class="actions"><button class="btn btn--primary" id="publish">Mark ready →</button><button class="btn btn--ghost" id="start-over">Start over</button></div>
  </section>`;
}
function scoreRow(row, index) { const critique = row.critique ? `<span class="score-row__critique">${esc(row.critique)}</span>` : ''; const iterations = row.iterations?.length ? ` · ${row.iterations.length} iteration${row.iterations.length > 1 ? 's' : ''}` : ''; return `<li><button class="score-row" data-preview-index="${index}"><span class="score-row__name">${esc(row.sectionType)}</span><span class="score-row__meta">Fidelity: ${esc(row.fidelity)}${iterations}${row.flags?.length ? ` · ${esc(row.flags.join(', '))}` : ''}</span>${critique}<span class="score-row__status ${row.pass ? '' : 'warn'}">${row.pass ? 'PASS' : 'FLAG'} · ${row.score}</span></button></li>`; }
function preview(section, index) {
  if (section.previewHtml) return `<article class="device" id="preview-${index}" aria-label="${esc(section.sectionType)} preview"><div class="section-label">${String(index + 1).padStart(2, '0')} · ${esc(section.sectionType)}</div><iframe class="preview-frame" title="${esc(section.sectionType)} generated preview" sandbox srcdoc="${esc(section.previewHtml)}"></iframe></article>`;
  return `<article class="device" id="preview-${index}" aria-label="${esc(section.sectionType)} preview"><div class="section-label">${String(index + 1).padStart(2, '0')} · ${esc(section.sectionType)}</div><div class="preview-missing">The live generator did not return a preview for this section.</div></article>`;
}
function warnings(items = []) { return items.length ? `<div class="plan-note"><strong>Review note:</strong> ${items.map(esc).join(' ')}</div>` : ''; }
