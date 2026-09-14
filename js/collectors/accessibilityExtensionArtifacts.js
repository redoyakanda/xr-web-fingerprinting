export const DEFAULT_EXTENSION_ARTIFACT_DURATION_MS = 2000;
let activeObservation = null;
const counts = () => ({ totalMutationCount:0, addedNodeCount:0, removedNodeCount:0, attributeMutationCount:0, textMutationCount:0, uniqueModifiedAttributes:[], classAttributeMutationCount:0, styleAttributeMutationCount:0, injectedCssClassNames:[] });
const snapshot = (d) => ({ styles:d.querySelectorAll('style').length, scripts:d.querySelectorAll('script').length, stylesheets:d.querySelectorAll('link[rel~="stylesheet" i]').length });
const globalNames = (scope) => { try { return new Set(Object.getOwnPropertyNames(scope)); } catch { return null; } };
const descendants = (node) => node?.nodeType === 1 ? [node, ...(node.querySelectorAll?.('*') || [])] : [];
function hidden(el, scope) { if (el.hidden || el.getAttribute?.('aria-hidden') === 'true') return true; try { const s=scope.getComputedStyle(el); return s.display==='none'||s.visibility==='hidden'; } catch { return false; } }
function offscreen(el) { try { const r=el.getBoundingClientRect(); return r.right<0||r.bottom<0; } catch { return false; } }
function emptySummary(duration) { return { observationStartedAt:null, observationFinishedAt:null, observationDurationMs:null, configuredDurationMs:duration, observerDisconnected:false,
  mutations:counts(), accessibilityMutations:{ariaMutationCount:0,roleMutationCount:0,tabindexMutationCount:0,ariaLabelMutationCount:0,ariaDescribedByMutationCount:0,liveRegionMutationCount:0},
  injectedElements:{styleElementCount:0,scriptElementCount:0,stylesheetLinkCount:0,styleElementCountChange:0,scriptElementCountChange:0,stylesheetLinkCountChange:0,customElementNames:[],shadowHostCandidateCount:0,hiddenElementCount:0,offscreenElementCount:0},
  globalSurface:{checked:false,newGlobalPropertyNames:[]}, warnings:[] }; }

// Explicitly invoked bounded measurement; this is deliberately not a passive collector.
export function observeAccessibilityExtensionArtifacts(options={}) {
  const duration=Number.isFinite(options.durationMs)?Math.max(0,options.durationMs):DEFAULT_EXTENSION_ARTIFACT_DURATION_MS;
  const doc=options.document||globalThis.document, scope=options.globalScope||globalThis.window||globalThis, Observer=options.MutationObserverImpl||globalThis.MutationObserver;
  const now=options.now||(()=>Date.now()), setTimer=options.setTimeoutImpl||setTimeout, clearTimer=options.clearTimeoutImpl||clearTimeout, ignoredRoot=options.ignoredRoot||null;
  const values=emptySummary(duration);
  if(!doc||!Observer) return Promise.resolve({category:'accessibilityExtensionArtifacts',supported:false,values,warnings:['MutationObserver is unavailable.'],errors:[]});
  if(activeObservation) activeObservation.stop('A new observation replaced the active observation.');
  const baseline=snapshot(doc), before=globalNames(scope), attributes=new Set(), classes=new Set(), custom=new Set(); values.globalSurface.checked=Boolean(before);
  const started=now(); values.observationStartedAt=new Date(started).toISOString(); const ignored=(n)=>ignoredRoot&&(n===ignoredRoot||ignoredRoot.contains?.(n)); let finished=false;
  const observer=new Observer((records)=>{ if(finished)return; for(const record of records){ if(ignored(record.target)) continue; values.mutations.totalMutationCount++;
    if(record.type==='attributes'){ values.mutations.attributeMutationCount++; const name=String(record.attributeName||'').toLowerCase(); if(name) attributes.add(name);
      if(name==='class'){values.mutations.classAttributeMutationCount++; record.target.classList&&[...record.target.classList].forEach(v=>classes.add(v));} if(name==='style') values.mutations.styleAttributeMutationCount++;
      if(name.startsWith('aria-')) values.accessibilityMutations.ariaMutationCount++; if(name==='role') values.accessibilityMutations.roleMutationCount++; if(name==='tabindex') values.accessibilityMutations.tabindexMutationCount++;
      if(name==='aria-label'||name==='aria-labelledby') values.accessibilityMutations.ariaLabelMutationCount++; if(name==='aria-describedby') values.accessibilityMutations.ariaDescribedByMutationCount++;
      if(['aria-live','aria-atomic','aria-relevant','aria-busy'].includes(name)) values.accessibilityMutations.liveRegionMutationCount++;
    } else if(record.type==='childList'){ values.mutations.addedNodeCount+=record.addedNodes.length; values.mutations.removedNodeCount+=record.removedNodes.length;
      for(const node of record.addedNodes){if(ignored(node))continue; for(const el of descendants(node)){const tag=el.localName?.toLowerCase()||''; if(tag==='style')values.injectedElements.styleElementCount++; if(tag==='script')values.injectedElements.scriptElementCount++;
        if(tag==='link'&&String(el.rel||'').toLowerCase().split(/\s+/).includes('stylesheet'))values.injectedElements.stylesheetLinkCount++; if(tag.includes('-'))custom.add(tag); if(el.shadowRoot)values.injectedElements.shadowHostCandidateCount++;
        if(hidden(el,scope))values.injectedElements.hiddenElementCount++; if(offscreen(el))values.injectedElements.offscreenElementCount++; el.classList&&[...el.classList].forEach(v=>classes.add(v));
        for(const addedName of (el.getAttributeNames?.()||[]).map(n=>n.toLowerCase())){if(addedName.startsWith('aria-'))values.accessibilityMutations.ariaMutationCount++;if(addedName==='role')values.accessibilityMutations.roleMutationCount++;if(addedName==='tabindex')values.accessibilityMutations.tabindexMutationCount++;if(addedName==='aria-label'||addedName==='aria-labelledby')values.accessibilityMutations.ariaLabelMutationCount++;if(addedName==='aria-describedby')values.accessibilityMutations.ariaDescribedByMutationCount++;if(['aria-live','aria-atomic','aria-relevant','aria-busy'].includes(addedName))values.accessibilityMutations.liveRegionMutationCount++;}
      }}
    } else if(record.type==='characterData') values.mutations.textMutationCount++;
  }});
  observer.observe(doc,{childList:true,subtree:true,attributes:true,characterData:false});
  return new Promise((resolve)=>{let timer; const stop=(warning)=>{if(finished)return; finished=true;clearTimer(timer);observer.disconnect();values.observerDisconnected=true;const ended=now();values.observationFinishedAt=new Date(ended).toISOString();values.observationDurationMs=Math.max(0,Math.round(ended-started));
    values.mutations.uniqueModifiedAttributes=[...attributes].sort();values.mutations.injectedCssClassNames=[...classes].sort();values.injectedElements.customElementNames=[...custom].sort();const after=snapshot(doc);values.injectedElements.styleElementCountChange=after.styles-baseline.styles;values.injectedElements.scriptElementCountChange=after.scripts-baseline.scripts;values.injectedElements.stylesheetLinkCountChange=after.stylesheets-baseline.stylesheets;
    if(before)values.globalSurface.newGlobalPropertyNames=[...(globalNames(scope)||[])].filter(n=>!before.has(n)).sort();if(warning)values.warnings.push(warning);activeObservation=null;resolve({category:'accessibilityExtensionArtifacts',supported:true,values,warnings:[...values.warnings],errors:[]});};timer=setTimer(stop,duration);activeObservation={stop};});
}
export function isExtensionArtifactObservationActive(){return activeObservation!==null;}
