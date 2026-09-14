import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  DEFAULT_RESULT_FILTERS, filterRows, flattenResult, isResultFilterActive, searchResultRows,
} from '../js/ui/filters.js';
import { renderDataRows } from '../js/ui/renderer.js';

const extension = {
  performed: true,
  observerDisconnected: true,
  timing: { durationMs: 2000 },
  aggregateFeatures: {
    mutations: { totalMutationCount: 0, addedNodeCount: 0, uniqueModifiedAttributes: [] },
    accessibilityMutations: { ariaMutationCount: 0 },
    injectedElements: { styleElementCount: 0, customElementNames: [] },
    globalSurface: { checked: false, newGlobalPropertyNames: [] },
  },
  warnings: [], errors: [], note: '', nullableMeasurement: null,
};
const interaction = {
  performed: true, state: 'completed',
  groundTruth: { participantCode: 'P001', trialNumber: 1 },
  timing: { durationMs: 29565 },
  tasks: [{ taskId: 'task-1', taskType: 'focus', completed: true, durationMs: 1000, interactionCount: 0 }],
  aggregateFeatures: {
    focusNavigation: { tabCount: 0 }, activation: { pointerActivationCount: 0 },
    taskPerformance: { taskCompletionCount: 1, taskCompletionRate: 0.1 },
  },
  rawEventsIncluded: false,
};

const extensionRows = flattenResult(extension, { rootPath: '$.extensionArtifactObservation' });
assert.equal(searchResultRows(extensionRows, '').length, extensionRows.length, 'empty search shows every field');
assert.equal(searchResultRows(extensionRows, '   ').length, extensionRows.length, 'whitespace search shows every field');
assert.equal(isResultFilterActive({ search: '   ', filter: 'all' }), false);
assert.equal(filterRows(extensionRows, { filter: 'all' }).length, extensionRows.length, 'All means all');
assert.equal(filterRows(extensionRows, { filter: 'supported' }).length, extensionRows.length, 'collector filters are ignored for generic data');
assert.ok(extensionRows.some((row) => row.path.endsWith('totalMutationCount') && row.value === 0));
assert.ok(extensionRows.some((row) => row.path.endsWith('observerDisconnected') && row.value === true));
assert.ok(extensionRows.some((row) => row.path.endsWith('checked') && row.value === false));
assert.ok(extensionRows.some((row) => row.path.endsWith('customElementNames') && Array.isArray(row.value) && row.value.length === 0));
assert.ok(extensionRows.some((row) => row.path.endsWith('note') && row.value === ''));
assert.ok(extensionRows.some((row) => row.path.endsWith('nullableMeasurement') && row.value === null));

const interactionRows = flattenResult(interaction, { rootPath: '$.interactionExperiment' });
assert.ok(interactionRows.some((row) => row.path.endsWith('tabCount') && row.value === 0));
assert.ok(searchResultRows(interactionRows, 'task-1').some((row) => row.path.includes('taskId')));
assert.ok(searchResultRows(interactionRows, 'false').some((row) => row.path.endsWith('rawEventsIncluded')));
assert.ok(searchResultRows(interactionRows, '0.1').some((row) => row.path.endsWith('taskCompletionRate')));

const container = { innerHTML: '' };
const statusElement = { textContent: '' };
let rendered = renderDataRows(extension, container, { rootPath: '$.extensionArtifactObservation', statusElement });
assert.equal(rendered.visible.length, rendered.rows.length);
assert.match(container.innerHTML, /totalMutationCount/);
assert.match(container.innerHTML, /uniqueModifiedAttributes/);
assert.match(container.innerHTML, /observerDisconnected/);
assert.match(statusElement.textContent, /^Showing all \d+ fields$/);
rendered = renderDataRows(interaction, container, { rootPath: '$.interactionExperiment', search: ' focus ', statusElement });
assert.ok(rendered.visible.length > 0);
assert.match(statusElement.textContent, /Search: "focus"/);
renderDataRows(interaction, container, { rootPath: '$.interactionExperiment', search: 'does-not-exist' });
assert.match(container.innerHTML, /No fields match the active search\/filter/);

const complete = { extensionArtifactObservation: extension, interactionExperiment: interaction };
const completeRows = flattenResult(complete);
assert.ok(completeRows.some((row) => row.path.includes('extensionArtifactObservation.aggregateFeatures.mutations')));
assert.ok(completeRows.some((row) => row.path.includes('interactionExperiment.aggregateFeatures.focusNavigation')));

assert.deepEqual(DEFAULT_RESULT_FILTERS, {
  searchQuery: '', categoryFilter: 'all', featureFamily: 'all', showOnlyChanged: false,
  showOnlyWarnings: false, showOnlyErrors: false, showOnlySupported: false, showOnlyUnsupported: false,
});

const appSource = await readFile('js/core/app.js', 'utf8');
assert.match(appSource, /function clearResultFilters\(\).*searchInput\.value=''[\s\S]*filterSelect\.value='all'/);
assert.match(appSource, /result-tab'[\s\S]*clearResultFilters\(\);renderActiveResult/);
assert.match(appSource, /view-artifact-data'[\s\S]*openCollectedResult\('extension'\)/);
assert.match(appSource, /view-interaction-data'[\s\S]*openCollectedResult\('interaction'\)/);
assert.match(appSource, /jsonViewer\.textContent=performed\?JSON\.stringify\(payload,null,2\)/, 'raw JSON uses the unfiltered payload');
assert.match(appSource, /openCollectedResult\(view\)[\s\S]*setResultMode\('structured'\)[\s\S]*scrollIntoView[\s\S]*\.focus\(\)/);

console.log('Results View rendering and filtering tests passed');
