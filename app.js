const AREAS = [
  'Frozen Foods', 'Dairy', 'Deli', 'Bakery', 'Meat', 'Produce',
  'Walk-In Cooler', 'Walk-In Freezer', 'Endcaps / Specialty Cases', 'Other'
];

const PART_CATALOG = {
  Anthony: {
    'Reach-In Glass Door 101 / ELM': [
      ['TM','Torque Master','Closer / Torque'], ['TMS','Torque Master Silver','Closer / Torque'], ['TR','Torque Rod','Closer / Torque'],
      ['HO','Hold Open Kit','Hold Open'], ['ZSS','Zip Strip Short','Zip Strip'], ['ZSL','Zip Strip Long','Zip Strip'],
      ['CPS','Contact Plate Short','Electrical / Contact'], ['CPL','Contact Plate Long','Electrical / Contact'],
      ['HS','Handle Silver','Handle'], ['HB','Handle Black','Handle'], ['3WHP','3 Wire Hinge Pin','Hinge'], ['NWHP','No Wire Hinge Pin','Hinge'],
      ['ACS','Access Cover Silver','Access Cover'], ['ACB','Access Cover Black','Access Cover'], ['SCL','Single Connector Left','Connector'],
      ['SCR','Single Connector Right','Connector'], ['DC','Double Connector','Connector'], ['G','Gasket','Gasket'], ['DTS','Door Track Short','Door Track'], ['DTL','Door Track Long','Door Track']
    ]
  },
  Hussmann: {
    'RL5': [
      ['BP','Bottom Plate','Plate'], ['TP','Top Plate','Plate'], ['HO','Hold Open Kit','Hold Open'], ['HPK','Hussmann Pin Kit','Hinge / Pin'],
      ['G','Gasket','Gasket'], ['HEP','Hussmann Electrical Plug','Electrical'], ['TR','Torque Rod','Closer / Torque'], ['H','Handle','Handle'],
      ['BPS','Bottom Plate Screw','Screws'], ['TPS','Top Plate Screw','Screws']
    ]
  },
  Styleline: {
    'Commercial Door': [
      ['HOSB','Handle Old Style Black','Handle'], ['HOSS','Handle Old Style Silver','Handle'], ['HNSB','Handle New Style Black','Handle'],
      ['HNSS','Handle New Style Silver','Handle'], ['OSDT','Old Style Door Tabs','Door Tabs'], ['NSDTB','New Style Door Tab Black','Door Tabs'],
      ['NSDTS','New Style Door Tab Silver','Door Tabs'], ['TRBK','Torque Rod Bushing Kit','Closer / Torque'], ['BHK','Bottom Hinge Kit','Hinge'],
      ['G','Gasket','Gasket'], ['HO','Hold Open Kit','Hold Open'], ['FRP','Field Repair Screw','Screws']
    ]
  },
  Generic: {
    'Generic Door': [
      ['G','Gasket','Generic Parts'], ['H','Handle','Generic Parts'], ['HINGE','Hinge','Generic Parts'], ['TR','Torque Rod / Closer','Generic Parts'],
      ['HO','Hold Open','Generic Parts'], ['GLASS','Glass','Generic Parts'], ['TRACK','Track','Generic Parts'], ['OTHER','Other / See Notes','Generic Parts']
    ]
  }
};


const CASE_PARTS = [
  ['T','Trim','Case Trim'], ['C','Corners','Case Trim'], ['FR','Floor Railing','Case Trim'], ['E','Ends','Case Trim'],
  ['COV','Covers','Case Components'], ['DP','Deck Pans','Case Components'], ['HCB','Honey Comb Black','Honey Comb'],
  ['HCW','Honey Comb White','Honey Comb'], ['CE','Case Ends','Case Components'], ['NS','Night Shades','Case Components'],
  ['M','Miscellaneous','Miscellaneous']
].map(([code,name,group]) => ({code,name,group}));

const CASE_BRANDS = ['Hillphoenix','Hussmann','Tyler','Zero Zone','Kysor Warren','Other','Unknown'];

const WALKIN_PARTS = [
  ['H','Handle','Hardware'], ['GSI','Gasket Screw In','Gasket'], ['GSN','Gasket Snap In','Gasket'], ['IPHF','Inside Push Handle Flush','Inside Handle'],
  ['IPHR','Inside Push Handle Recessed','Inside Handle'], ['DC','Door Closer','Closer'], ['DCO','Door Closer Offset','Closer'], ['LDC','Leak Detector Cover','Cover'],
  ['WBW','Wall Batten White','Battens'], ['WBR','Wall Batten Raw','Battens'], ['CBW','Corner Batten White','Battens'], ['CBR','Corner Batten Raw','Battens'],
  ['RBW','Roof Batten White','Battens'], ['RBR','Roof Batten Raw','Battens'], ['RSDH','Regent Sliding Door Handle','Brand Specific'],
  ['JSDGL','Jamison Sliding Door Gasket Long 9ft','Brand Specific'], ['JSDGS','Jamison Sliding Door Gasket Short 6ft','Brand Specific']
].map(([code,name,group]) => ({code,name,group}));

for (const brand in PART_CATALOG) {
  for (const model in PART_CATALOG[brand]) {
    PART_CATALOG[brand][model] = PART_CATALOG[brand][model].map(([code,name,group]) => ({ code, name, group }));
  }
}

const DEFAULT_DOOR = {
  gasket: 'Good', handle: 'Good', hinges: 'Good', torqueRod: 'Good', holdOpen: 'Good', alignment: 'Good',
  fogging: 'No', airLeak: 'No', heater: 'No', moisture: 'No', curtain: 'N/A', urgency: 'Normal',
  selectedParts: {}, notes: '', photoNotes: '', status: 'Draft'
};

const state = { audit: null, currentArea: null, currentRunId: null, currentDoorIndex: 0, tempRunPhotos: [], tempCasePhotos: [], tempWalkinPhotos: [] };
const app = document.getElementById('app');
document.getElementById('homeBtn').addEventListener('click', showHome);
app.addEventListener('click', handleClick);
app.addEventListener('change', handleChange);
app.addEventListener('input', handleChange);

function cloneTemplate(id){ app.innerHTML=''; app.appendChild(document.getElementById(id).content.cloneNode(true)); }
function saveLocal(){
  if(!state.audit) return;
  try {
    const lightweight = JSON.parse(JSON.stringify(state.audit, (key, value)=>{
      if(key === 'dataUrl') return '';
      return value;
    }));
    localStorage.setItem('coolerIQPrototypeV620', JSON.stringify(lightweight));
  } catch(err) {
    console.warn('Local save skipped:', err);
  }
}
function loadLocal(){ try { return JSON.parse(localStorage.getItem('coolerIQPrototypeV620') || 'null'); } catch { return null; } }
function newAudit(){ state.audit = { id: Date.now(), createdAt: new Date().toISOString(), store:{}, runs:[], walkins:[], version:'6.2.0' }; saveLocal(); showStore(); }
function showHome(){ cloneTemplate('homeTemplate'); }

function showStore(){
  cloneTemplate('storeTemplate'); const s=state.audit?.store||{};
  ['storeNumber','storeName','techName','cityState','contact','auditNotes','storePhotos'].forEach(id=>setVal(id,s[id]));
  setVal('chain', s.chain || 'Walmart');
  renderPhotoPreview('storePhotoPreview', s.photos || []);
}
function saveStore(){
  state.audit.store = { ...(state.audit.store||{}), storeNumber:getVal('storeNumber'), chain:getVal('chain'), storeName:getVal('storeName'), techName:getVal('techName'), cityState:getVal('cityState'), contact:getVal('contact'), storePhotos:getVal('storePhotos'), auditNotes:getVal('auditNotes'), date:new Date().toLocaleDateString() };
  saveLocal(); showAreas();
}
function showAreas(){
  cloneTemplate('areaTemplate'); const s=state.audit.store;
  document.getElementById('storeLine').textContent = `${s.chain||'Store'} ${s.storeNumber?'#'+s.storeNumber:''} ${s.cityState?'• '+s.cityState:''}`;
  const grid=document.getElementById('areaGrid');
  AREAS.forEach(area=>{
    const runCount=state.audit.runs.filter(r=>r.area===area).length;
    const wiCount=state.audit.walkins.filter(w=>w.area===area).length;
    const btn=document.createElement('button'); btn.dataset.action='selectArea'; btn.dataset.area=area;
    const label = isWalkinArea(area) ? `${wiCount} walk-in(s)` : `${runCount} run(s)`;
    btn.innerHTML = `${area}<br><span class="muted">${runCount||wiCount ? label+' started' : 'Start inspection'}</span>`;
    grid.appendChild(btn);
  });
}
function isWalkinArea(area){ return area === 'Walk-In Cooler' || area === 'Walk-In Freezer'; }
function showAreaEntry(area){ state.currentArea=area; isWalkinArea(area) ? showWalkin(area) : showRun(area); }

function showRun(area){
  cloneTemplate('runTemplate'); document.getElementById('runTitle').textContent=`Create Refrigeration Run: ${area}`;
  state.tempRunPhotos=[]; state.tempCasePhotos=[];
  renderModelOptions(); document.getElementById('doorBrand').addEventListener('change', renderModelOptions);
  renderCaseParts('casePartsCatalog', {});
  const nextCode = String.fromCharCode(65 + state.audit.runs.length);
  setVal('runCode', nextCode <= 'H' ? nextCode : 'A');
  const previous=[...state.audit.runs].reverse().find(r=>r.area===area) || state.audit.runs[state.audit.runs.length-1];
  if(previous){ ['doorBrand','doorModel','caseBrand','tempConcern','direction'].forEach(id=>setVal(id,previous[id])); renderModelOptions(); setVal('doorModel', previous.doorModel); }
}
function renderModelOptions(){
  const brand=getVal('doorBrand') || 'Anthony'; const select=document.getElementById('doorModel'); if(!select) return;
  const models=Object.keys(PART_CATALOG[brand] || {'Generic Door':[]});
  select.innerHTML=models.map(m=>`<option>${m}</option>`).join('');
}
function createRunFromForm(){
  if(!state.audit){ alert('No active audit found. Start a new audit first.'); return; }
  const doorCount=Math.max(0,Math.min(300,parseInt(getVal('doorCount'),10)||0));
  const runCode=getVal('runCode')||'A';
  const caseComponents = {
    brand:getVal('caseBrand'),
    model:getVal('caseModel'),
    serial:getVal('caseSerial'),
    selectedParts:collectCaseParts('casePartsCatalog'),
    photoNotes:getVal('casePhotoNotes'),
    photos:state.tempCasePhotos || []
  };
  const run={ id:String(Date.now()), type:'refrigeration-run', area:state.currentArea, runCode, runName:getVal('runName')||`${state.currentArea} Run ${runCode}`, doorCount, startPoint:getVal('startPoint'), direction:getVal('direction'), runPhotos:getVal('runPhotos'), photos:state.tempRunPhotos||[], doorBrand:getVal('doorBrand'), doorModel:getVal('doorModel'), caseBrand:getVal('caseBrand'), tempConcern:getVal('tempConcern'), caseComponents, runNotes:getVal('runNotes'), doors:Array.from({length:doorCount},(_,i)=>({...DEFAULT_DOOR, photos:[], doorNumber:i+1, repairId:`${runCode}-${String(i+1).padStart(2,'0')}`})) };
  state.audit.runs.push(run); state.currentRunId=run.id; state.currentDoorIndex=0; saveLocal();
  if(doorCount>0) showDoor(); else showSummary();
}

function showWalkin(area){
  cloneTemplate('walkinTemplate'); document.getElementById('walkinTitle').textContent=`Create ${area} Audit`;
  state.tempWalkinPhotos=[];
  setVal('walkinType', area); renderCheckboxParts('walkinPartsCatalog', WALKIN_PARTS, {});
}
function saveWalkin(){
  const selected = collectCheckedParts('walkinPartsCatalog');
  const walkin={ id:String(Date.now()), type:'walk-in', area:state.currentArea, code:getVal('walkinCode'), walkinType:getVal('walkinType'), name:getVal('walkinName'), brand:getVal('walkinBrand'), model:getVal('walkinModel'), serial:getVal('walkinSerial'), photos:getVal('walkinPhotos'), photoFiles:state.tempWalkinPhotos||[], urgency:getVal('walkinUrgency'), selectedParts:selected, notes:getVal('walkinNotes') };
  state.audit.walkins.push(walkin); saveLocal(); showReport();
}

function showDoor(){
  const run=getRun(); if(!run) return showAreas(); const door=run.doors[state.currentDoorIndex]; cloneTemplate('doorTemplate');
  document.getElementById('doorArea').textContent=run.area;
  document.getElementById('doorTitle').textContent=`Door ${door.repairId} (${door.doorNumber} of ${run.doorCount})`;
  document.getElementById('doorRun').textContent=`${run.runName} • Start: ${run.startPoint||'not entered'} • Direction: ${run.direction}`;
  document.getElementById('partsHint').textContent=`${run.doorBrand} ${run.doorModel} parts loaded. Use Generic when the door is unknown.`;
  document.querySelectorAll('[data-field]').forEach(input => input.value = door[input.dataset.field] ?? '');
  renderPartsCatalog(run, door); renderPhotoPreview('doorPhotoPreview', door.photos || []); updatePill(door);
}
function renderPartsCatalog(run, door){ const parts=(PART_CATALOG[run.doorBrand]||{})[run.doorModel] || []; renderCheckboxParts('partsCatalog', parts, door.selectedParts||{}); }
function renderCheckboxParts(containerId, parts, selected){
  const wrap=document.getElementById(containerId); if(!wrap) return;
  const groups=parts.reduce((acc,p)=>{(acc[p.group] ||= []).push(p); return acc;},{});
  wrap.innerHTML=Object.entries(groups).map(([group,items])=>`<div class="part-group"><h3>${group}</h3><div class="part-grid qty-mode">${items.map(p=>{ const qty=Number(selected[p.code]||0); return `<div class="part-chip part-qty-row"><span><strong>${p.code}</strong> ${p.name}</span><div class="qty-stepper"><button type="button" data-qty-minus="${p.code}">−</button><output data-part-output="${p.code}">${qty}</output><button type="button" data-qty-plus="${p.code}">+</button><input type="hidden" value="${qty}" data-part-qty="${p.code}"></div></div>`; }).join('')}</div></div>`).join('') || '<p class="muted">No parts loaded.</p>';
}

function renderCaseParts(containerId, selected){
  const wrap=document.getElementById(containerId); if(!wrap) return;
  wrap.innerHTML = `<div class="case-grid">` + CASE_PARTS.map(p=>{
    const data = selected[p.code] || {};
    return `<div class="case-part-row">
      <div class="case-label"><strong>${p.code}</strong> ${p.name}</div>
      <input type="number" min="0" step="0.1" placeholder="Qty / ft" value="${data.qty||''}" data-case-qty="${p.code}">
      <input placeholder="Width / size" value="${escapeHtml(data.width||'')}" data-case-width="${p.code}">
      <select data-case-color="${p.code}"><option value="">Color</option><option ${data.color==='Black'?'selected':''}>Black</option><option ${data.color==='White'?'selected':''}>White</option><option ${data.color==='Raw'?'selected':''}>Raw</option><option ${data.color==='Other'?'selected':''}>Other</option></select>
      <select data-case-hole="${p.code}"><option value="">Hole pattern</option><option ${data.hole==='None'?'selected':''}>None</option><option ${data.hole==='1/8 inch'?'selected':''}>1/8 inch</option><option ${data.hole==='1/4 inch'?'selected':''}>1/4 inch</option><option ${data.hole==='Other'?'selected':''}>Other</option></select>
      <input placeholder="Notes / measurements" value="${escapeHtml(data.notes||'')}" data-case-notes="${p.code}">
    </div>`;
  }).join('') + `</div>`;
}
function collectCaseParts(containerId){
  const wrap=document.getElementById(containerId); const selected={}; if(!wrap) return selected;
  CASE_PARTS.forEach(p=>{
    const code=p.code;
    const val=(attr)=>wrap.querySelector(`[${attr}="${code}"]`)?.value?.trim() || '';
    const data={qty:val('data-case-qty'), width:val('data-case-width'), color:val('data-case-color'), hole:val('data-case-hole'), notes:val('data-case-notes')};
    if(data.qty || data.width || data.color || data.hole || data.notes){
      selected[code]=data;
    }
  });
  return selected;
}
function renderPhotoPreview(containerId, photos){
  const wrap=document.getElementById(containerId); if(!wrap) return;
  wrap.innerHTML = (photos||[]).map((p,i)=>{
    const image = p.dataUrl ? `<img src="${p.dataUrl}" alt="${escapeHtml(p.name||'photo')}">` : `<div class="photo-placeholder">Photo saved for this session</div>`;
    return `<figure class="photo-thumb">${image}<figcaption>${escapeHtml(p.name||('Photo '+(i+1)))}<br><span>${Math.round((p.size||0)/1024)} KB</span></figcaption></figure>`;
  }).join('');
}
async function compressImageFile(file, maxWidth=1200, quality=.68){
  const dataUrl = await new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); });
  const img = await new Promise((resolve,reject)=>{ const im=new Image(); im.onload=()=>resolve(im); im.onerror=reject; im.src=dataUrl; });
  const scale=Math.min(1, maxWidth/img.width);
  const canvas=document.createElement('canvas'); canvas.width=Math.round(img.width*scale); canvas.height=Math.round(img.height*scale);
  const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,canvas.width,canvas.height);
  const compressed=canvas.toDataURL('image/jpeg', quality);
  return {name:file.name, dataUrl:compressed, size:Math.round((compressed.length*3)/4), originalSize:file.size, width:canvas.width, height:canvas.height};
}
async function handlePhotoInput(input){
  const files=[...(input.files||[])]; if(!files.length) return;
  let max=1200, q=.68;
  if(input.id==='runPhotoInput') { max=1600; q=.74; }
  if(input.id==='walkinPhotoInput') { max=1800; q=.78; }
  const processed=[];
  for(const f of files) processed.push(await compressImageFile(f,max,q));
  const mergePhotos=(existing, incoming)=>{
    const seen=new Set((existing||[]).map(p=>p.name+'|'+p.originalSize+'|'+p.width+'x'+p.height));
    const merged=[...(existing||[])];
    incoming.forEach(p=>{
      const key=p.name+'|'+p.originalSize+'|'+p.width+'x'+p.height;
      if(!seen.has(key)){ seen.add(key); merged.push(p); }
    });
    return merged;
  };
  if(input.id==='storePhotoInput'){ state.audit.store.photos=mergePhotos(state.audit.store.photos, processed); renderPhotoPreview('storePhotoPreview', state.audit.store.photos); }
  if(input.id==='runPhotoInput'){ state.tempRunPhotos=mergePhotos(state.tempRunPhotos, processed); renderPhotoPreview('runPhotoPreview', state.tempRunPhotos); }
  if(input.id==='casePhotoInput'){ state.tempCasePhotos=mergePhotos(state.tempCasePhotos, processed); renderPhotoPreview('casePhotoPreview', state.tempCasePhotos); }
  if(input.id==='doorPhotoInput'){ const d=getRun()?.doors[state.currentDoorIndex]; if(d){ d.photos=mergePhotos(d.photos, processed); renderPhotoPreview('doorPhotoPreview', d.photos); } }
  if(input.id==='walkinPhotoInput'){ state.tempWalkinPhotos=mergePhotos(state.tempWalkinPhotos, processed); renderPhotoPreview('walkinPhotoPreview', state.tempWalkinPhotos); }
  input.value='';
  saveLocal();
}
function collectCheckedParts(containerId){
  const wrap=document.getElementById(containerId); const selected={}; if(!wrap) return selected;
  wrap.querySelectorAll('[data-part-qty]').forEach(input=>{
    const code=input.dataset.partQty;
    const qty=Math.max(0,parseInt(input.value,10)||0);
    if(qty>0) selected[code]=qty;
  });
  return selected;
}

function saveCurrentDoor(){ const run=getRun(); if(!run) return; const d=run.doors[state.currentDoorIndex]; document.querySelectorAll('[data-field]').forEach(input=>d[input.dataset.field]=input.value); d.selectedParts=collectCheckedParts('partsCatalog'); d.status='Checked'; saveLocal(); }
function saveDoorAndNext(){ const run=getRun(); saveCurrentDoor(); if(state.currentDoorIndex<run.doors.length-1){ state.currentDoorIndex++; saveLocal(); showDoor(); } else showSummary(); }
function copyPreviousDoor(){ const run=getRun(); if(state.currentDoorIndex===0) return alert('This is the first door. Nothing to copy yet.'); const {doorNumber,repairId}=run.doors[state.currentDoorIndex]; run.doors[state.currentDoorIndex]={...run.doors[state.currentDoorIndex-1],doorNumber,repairId,status:'Checked'}; saveLocal(); showDoor(); }
function markDoorGood(){ const run=getRun(); const {doorNumber,repairId}=run.doors[state.currentDoorIndex]; run.doors[state.currentDoorIndex]={...DEFAULT_DOOR,doorNumber,repairId,status:'Checked'}; saveLocal(); showDoor(); }
function flagUrgent(){ const d=getRun().doors[state.currentDoorIndex]; d.urgency='Food Safety Concern'; d.status='Checked'; saveLocal(); showDoor(); }
function prevDoor(){ saveCurrentDoor(); if(state.currentDoorIndex>0) state.currentDoorIndex--; showDoor(); }
function getRun(){ return state.audit?.runs.find(r=>r.id===state.currentRunId) || state.audit?.runs[state.audit.runs.length-1]; }

function showSummary(){ const run=getRun(); cloneTemplate('summaryTemplate'); document.getElementById('summaryTitle').textContent=`${run.area}: ${run.runName}`; document.getElementById('summaryMeta').textContent=`Run ${run.runCode} • ${run.startPoint||'start not entered'} • ${run.direction} • ${run.doorCount} doors`; const stats=summarizeRun(run); document.getElementById('summaryStats').innerHTML=`<div class="stat"><strong>${stats.complete}</strong>Checked</div><div class="stat"><strong>${stats.good}</strong>Good</div><div class="stat"><strong>${stats.needs}</strong>Need Work</div><div class="stat"><strong>${stats.urgent}</strong>Urgent</div>`; const list=document.getElementById('doorList'); run.doors.forEach((door,index)=>{ const row=document.createElement('div'); row.className='door-row'; const issueText=doorNeedsWork(door)?buildIssueList(door).join(', '):'Good'; row.innerHTML=`<div><strong>Door ${door.repairId}</strong><br><span class="muted">${escapeHtml(issueText)}</span></div><button data-action="editDoor" data-index="${index}">Edit</button>`; list.appendChild(row); }); }

function showReport(){
  cloneTemplate('reportTemplate'); const s=state.audit.store; document.getElementById('reportStore').textContent=`${s.chain||''} ${s.storeNumber?'#'+s.storeNumber:''} • ${s.cityState||''}`; const content=document.getElementById('reportContent'); const totals=summarizeAudit(state.audit);
  content.innerHTML=`<div class="stats"><div class="stat"><strong>${totals.runs}</strong>Runs</div><div class="stat"><strong>${totals.doors}</strong>Reach-In Doors</div><div class="stat"><strong>${state.audit.walkins.length}</strong>Walk-Ins</div><div class="stat"><strong>${totals.photos}</strong>Photos</div><div class="stat"><strong>${totals.needs}</strong>Need Work</div></div>
  <div class="report-block"><h3>Parts Summary <span class="muted">(selected parts only)</span></h3><ul class="parts-list">${Object.entries(totals.parts).map(([k,v])=>`<li>${v} ${labelFor(k)}</li>`).join('')||'<li>No parts flagged yet.</li>'}</ul></div>`;
  state.audit.runs.forEach(run=>{
    const block=document.createElement('div'); block.className='report-block';
    const rows=run.doors.filter(doorNeedsWork).map(d=>`<li><strong>Door ${d.repairId}</strong>: ${escapeHtml(buildIssueList(d).join(', '))}${d.photoNotes?`<br><span class="muted">Photo notes: ${escapeHtml(d.photoNotes)}</span>`:''}${d.photos?.length?`<br><span class="muted">${d.photos.length} compressed photo(s) attached</span>`:''}${d.notes?`<br><span class="muted">Notes: ${escapeHtml(d.notes)}</span>`:''}</li>`).join('');
    const caseRows=formatCasePartsHtml(run.caseComponents?.selectedParts||{});
    block.innerHTML=`<h3>${run.area}: Run ${run.runCode} — ${run.runName}</h3><p class="muted">Start: ${escapeHtml(run.startPoint||'not entered')} • Direction: ${run.direction} • Run photos: ${(run.photos||[]).length} • Reference notes: ${escapeHtml(run.runPhotos||'not entered')}</p>
    <h4>Doors</h4><ul>${rows||'<li>All doors marked good or no reach-in doors in this run.</li>'}</ul>
    <h4>Case Components</h4><p class="muted">${escapeHtml(run.caseBrand||'Case')} • Model: ${escapeHtml(run.caseComponents?.model||'not entered')} • Serial: ${escapeHtml(run.caseComponents?.serial||'not entered')} • Case photos: ${(run.caseComponents?.photos||[]).length}</p><ul>${caseRows||'<li>No case components selected.</li>'}</ul>`;
    content.appendChild(block);
  });
  state.audit.walkins.forEach(w=>{ const block=document.createElement('div'); block.className='report-block'; block.innerHTML=`<h3>${w.area}: ${w.code} — ${escapeHtml(w.name||'Walk-In')}</h3><p class="muted">${w.brand} • Model: ${escapeHtml(w.model||'not entered')} • Serial: ${escapeHtml(w.serial||'not entered')} • Photos: ${(w.photoFiles||[]).length} • Notes: ${escapeHtml(w.photos||'not entered')}</p><ul>${Object.entries(w.selectedParts||{}).map(([c,q])=>`<li>${c} ${labelFor(c)} x${q}</li>`).join('')||'<li>No parts selected.</li>'}</ul>${w.notes?`<p>${escapeHtml(w.notes)}</p>`:''}`; content.appendChild(block); });
  document.getElementById('emailDraft').value = buildEmailDraft();
}
function buildEmailDraft(){ const s=state.audit.store; const totals=summarizeAudit(state.audit); let lines=[]; lines.push(`Subject: ${s.chain||'Store'} #${s.storeNumber||''} - Refrigeration Audit - ${s.date||''}`); lines.push(''); lines.push(`${s.chain||'Store'} ${s.storeNumber?'#'+s.storeNumber:''}`); lines.push(`${s.storeName||''} ${s.cityState?'• '+s.cityState:''}`); lines.push(`Audit Tech: ${s.techName||''}`); lines.push(''); lines.push(`Summary: ${totals.runs} refrigeration runs, ${totals.doors} reach-in doors, ${state.audit.walkins.length} walk-ins, ${totals.photos} compressed photos, ${totals.needs} items/doors needing work.`); lines.push(''); lines.push('Parts Summary (counted from selected parts only):'); Object.entries(totals.parts).forEach(([k,v])=>lines.push(`- ${labelFor(k)}: ${v}`)); if(!Object.keys(totals.parts).length) lines.push('- No parts flagged yet.'); lines.push(''); state.audit.runs.forEach(run=>{ lines.push(`${run.area} — Run ${run.runCode}: ${run.runName}`); lines.push(`Start: ${run.startPoint||'not entered'} | Direction: ${run.direction} | Run Photos: ${(run.photos||[]).length} | Reference Notes: ${run.runPhotos||'not entered'}`); run.doors.filter(doorNeedsWork).forEach(d=>lines.push(`- Door ${d.repairId}: ${buildIssueList(d).join(', ')}${d.photos?.length?' | Photos: '+d.photos.length:''}${d.photoNotes?' | Photo Notes: '+d.photoNotes:''}${d.notes?' | Notes: '+d.notes:''}`)); const caseParts=formatCasePartsText(run.caseComponents?.selectedParts||{}); if(caseParts.length){ lines.push('Case Components:'); lines.push(`Case: ${run.caseBrand||''} | Model: ${run.caseComponents?.model||'not entered'} | Serial: ${run.caseComponents?.serial||'not entered'} | Photos: ${(run.caseComponents?.photos||[]).length}`); caseParts.forEach(x=>lines.push(`- ${x}`)); } lines.push(''); }); state.audit.walkins.forEach(w=>{ lines.push(`${w.area} — ${w.code}: ${w.name||'Walk-In'}`); lines.push(`Brand: ${w.brand} | Model: ${w.model||'not entered'} | Serial: ${w.serial||'not entered'} | Photos: ${(w.photoFiles||[]).length} | Photo Notes: ${w.photos||'not entered'}`); Object.entries(w.selectedParts||{}).forEach(([c,q])=>lines.push(`- ${c} ${labelFor(c)} x${q}`)); if(w.notes) lines.push(`Notes: ${w.notes}`); lines.push(''); }); return lines.join('\n'); }

function handleClick(e){ const btn=e.target.closest('button'); if(!btn) return; if(btn.dataset.qtyPlus){ adjustPartQty(btn,1); return; } if(btn.dataset.qtyMinus){ adjustPartQty(btn,-1); return; } const a=btn.dataset.action; if(a==='newAudit') newAudit(); if(a==='continueAudit'){ const saved=loadLocal(); if(!saved) return alert('No saved prototype audit found yet.'); state.audit=saved; showAreas(); } if(a==='viewSubmitted'||a==='report'){ if(!state.audit) state.audit=loadLocal(); if(!state.audit) return alert('No saved prototype audit found yet.'); showReport(); } if(a==='settings'){ alert('Settings are placeholder-only in this prototype.'); } if(a==='saveStore') saveStore(); if(a==='selectArea') showAreaEntry(btn.dataset.area); if(a==='backAreas') showAreas(); if(a==='createRun') createRunFromForm(); if(a==='saveWalkin') saveWalkin(); if(a==='copyPrev') copyPreviousDoor(); if(a==='markGood') markDoorGood(); if(a==='flagUrgent') flagUrgent(); if(a==='saveNext') saveDoorAndNext(); if(a==='prevDoor') prevDoor(); if(a==='sectionSummary'){ saveCurrentDoor(); showSummary(); } if(a==='addRun') showRun(getRun().area); if(a==='editDoor'){ state.currentDoorIndex=Number(btn.dataset.index); showDoor(); } if(a==='downloadJson') downloadJson(); if(a==='downloadEmail') downloadEmail(); if(a==='submitAudit') submitAudit(); if(a==='copyEmail') copyEmail(); if(a==='openEmail') openEmailDraft(); if(a==='showDatabase') showDatabaseOutline(); if(a==='startFreshAudit') startFreshAudit(); if(a==='continueEditing') continueEditing(); if(a==='resetDemo') resetDemo(); }
async function handleChange(e){ if(e.target.matches('input[type="file"]')){ await handlePhotoInput(e.target); return; } const run=getRun(); if(!run) return; const door=run.doors[state.currentDoorIndex]; if(!door) return; if(e.target.matches('[data-part-qty]')){ door.selectedParts=collectCheckedParts('partsCatalog'); door.status='Checked'; saveLocal(); } if(e.target.matches('[data-field]')){ door[e.target.dataset.field]=e.target.value; door.status='Checked'; updatePill(door); saveLocal(); } }


function adjustPartQty(btn, delta){
  const code=btn.dataset.qtyPlus || btn.dataset.qtyMinus;
  const wrap=btn.closest('#partsCatalog, #walkinPartsCatalog');
  if(!wrap || !code) return;
  const input=wrap.querySelector(`[data-part-qty="${code}"]`);
  const output=wrap.querySelector(`[data-part-output="${code}"]`);
  const next=Math.max(0,(parseInt(input?.value,10)||0)+delta);
  if(input) input.value=next;
  if(output) output.textContent=next;
  if(wrap.id==='partsCatalog'){
    const d=getRun()?.doors[state.currentDoorIndex];
    if(d){ d.selectedParts=collectCheckedParts('partsCatalog'); d.status='Checked'; updatePill(d); saveLocal(); }
  }
}
function summarizeRun(run){ const complete=run.doors.filter(d=>d.status==='Checked').length; const good=run.doors.filter(d=>d.status==='Checked'&&!doorNeedsWork(d)).length; const needs=run.doors.filter(doorNeedsWork).length; const urgent=run.doors.filter(d=>d.urgency==='High'||d.urgency==='Food Safety Concern').length; return {complete,good,needs,urgent}; }
function summarizeAudit(audit){ const totals={runs:audit.runs.length,doors:0,needs:0,urgent:0,photos:(audit.store?.photos||[]).length,parts:{}}; audit.runs.forEach(run=>{ totals.doors+=run.doors.length; totals.photos+=(run.photos||[]).length+(run.caseComponents?.photos||[]).length; run.doors.forEach(d=>{ totals.photos+=(d.photos||[]).length; if(doorNeedsWork(d)) totals.needs++; if(d.urgency==='High'||d.urgency==='Food Safety Concern') totals.urgent++; Object.entries(d.selectedParts||{}).forEach(([c,q])=>{ if(Number(q)>0) totals.parts[c]=(totals.parts[c]||0)+Number(q||0); }); }); Object.entries(run.caseComponents?.selectedParts||{}).forEach(([c,data])=>{ const n=parseFloat(data.qty)||1; totals.parts[c]=(totals.parts[c]||0)+n; totals.needs++; }); }); audit.walkins.forEach(w=>{ totals.photos+=(w.photoFiles||[]).length; Object.entries(w.selectedParts||{}).forEach(([c,q])=>{ if(Number(q)>0) totals.parts[c]=(totals.parts[c]||0)+Number(q||0); }); }); return totals; }
function doorNeedsWork(d){ return buildIssueList(d).length>0 || d.urgency==='High' || d.urgency==='Food Safety Concern'; }
function buildIssueList(d){
  const inspection=[]; const parts=[];
  for(const [field,value] of Object.entries(d)){
    if(isIssue(field,value)) inspection.push(`${labelFor(field)}: ${value}`);
  }
  Object.entries(d.selectedParts||{}).forEach(([code,qty])=>{
    if(Number(qty)>0) parts.push(`${code} ${labelFor(code)} x${qty}`);
  });
  if(parts.length && inspection.length) return [`Parts: ${parts.join(', ')}`, `Inspection flags: ${inspection.join(', ')}`];
  if(parts.length) return [`Parts: ${parts.join(', ')}`];
  if(inspection.length) return [`Inspection flags: ${inspection.join(', ')}`];
  return [];
}
function isIssue(field,value){ if(!value) return false; if(['doorNumber','repairId','status','notes','photoNotes','urgency','selectedParts'].includes(field)) return false; if(['Good','No','N/A','Normal'].includes(value)) return false; return true; }
function labelFor(field){ const labels={gasket:'Gaskets',handle:'Handles',hinges:'Hinge Sets',torqueRod:'Torque Rods / Closers',holdOpen:'Hold-Opens',alignment:'Door Alignment',fogging:'Glass Fogging',airLeak:'Air Leaks',heater:'Frame Heater Issues',moisture:'Dryer / Moisture Issues',curtain:'Curtains / Strips'}; const p=findPart(field); return p?p.name:(labels[field]||field); }
function findPart(code){ for(const brand of Object.values(PART_CATALOG)){ for(const parts of Object.values(brand)){ const m=parts.find(p=>p.code===code); if(m) return m; } } return WALKIN_PARTS.find(p=>p.code===code)||CASE_PARTS.find(p=>p.code===code)||null; }
function updatePill(d){ const pill=document.getElementById('doorStatusPill'); if(!pill) return; pill.className='pill'; if(d.urgency==='High'||d.urgency==='Food Safety Concern'){ pill.textContent=d.urgency; pill.classList.add('urgent'); } else if(d.status==='Checked'&&!doorNeedsWork(d)){ pill.textContent='Good'; pill.classList.add('good'); } else if(d.status==='Checked') pill.textContent='Needs Work'; else pill.textContent='Draft'; }
function downloadJson(){ downloadFile(`store-${state.audit.store.storeNumber||'audit'}-refrigeration-report.json`, JSON.stringify(state.audit,null,2), 'application/json'); }
function downloadEmail(){ downloadFile(`store-${state.audit.store.storeNumber||'audit'}-email-draft.txt`, buildEmailDraft(), 'text/plain'); }
function downloadFile(name, content, type){ const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
function resetDemo(){ if(!confirm('Reset this prototype audit?')) return; localStorage.removeItem('coolerIQPrototypeV620'); state.audit=null; 

function showSubmitted(){
  cloneTemplate('submittedTemplate');
  const s=state.audit?.store||{};
  const line=[s.chain, s.storeNumber?'#'+s.storeNumber:'', s.storeName, s.cityState].filter(Boolean).join(' ');
  const el=document.getElementById('submittedStore');
  if(el) el.textContent=line || 'Audit submitted';
}
function startFreshAudit(){
  if(!confirm('Start a new audit? This clears the current prototype audit from this device. Download or copy the report first if needed.')) return;
  localStorage.removeItem('coolerIQPrototypeV620');
  state.audit=null;
  state.currentArea=null;
  state.currentRunId=null;
  state.currentDoorIndex=0;
  state.tempRunPhotos=[];
  state.tempCasePhotos=[];
  state.tempWalkinPhotos=[];
  newAudit();
}
function continueEditing(){
  if(state.audit) state.audit.status='Draft';
  saveLocal();
  showReport();
}

function formatCasePartsText(parts){
  return Object.entries(parts||{}).map(([code,d])=>{
    const bits=[`${code} ${labelFor(code)}`];
    if(d.qty) bits.push(`qty/ft: ${d.qty}`);
    if(d.width) bits.push(`width/size: ${d.width}`);
    if(d.color) bits.push(`color: ${d.color}`);
    if(d.hole) bits.push(`hole: ${d.hole}`);
    if(d.notes) bits.push(`notes: ${d.notes}`);
    return bits.join(' | ');
  });
}
function formatCasePartsHtml(parts){
  return formatCasePartsText(parts).map(x=>`<li>${escapeHtml(x)}</li>`).join('');
}
function submitAudit(){
  if(!state.audit) return;
  state.audit.status='Submitted';
  state.audit.submittedAt=new Date().toISOString();
  saveLocal();
  showSubmitted();
}
function copyEmail(){ const text=buildEmailDraft(); navigator.clipboard?.writeText(text).then(()=>alert('Email summary copied.')).catch(()=>alert('Copy failed. Use Download Email Text instead.')); }
function openEmailDraft(){ const s=state.audit.store||{}; const subject=encodeURIComponent(`${s.chain||'Store'} #${s.storeNumber||''} - Refrigeration Audit`); const body=encodeURIComponent(buildEmailDraft().replace(/^Subject:.*\n\n/,'')); window.location.href=`mailto:?subject=${subject}&body=${body}`; }
function showDatabaseOutline(){
  cloneTemplate('reportTemplate');
  document.getElementById('reportStore').textContent='Future production backend structure';
  document.getElementById('reportContent').innerHTML=`<div class="report-block"><h3>Database Structure - First Pass</h3><ul>
    <li>Companies / tenants</li><li>Users and roles</li><li>Stores</li><li>Audits</li><li>Areas</li><li>Runs / fixtures</li><li>Doors</li><li>Case components</li><li>Walk-ins</li><li>Parts</li><li>Compressed photos</li><li>Reports / submissions</li>
  </ul><p class="muted">The production version would store this in Supabase or a similar backend, with photos compressed in the browser before upload.</p></div>`;
  document.getElementById('emailDraft').value='Production database outline only. No audit email draft on this screen.';
}

showHome(); }
function getVal(id){ return document.getElementById(id)?.value?.trim() || ''; }
function setVal(id,val){ const el=document.getElementById(id); if(el && val!==undefined) el.value=val; }
function escapeHtml(str){ return String(str).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function formatCasePartsText(parts){
  return Object.entries(parts||{}).map(([code,d])=>{
    const bits=[`${code} ${labelFor(code)}`];
    if(d.qty) bits.push(`qty/ft: ${d.qty}`);
    if(d.width) bits.push(`width/size: ${d.width}`);
    if(d.color) bits.push(`color: ${d.color}`);
    if(d.hole) bits.push(`hole: ${d.hole}`);
    if(d.notes) bits.push(`notes: ${d.notes}`);
    return bits.join(' | ');
  });
}
function formatCasePartsHtml(parts){
  return formatCasePartsText(parts).map(x=>`<li>${escapeHtml(x)}</li>`).join('');
}
function submitAudit(){
  const email=buildEmailDraft();
  const status=document.createElement('div'); status.className='report-block submit-status'; status.innerHTML='<h3>Audit Ready to Submit</h3><p>This prototype prepares the audit package locally. For production, this button will send the audit, compressed photos, and parts list to the office dashboard/database.</p><p><strong>Current demo options:</strong> copy email summary, download report data, or open email draft.</p>';
  document.getElementById('reportContent')?.prepend(status);
  navigator.clipboard?.writeText(email).catch(()=>{});
}
function copyEmail(){ const text=buildEmailDraft(); navigator.clipboard?.writeText(text).then(()=>alert('Email summary copied.')).catch(()=>alert('Copy failed. Use Download Email Text instead.')); }
function openEmailDraft(){ const s=state.audit.store||{}; const subject=encodeURIComponent(`${s.chain||'Store'} #${s.storeNumber||''} - Refrigeration Audit`); const body=encodeURIComponent(buildEmailDraft().replace(/^Subject:.*\n\n/,'')); window.location.href=`mailto:?subject=${subject}&body=${body}`; }
function showDatabaseOutline(){
  cloneTemplate('reportTemplate');
  document.getElementById('reportStore').textContent='Future production backend structure';
  document.getElementById('reportContent').innerHTML=`<div class="report-block"><h3>Database Structure - First Pass</h3><ul>
    <li>Companies / tenants</li><li>Users and roles</li><li>Stores</li><li>Audits</li><li>Areas</li><li>Runs / fixtures</li><li>Doors</li><li>Case components</li><li>Walk-ins</li><li>Parts</li><li>Compressed photos</li><li>Reports / submissions</li>
  </ul><p class="muted">The production version would store this in Supabase or a similar backend, with photos compressed in the browser before upload.</p></div>`;
  document.getElementById('emailDraft').value='Production database outline only. No audit email draft on this screen.';
}

showHome();
