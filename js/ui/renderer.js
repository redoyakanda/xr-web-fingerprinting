import { stringifyFingerprint } from '../export/jsonExport.js';
import { flattenFingerprint, filterRows } from './filters.js';
import { formatValue } from './comparison.js';

export function renderFingerprint(fingerprint, elements, state = {}) {
  elements.jsonViewer.textContent = stringifyFingerprint(fingerprint);
  elements.completedAt.textContent = fingerprint.collectedAtUTC;
  elements.summaryCards.innerHTML = cards({
    'Total collectors': fingerprint.collectorCount, 'Supported collectors': fingerprint.successfulCollectorCount, 'Unsupported collectors': fingerprint.unsupportedCollectorCount,
    'Total values collected': fingerprint.totalValuesCollected, 'WebXR available': yes(fingerprint.collectors.webxr?.supported), 'WebGPU available': yes(fingerprint.collectors.webgpu?.supported),
    'Gamepads exposed': fingerprint.collectors.gamepad?.values?.exposedGamepadCount ?? 0, Warnings: fingerprint.warningCount, Errors: fingerprint.errorCount,
  });
  elements.categoryNav.innerHTML = Object.entries(fingerprint.collectors).map(([name,c]) => `<a href="#collector-${name}" class="nav-item"><span>${name}</span><span>${c.supported?'supported':'unsupported'} · ⚠ ${c.warnings.length} · ✖ ${c.errors.length}</span></a>`).join('');
  renderFilteredRows(fingerprint, elements, state);
  elements.statusMessage.textContent = `Collection ${fingerprint.collectionStatus}. Duration: ${fingerprint.collectionDurationMs} ms.`;
  [elements.copyButton, elements.copySummaryButton, elements.downloadButton, elements.downloadSummaryButton].forEach((b) => { b.disabled = false; });
}

export function renderFilteredRows(fingerprint, elements, state = {}) {
  const rows = flattenFingerprint(fingerprint); const visible = filterRows(rows, state);
  elements.filterCount.textContent = `${visible.length} / ${rows.length} fields`;
  elements.structuredView.innerHTML = visible.length ? groupRows(visible) : '<p>No fields match the active filters.</p>';
}
function groupRows(rows) { const groups = new Map(); rows.forEach((r) => { if (!groups.has(r.category)) groups.set(r.category, []); groups.get(r.category).push(r); }); return Array.from(groups, ([name, rs]) => `<details id="collector-${name}" open><summary>${name} (${rs.length})</summary><dl class="kv-list">${rs.map((r) => `<div><dt>${r.path}</dt><dd><code>${escapeHtml(formatValue(r.value))}</code></dd></div>`).join('')}</dl></details>`).join(''); }
export function renderComparison(comparison, elements, options = {}) {
  const s = comparison.summary; elements.comparisonSummary.innerHTML = `<div class="summary-cards compact">${cards({ 'Fields compared': s.totalFields, Identical: s.identical, Changed: s.changed, 'Current only': s.currentOnly, 'Imported only': s.importedOnly, Similarity: `${s.similarityPercentage}%` })}</div>`;
  const rows = comparison.rows.filter((r) => !r.excluded && (options.showIdentical || r.result !== 'identical') && (!options.onlyDifferences || r.result !== 'identical'));
  elements.comparisonTable.innerHTML = `<div class="comparison-row comparison-head"><b>JSON path</b><b>Current value</b><b>Imported value</b><b>Result</b></div>${rows.map((r) => `<div class="comparison-row result-${r.result.replaceAll(' ','-')}"><span>${escapeHtml(r.path)}</span><code>${escapeHtml(formatValue(r.currentValue))}</code><code>${escapeHtml(formatValue(r.importedValue))}</code><strong>${r.result}</strong></div>`).join('')}`;
  elements.downloadComparisonButton.disabled = false;
}
export function renderStatus(message, elements) { elements.statusMessage.textContent = message; }
export function updateProgress(elements, { current = 'Idle', completed = 0, total = 0, warnings = 0, errors = 0 }) { elements.progress.max = total; elements.progress.value = completed; elements.currentCollector.textContent = current; elements.completedCount.textContent = `${completed} / ${total}`; elements.warningCount.textContent = warnings; elements.errorCount.textContent = errors; }
function cards(obj) { return Object.entries(obj).map(([k,v]) => `<article class="summary-card"><span>${k}</span><strong>${v}</strong></article>`).join(''); }
function yes(v) { return v ? 'Yes' : 'No'; }
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
