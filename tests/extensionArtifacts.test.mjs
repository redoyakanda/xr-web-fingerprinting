import assert from 'node:assert/strict';
import { DEFAULT_EXTENSION_ARTIFACT_DURATION_MS, isExtensionArtifactObservationActive, observeAccessibilityExtensionArtifacts } from '../js/collectors/accessibilityExtensionArtifacts.js';
import { buildExtensionArtifactFeatures } from '../js/ui/featureVector.js';
assert.equal(DEFAULT_EXTENSION_ARTIFACT_DURATION_MS, 2000);
assert.equal(isExtensionArtifactObservationActive(), false, 'import must not start observation');
let callback, disconnected=false, scheduled;
class FakeObserver { constructor(cb){callback=cb;} observe(_doc,options){assert.deepEqual(options,{childList:true,subtree:true,attributes:true,characterData:false});} disconnect(){disconnected=true;} }
const doc={querySelectorAll(){return [];}}; const scope={existing:true}; let clock=1000;
const promise=observeAccessibilityExtensionArtifacts({document:doc,globalScope:scope,MutationObserverImpl:FakeObserver,now:()=>clock,setTimeoutImpl:(fn,ms)=>{assert.equal(ms,2000);scheduled=fn;return 1;},clearTimeoutImpl:()=>{}});
assert.equal(isExtensionArtifactObservationActive(),true);
callback([{type:'attributes',target:{classList:[]},attributeName:'aria-label'}]); scope.injectedArtifact=true; clock=3000; scheduled();
const result=await promise;
assert.equal(disconnected,true); assert.equal(result.values.observerDisconnected,true); assert.equal(result.values.observationDurationMs,2000); assert.equal(result.values.accessibilityMutations.ariaMutationCount,1); assert.deepEqual(result.values.globalSurface.newGlobalPropertyNames,['injectedArtifact']); assert.equal(isExtensionArtifactObservationActive(),false);
callback([{type:'attributes',target:{classList:[]},attributeName:'role'}]); assert.equal(result.values.mutations.totalMutationCount,1,'completed observations ignore later callbacks');
assert.doesNotThrow(()=>JSON.stringify(result)); assert.equal(JSON.stringify(result).includes('textContent'),false); assert.ok(buildExtensionArtifactFeatures({performed:true,aggregateFeatures:result.values}).mutations);
console.log('extension artifact tests passed');
