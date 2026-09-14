import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { buildFingerprint, buildResearchRecord, validateResearchRecord, APPLICATION_VERSION } from '../js/ui/summary.js';
import { selectExport, prepareExport } from '../js/export/jsonExport.js';
import { extractInteractionFeatures } from '../js/experiments/interactionFeatures.js';
import { ExperimentManager } from '../js/core/experimentManager.js';
import { compareFingerprints } from '../js/ui/comparison.js';

const collectors={navigator:{supported:true,values:{platform:'test'},warnings:[],errors:[]},accessibilityPreferences:{supported:true,values:{reducedMotion:false},warnings:[],errors:[]},accessibilityEnvironment:{supported:true,values:{},warnings:[],errors:[]},accessibilityAPISurface:{supported:false,values:{},warnings:['unsupported'],errors:[]}};
const make=()=>buildFingerprint({collectorResults:structuredClone(collectors),startedAt:new Date('2026-09-14T00:00:00.000Z'),endedAt:new Date('2026-09-14T00:00:00.025Z')});
const first=make(),second=make();
assert.equal(APPLICATION_VERSION,'1.2.0');
assert.notEqual(first.metadata.collectionId,second.metadata.collectionId);
first.passiveSnapshot.collectors.navigator.values.platform='changed';
assert.equal(second.passiveSnapshot.collectors.navigator.values.platform,'test');
assert.deepEqual(validateResearchRecord(second),{valid:true,errors:[]});
assert.equal(second.extensionArtifactObservation.performed,false);
assert.equal(second.extensionArtifactObservation.supported,null);
assert.equal(second.screenReaderDetectionModelStatus,'not-trained');
assert.equal(second.classification,null);
assert.ok(!('groundTruth' in selectExport(second,'feature-vector')));
assert.doesNotThrow(()=>JSON.parse(prepareExport(second)));

const extensionOnly={performed:true,supported:true,timing:{startedAt:'2026-09-14T00:00:00.000Z',finishedAt:'2026-09-14T00:00:02.000Z',durationMs:2000,configuredDurationMs:2000},observerDisconnected:true,aggregateFeatures:{mutations:{totalMutationCount:1}},warnings:[],errors:[]};
const interactionOnly={performed:true,groundTruth:{participantCode:'P001'},timing:{startedAt:'2026-09-14T00:00:00.000Z',finishedAt:'2026-09-14T00:00:20.000Z',durationMs:20000},tasks:[],aggregateFeatures:{timing:{totalExperimentDuration:20000}},rawEventsIncluded:false};
const extensionRecord=buildResearchRecord({extensionArtifactObservation:extensionOnly});
assert.equal(extensionRecord.passiveSnapshot.performed,false);
assert.equal(selectExport(extensionRecord,'extension').aggregateFeatures.mutations.totalMutationCount,1);
const interactionRecord=buildResearchRecord({interactionExperiment:interactionOnly});
assert.equal(interactionRecord.passiveSnapshot.performed,false);
assert.equal(selectExport(interactionRecord,'interaction').timing.totalExperimentDuration,20000);
const completeRecord=buildResearchRecord({passiveRecord:second,extensionArtifactObservation:extensionOnly,interactionExperiment:interactionOnly});
assert.equal(completeRecord.passiveSnapshot.performed,true);
assert.equal(completeRecord.extensionArtifactObservation.performed,true);
assert.equal(completeRecord.interactionExperiment.performed,true);

for(const durationMs of [20_000,60_000,5*60_000]){
 const aggregate=extractInteractionFeatures({durationMs,tasks:[{taskId:'one',completed:true,durationMs,interactionCount:0}],events:[]});
 assert.equal(aggregate.timing.totalExperimentDuration,durationMs);
 assert.equal(aggregate.taskPerformance.taskCompletionRate,1);
 assert.doesNotThrow(()=>JSON.stringify(aggregate));
}
const edge=extractInteractionFeatures({durationMs:NaN,tasks:[{taskId:'empty',completed:false,durationMs:undefined,interactionCount:undefined}],events:[{type:'focusin',intervalSincePreviousFocus:-5}]});
assert.equal(edge.timing.totalExperimentDuration,0);
assert.equal(edge.timing.perTaskDuration.empty,null);
assert.equal(edge.timing.meanFocusTransitionInterval,0);
assert.ok(!JSON.stringify(edge).match(/NaN|Infinity/));

const manager=new ExperimentManager();
manager.prepareExperiment({confirmed:true,assistiveTechnologyCondition:'screen-reader',screenReader:'NVDA',deviceClass:'desktop',participantCode:'P001'});
const exposed=manager.snapshot(); exposed.groundTruth.participantCode='ATTACK'; exposed.tasks[0].taskId='ATTACK';
assert.equal(manager.groundTruth.participantCode,'P001');
assert.notEqual(manager.tasks[0].taskId,'ATTACK');
manager.cancelExperiment();

const other=structuredClone(second); other.extensionArtifactObservation={...other.extensionArtifactObservation,performed:true,supported:false};
const comparison=compareFingerprints(second,other);
assert.ok(comparison.rows.some(row=>row.status==='not-performed'));
assert.ok(comparison.rows.some(row=>row.status==='unsupported'));
assert.equal(comparison.summary.similarityFormula.includes('not entropy or uniqueness'),true);

async function files(dir){const out=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${entry.name}`;if(entry.isDirectory())out.push(...await files(path));else if(path.endsWith('.js'))out.push(path);}return out;}
const source=(await Promise.all((await files('js')).map(path=>readFile(path,'utf8')))).join('\n');
for(const forbidden of [/addEventListener\(['"]pointermove/,/addEventListener\(['"]devicemotion/i,/addEventListener\(['"]deviceorientation/i,/getUserMedia\s*\(/,/sendBeacon\s*\(/,/new\s+WebSocket\s*\(/,/fetch\s*\(/]) assert.doesNotMatch(source,forbidden);
console.log('Phase E validation tests passed');
