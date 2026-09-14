export const EXPERIMENT_TASKS = Object.freeze([
  ['heading','heading-navigation','Find the research methods heading.','Navigate to the level-three “Research methods” heading.','experiment-methods-heading'],
  ['link','link-navigation','Locate the resources link.','Locate and activate the “Study resources” link.','experiment-resources-link'],
  ['button','button-activation','Activate the announcement.','Activate the “Publish sample announcement” button.','experiment-action-button'],
  ['form','form-navigation','Explore the form controls.','Navigate through the checkbox, radio group, and labelled fields.','experiment-form'],
  ['select','select-option','Choose the sample option.','Choose “Option beta” from the sample menu.','experiment-select'],
  ['dialog','dialog-navigation','Open and close the dialog.','Open the sample dialog, read it, and close it.','experiment-dialog-open'],
  ['table','table-navigation','Find a table value.','Find the value in row Beta, column Result.','experiment-table'],
  ['landmark','landmark-navigation','Locate landmark information.','Locate the study note in the complementary landmark.','experiment-aside'],
  ['skip','skip-link','Use the skip link.','Use the experiment skip link to move to the task content.','experiment-skip-link'],
  ['tabs','tab-navigation','Navigate the tabs.','Activate the second tab and review its panel.','experiment-tab-2'],
].map(([taskId,taskType,title,instructions,expectedTargetId])=>Object.freeze({taskId,taskType,title,instructions,expectedTargetId})));

export function createTaskStates(){return EXPERIMENT_TASKS.map(t=>({...t,startedAt:null,finishedAt:null,durationMs:null,completed:false,interactionCount:0}));}

export function renderExperimentTaskEnvironment(container){
  container.innerHTML=`<div class="experiment-environment"><a id="experiment-skip-link" class="skip-link" href="#experiment-task-content">Skip to experiment task content</a>
  <header><h1>Standardized interaction task page</h1><nav aria-label="Experiment navigation"><ul><li><a id="experiment-resources-link" href="#experiment-resources">Study resources</a></li><li><a href="#experiment-form">Sample form</a></li></ul></nav></header>
  <main id="experiment-task-content" tabindex="-1"><h2>Controlled content</h2><section aria-labelledby="experiment-methods-heading"><h3 id="experiment-methods-heading" tabindex="-1">Research methods</h3><h4>Task details</h4><ol><li>Follow the current instruction.</li><li>Work at a natural pace.</li></ol><ul><li>No personal data is required.</li></ul><button id="experiment-action-button" type="button" aria-label="Publish sample announcement">Publish sample announcement</button><p id="experiment-live" role="status" aria-live="polite"></p></section>
  <section id="experiment-resources"><h3>Study resources</h3><details><summary>Sample details</summary><p>Harmless controlled information.</p></details></section>
  <form id="experiment-form"><fieldset><legend>Sample controls</legend><label><input type="checkbox" id="experiment-checkbox"> Include sample</label><fieldset><legend>Sample category</legend><label><input type="radio" name="sample-category" value="alpha"> Alpha</label><label><input type="radio" name="sample-category" value="beta"> Beta</label></fieldset><label for="experiment-select">Sample option</label><select id="experiment-select"><option value="">Choose</option><option value="alpha">Option alpha</option><option value="beta">Option beta</option></select><label for="experiment-text">Harmless dummy text</label><input id="experiment-text" autocomplete="off"><label for="experiment-search">Harmless sample search</label><input id="experiment-search" type="search" autocomplete="off"><button type="submit">Validate sample form</button><p class="form-message" role="alert"></p></fieldset></form>
  <button id="experiment-dialog-open" type="button" aria-haspopup="dialog">Open sample dialog</button><dialog id="experiment-dialog" aria-labelledby="experiment-dialog-title"><h3 id="experiment-dialog-title">Sample dialog</h3><p>Controlled dialog content.</p><button id="experiment-dialog-close" type="button">Close dialog</button></dialog>
  <table id="experiment-table"><caption>Sample study results</caption><thead><tr><th>Group</th><th>Result</th></tr></thead><tbody><tr><th>Alpha</th><td>Ready</td></tr><tr><th>Beta</th><td>Complete</td></tr></tbody></table>
  <aside id="experiment-aside" aria-label="Study note" tabindex="-1"><h3>Study note</h3><p>The controlled landmark value is North.</p></aside>
  <section aria-label="Sample tabs"><div role="tablist" aria-label="Information views"><button id="experiment-tab-1" role="tab" aria-selected="true" aria-controls="experiment-panel-1">Overview</button><button id="experiment-tab-2" role="tab" aria-selected="false" aria-controls="experiment-panel-2" tabindex="-1">Details</button></div><div id="experiment-panel-1" role="tabpanel" aria-labelledby="experiment-tab-1">Overview panel.</div><div id="experiment-panel-2" role="tabpanel" aria-labelledby="experiment-tab-2" hidden>Details panel.</div></section></main></div>`;
  wireEnvironment(container);
}
function wireEnvironment(root){
  const q=id=>root.querySelector(`#${id}`); q('experiment-action-button').addEventListener('click',()=>q('experiment-live').textContent='Sample announcement published.');
  const dialog=q('experiment-dialog'); q('experiment-dialog-open').addEventListener('click',()=>dialog.showModal()); q('experiment-dialog-close').addEventListener('click',()=>dialog.close());
  q('experiment-form').addEventListener('submit',e=>{e.preventDefault();root.querySelector('.form-message').textContent=q('experiment-select').value?'Sample form valid.':'Choose a sample option.';});
  const tabs=[q('experiment-tab-1'),q('experiment-tab-2')]; tabs.forEach((tab,i)=>tab.addEventListener('click',()=>tabs.forEach((item,j)=>{item.setAttribute('aria-selected',String(i===j));item.tabIndex=i===j?0:-1;q(`experiment-panel-${j+1}`).hidden=i!==j;})));
}
