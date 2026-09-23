import assert from 'node:assert/strict';
import fs from 'node:fs';
import {InteractionRecorder,RECORDER_STATES} from '../js/experiments/interactionRecorder.js';
import {ExperimentManager,EXPERIMENT_STATES} from '../js/core/experimentManager.js';
import {EXPERIMENT_TASKS,updateSampleFormValidation} from '../js/experiments/experimentTasks.js';
import {interactionFilename} from '../js/export/jsonExport.js';

const markup=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const panel=fs.readFileSync(new URL('../js/ui/experimentPanel.js',import.meta.url),'utf8');
assert.match(markup,/id="experiment-finish-bottom"[^>]*>Finish Experiment<\/button>/);
assert.match(markup,/id="experiment-task-title" tabindex="-1"/);
assert.match(markup,/id="experiment-end-heading" tabindex="-1"/);
assert.match(panel,/start\.addEventListener\('click',[\s\S]*?end\.hidden=false;q\('#experiment-finish-bottom'\)\.disabled=false;update\(\)/);
assert.match(panel,/function update\(\)[\s\S]*?end\.hidden=false;q\('#experiment-finish-bottom'\)\.disabled=false/);
assert.match(panel,/function cleanup\(hide=true\)[\s\S]*?end\.hidden=true/);
assert.match(panel,/#experiment-reset'[\s\S]*?end\.hidden=true;q\('#experiment-finish-bottom'\)\.disabled=true/);
assert.doesNotMatch(panel,/end\.hidden=!allComplete|disabled=!allComplete/);
assert.match(panel,/#experiment-end-heading/);

class Target { constructor(){this.handlers=new Map();this.scrollTop=0;this.scrollY=0;this.activeElement=null;} addEventListener(type,handler){if(!this.handlers.has(type))this.handlers.set(type,new Set());this.handlers.get(type).add(handler);} removeEventListener(type,handler){this.handlers.get(type)?.delete(handler);} emit(type,event={}){for(const handler of this.handlers.get(type)||[])handler(event);} count(){return [...this.handlers.values()].reduce((sum,set)=>sum+set.size,0);} }
const documentTarget=new Target(),sampleArea=new Target(),managementTarget={tagName:'BUTTON',id:'experiment-finish-bottom',getAttribute:()=>null,closest:selector=>selector==='[data-experiment-ui]'?{}:null};
sampleArea.contains=target=>target===sampleArea.sampleControl;
sampleArea.querySelectorAll=()=>[];
sampleArea.sampleControl={tagName:'BUTTON',id:'sample',tabIndex:0,getAttribute:()=>null,closest:()=>null};
let tick=0;
const recorder=new InteractionRecorder({eventTarget:documentTarget,clock:()=>tick,wallClock:()=>new Date(tick).toISOString()});
recorder.setTaskArea(sampleArea);recorder.prepare();recorder.startRecording();recorder.setCurrentTask('skip');
documentTarget.emit('focusin',{target:managementTarget});
assert.equal(recorder.events.length,0,'programmatic management focus is excluded');
documentTarget.scrollY=900;documentTarget.emit('scroll');
assert.equal(recorder.events.length,0,'dashboard scrolling is not observed');
sampleArea.scrollTop=120;recorder.recordScrollEvent();
assert.equal(recorder.events.at(-1).absoluteDistance,120,'sample-page scrolling is observed');
const eventsBeforeFinishActivation=recorder.events.length;
documentTarget.emit('click',{target:managementTarget,pointerType:'mouse',detail:1});
assert.equal(recorder.events.length,eventsBeforeFinishActivation,'Finish activation is excluded');
recorder.finishRecording();
assert.equal(recorder.state,RECORDER_STATES.FINISHED);assert.equal(documentTarget.count(),0);assert.equal(sampleArea.count(),0);

const attributes=new Map([['aria-invalid','true']]);const name={value:'sample',setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k)};const validation={textContent:''};
assert.equal(updateSampleFormValidation(name,validation),true);assert.equal(attributes.has('aria-invalid'),false);assert.equal(validation.textContent,'Sample form submitted.');

const longCode='P'.repeat(1000),stamp='2026-09-23T05:00:00Z';
const filename=interactionFilename('interaction-experiment',{participantCode:longCode,deviceClass:'smartphone',assistiveTechnologyCondition:'screen-reader',screenReader:'VoiceOver',trialNumber:1},stamp);
assert.match(filename,/^interaction-experiment_P{32}_smartphone_screen-reader_VoiceOver_trial-1_/);assert.ok(filename.endsWith('2026-09-23T05-00-00Z.json'));
assert.equal(EXPERIMENT_TASKS.length,20);

const target=new Target();const managerRecorder=new InteractionRecorder({eventTarget:target,scrollTarget:target,clock:()=>tick,wallClock:()=>new Date(tick).toISOString()});const manager=new ExperimentManager({recorder:managerRecorder,clock:()=>new Date(tick)});const config={confirmed:true,assistiveTechnologyCondition:'screen-reader',screenReader:'NVDA',deviceClass:'desktop'};
manager.prepareExperiment(config);manager.startExperiment();let result=manager.finishExperiment();assert.equal(result.tasks.filter(t=>t.completed).length,0);assert.equal(result.tasks[0].completed,false,'finishing during Task 1 does not complete it');manager.resetExperiment();
manager.prepareExperiment(config);manager.startExperiment();manager.completeTask();manager.advanceTask();result=manager.finishExperiment();assert.equal(result.tasks.filter(t=>t.completed).length,1);assert.equal(result.tasks[0].completed,true);assert.equal(result.tasks[1].completed,false,'finishing during Task 2 does not complete it');manager.resetExperiment();
for(let run=0;run<2;run++){manager.prepareExperiment(config);manager.startExperiment();for(let i=0;i<EXPERIMENT_TASKS.length;i++){manager.completeTask();if(i<EXPERIMENT_TASKS.length-1)manager.advanceTask();}const result=manager.finishExperiment();assert.equal(manager.state,EXPERIMENT_STATES.FINISHED);assert.equal(result.tasks.length,20);assert.equal(result.tasks.filter(t=>t.completed).length,20);assert.equal(result.rawEventsIncluded,false);assert.ok('focusWithoutPriorPointerCount'in result.aggregateFeatures.focusNavigation);assert.ok('pointerTypeCounts'in result.aggregateFeatures.pointerUsage);assert.ok('sequentialForwardTransitionCount'in result.aggregateFeatures.navigationSequentiality);assert.ok('observableJumpRatio'in result.aggregateFeatures.navigationSequentiality);assert.equal(Object.keys(result.perTaskFeatures).length,20);manager.resetExperiment();}
console.log('interaction regression tests passed');
