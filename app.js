
// ── DB ──────────────────────────────────────────────────────
const KEY='lifeos_v1';
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function loadDB(){try{return JSON.parse(localStorage.getItem(KEY))||defaultDB()}catch{return defaultDB()}}
function saveDB(d){localStorage.setItem(KEY,JSON.stringify(d))}
function defaultDB(){return{
  projects:{
    volund:{name:'Völund Watches',notes:'',emoji:'⚙'},
    forex:{name:'Forex Trading',notes:'',emoji:'↗'},
    photobooth:{name:'Photobooth',notes:'',emoji:'◎'},
    repairs:{name:'Repairs',notes:'',emoji:'⚒'},
    family:{name:'Family & Personal',notes:'',emoji:'⌂'},
  },
  repairCategories:['Car','House','Other'],
  tasks:[],reminders:[],
  tools:[
    {id:uid(),name:'Hammer',link:''},{id:uid(),name:'Screwdriver Set',link:''},
    {id:uid(),name:'Drill / Driver',link:''},{id:uid(),name:'Impact Wrench (DeWalt DCF921B)',link:''},
    {id:uid(),name:'Circular Saw',link:''},{id:uid(),name:'Tape Measure',link:''},
    {id:uid(),name:'Level',link:''},{id:uid(),name:'Pry Bar',link:''},
    {id:uid(),name:'Utility Knife',link:''},{id:uid(),name:'Kärcher Pressure Washer',link:''},
    {id:uid(),name:'Watch Case Back Opener',link:''},{id:uid(),name:'Watch Dial Removal Tool',link:''},
    {id:uid(),name:'Creality K1 Max 3D Printer',link:''},
  ],
  settings:{morningDigest:false,morningDigestTime:'08:00',notificationsEnabled:false}
}}

let db=loadDB();
let curView='dashboard',curProject=null,curRepairCat=null,activeTab='tasks';
const PROJ_GRADS=['pc-g1','pc-g2','pc-g3','pc-g4','pc-g5'];

// ── Router ──────────────────────────────────────────────────
function nav(view,project=null){
  curView=view;curProject=project;activeTab='tasks';

  render();updateNav();
}
function updateNav(){
  document.querySelectorAll('.ni').forEach(b=>{
    b.classList.remove('active');
    if(b.dataset.view===curView&&(!b.dataset.project||b.dataset.project===curProject))b.classList.add('active');
  });
  document.querySelectorAll('.bn-item').forEach(b=>{
    b.classList.remove('active');
    if(b.dataset.view===curView)b.classList.add('active');
  });
}

// ── Render ──────────────────────────────────────────────────
function render(){
  const vc=document.getElementById('vc');
  switch(curView){
    case'dashboard': vc.innerHTML=vDashboard();break;
    case'projects':  vc.innerHTML=vProjects();break;
    case'project':   vc.innerHTML=vProject(curProject);break;
    case'tools':     vc.innerHTML=vTools();break;
    case'reminders': vc.innerHTML=vReminders();break;
    case'archive':   vc.innerHTML=vArchive();break;
    case'export':    vc.innerHTML=vExport();break;
    default:         vc.innerHTML=vDashboard();
  }
}

// ── Dashboard ───────────────────────────────────────────────
function vDashboard(){
  const today=toDay();
  const open=db.tasks.filter(t=>!t.completed);
  const todayT=open.filter(t=>t.dueDate===today);
  const over=open.filter(t=>t.dueDate&&t.dueDate<today);
  const upcoming=open.filter(t=>t.dueDate&&t.dueDate>today).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,4);

  return`
  <div class="hero">
    <div class="hero-top">
      <div><div class="hero-title">Dashboard</div><div class="hero-date">${fmtDate(today)}</div></div>
      <div class="hero-actions"><button class="hero-btn primary" onclick="openAddTask(null)">+ Task</button></div>
    </div>
    <div class="hero-stats">
      <div class="hstat"><div class="hstat-n">${open.length}</div><div class="hstat-l">Open</div></div>
      <div class="hstat"><div class="hstat-n" style="color:${todayT.length>0?'#FFE8A0':'white'}">${todayT.length}</div><div class="hstat-l">Today</div></div>
      <div class="hstat"><div class="hstat-n" style="color:${over.length>0?'#FFBFB0':'white'}">${over.length}</div><div class="hstat-l">Overdue</div></div>
      <div class="hstat"><div class="hstat-n">${db.tasks.filter(t=>t.completed).length}</div><div class="hstat-l">Done</div></div>
    </div>
  </div>

  <div class="body">
    ${over.length>0?`<div class="section-label" style="color:var(--danger)">Overdue</div><div class="task-list" style="margin-bottom:24px">${over.map(t=>taskCard(t)).join('')}</div>`:''}

    ${todayT.length>0?`<div class="section-label">Due Today</div><div class="task-list" style="margin-bottom:24px">${todayT.map(t=>taskCard(t)).join('')}</div>`:''}

    <div class="section-label">Projects</div>
    <div class="proj-cards">
      ${Object.entries(db.projects).map(([k,p],i)=>{
        const ot=db.tasks.filter(t=>t.project===k&&!t.completed).length;
        const cost=projCost(k);
        const done=db.tasks.filter(t=>t.project===k&&t.completed).length;
        return`<div class="proj-card ${PROJ_GRADS[i%5]}" onclick="nav('project','${k}')">
          <div class="pc-dots">•••</div>
          <div class="pc-icon">${p.emoji||'◈'}</div>
          <div class="pc-body">
            <div class="pc-name">${p.name}</div>
            <div class="pc-sub">${ot} open task${ot!==1?'s':''}</div>
            <div class="pc-stats">
              <div class="pc-stat"><div class="v">${ot}</div><div class="l">tasks</div></div>
              <div class="pc-stat"><div class="v">${cost>0?'$'+cost.toFixed(0):'—'}</div><div class="l">cost</div></div>
              <div class="pc-stat"><div class="v">${done}</div><div class="l">done</div></div>
            </div>
          </div>
          <div class="pc-rank"><div class="pc-rank-n">${i+1}</div><div class="pc-rank-l">Area</div></div>
        </div>`
      }).join('')}
    </div>

    ${upcoming.length>0?`<div class="section-label">Upcoming</div><div class="task-list">${upcoming.map(t=>taskCard(t)).join('')}</div>`:''}
  </div>`;
}

// ── Projects list ────────────────────────────────────────────
function vProjects(){
  const totalOpen=db.tasks.filter(t=>!t.completed).length;
  const totalDone=db.tasks.filter(t=>t.completed).length;
  return`
  <div class="hero">
    <div class="hero-top">
      <div><div class="hero-title">Projects</div><div class="hero-date">All your areas</div></div>
      <button class="hero-btn primary" onclick="openAddTask(null)">+ Task</button>
    </div>
    <div class="hero-stats">
      <div class="hstat"><div class="hstat-n">${Object.keys(db.projects).length}</div><div class="hstat-l">Areas</div></div>
      <div class="hstat"><div class="hstat-n">${totalOpen}</div><div class="hstat-l">Open</div></div>
      <div class="hstat"><div class="hstat-n">${totalDone}</div><div class="hstat-l">Done</div></div>
    </div>
  </div>
  <div class="body">
    <div class="section-label">All Areas</div>
    <div class="proj-cards">
      ${Object.entries(db.projects).map(([k,p],i)=>{
        const ot=db.tasks.filter(t=>t.project===k&&!t.completed).length;
        const cost=projCost(k);
        const done=db.tasks.filter(t=>t.project===k&&t.completed).length;
        return`<div class="proj-card ${PROJ_GRADS[i%5]}" onclick="nav('project','${k}')">
          <div class="pc-dots">•••</div>
          <div class="pc-icon">${p.emoji||'◈'}</div>
          <div class="pc-body">
            <div class="pc-name">${p.name}</div>
            <div class="pc-sub">${ot} open task${ot!==1?'s':''}</div>
            <div class="pc-stats">
              <div class="pc-stat"><div class="v">${ot}</div><div class="l">tasks</div></div>
              <div class="pc-stat"><div class="v">${cost>0?'$'+cost.toFixed(0):'—'}</div><div class="l">cost</div></div>
              <div class="pc-stat"><div class="v">${done}</div><div class="l">done</div></div>
            </div>
          </div>
          <div class="pc-rank"><div class="pc-rank-n">${i+1}</div><div class="pc-rank-l">Area</div></div>
        </div>`
      }).join('')}
    </div>
  </div>`;
}

// ── Project ─────────────────────────────────────────────────
function vProject(key){
  const proj=db.projects[key];if(!proj)return'<p style="padding:24px">Not found</p>';
  const isR=key==='repairs';
  if(isR&&!curRepairCat)curRepairCat=db.repairCategories[0];
  const cat=isR?curRepairCat:null;
  const ft=arr=>isR?arr.filter(t=>t.project===key&&t.repairCat===cat):arr.filter(t=>t.project===key);
  const open=ft(db.tasks.filter(t=>!t.completed));
  const allCost=ft(db.tasks).reduce((s,t)=>s+(parseFloat(t.cost)||0),0);
  const totalCost=projCost(key);
  const idx=Object.keys(db.projects).indexOf(key);

  return`
  <div class="hero" style="background:var(--g${(idx%5)+1})">
    <div class="hero-top">
      <div>
        <div class="hero-title">${proj.emoji||'◈'} ${proj.name}</div>
        ${isR?`<div class="hero-date">Category: ${cat}</div>`:''}
      </div>
      <div class="hero-actions">
        <button class="hero-btn" onclick="shareProject('${key}')">Share</button>
        <button class="hero-btn primary" onclick="openAddTask('${key}')">+ Task</button>
      </div>
    </div>
    <div class="hero-stats">
      <div class="hstat"><div class="hstat-n">${open.length}</div><div class="hstat-l">Open</div></div>
      <div class="hstat"><div class="hstat-n">${db.tasks.filter(t=>t.project===key&&t.completed).length}</div><div class="hstat-l">Done</div></div>
      <div class="hstat"><div class="hstat-n">${allCost>0?'$'+allCost.toFixed(0):'—'}</div><div class="hstat-l">${isR?cat+' $':'Total $'}</div></div>
    </div>
  </div>
  <div class="body">
    ${isR?`<div class="sub-nav">${db.repairCategories.map(c=>`<button class="snb ${c===cat?'active':''}" onclick="setRC('${c}')">${c}</button>`).join('')}<button class="snb" onclick="addRC()">+ Add</button></div>`:''}
    <div class="tab-bar">
      <button class="tb ${activeTab==='tasks'?'active':''}" onclick="setTab('tasks')">Tasks</button>
      <button class="tb ${activeTab==='notes'?'active':''}" onclick="setTab('notes')">Notes</button>
    </div>
    ${activeTab==='tasks'?`
      <div class="task-list">
        ${open.length>0?open.map(t=>taskCard(t)).join(''):`<div class="empty"><p>No open tasks yet.</p><button class="btn btn-p" onclick="openAddTask('${key}')">+ Add First Task</button></div>`}
      </div>
    `:`
      <div class="fg"><label class="fl">Project Notes</label><textarea class="notes-area" id="pnotes" placeholder="Contacts, links, reference info, parts...">${esc(proj.notes||'')}</textarea></div>
      <button class="btn btn-p" onclick="saveNotes('${key}')">Save Notes</button>
    `}
  </div>`;
}

function setRC(c){curRepairCat=c;render()}
function setTab(t){activeTab=t;render()}
function saveNotes(k){db.projects[k].notes=document.getElementById('pnotes').value;saveDB(db);toast('Notes saved')}
function projCost(k){return db.tasks.filter(t=>t.project===k).reduce((s,t)=>s+(parseFloat(t.cost)||0),0)}

// ── Task card render ─────────────────────────────────────────
function taskCard(task){
  const proj=db.projects[task.project];
  const pc={'High':'hi','Medium':'med','Low':'lo'}[task.priority]||'lo';
  return`<div class="task-card ${task.completed?'done':''}" id="tc-${task.id}">
    <div class="tc-check ${task.completed?'on':''}" onclick="toggleTask('${task.id}')">${task.completed?'✓':''}</div>
    <div class="tc-body">
      <div class="tc-title">${esc(task.title)}</div>
      <div class="tc-tags">
        ${proj?`<span class="tc-tag">${proj.emoji||''} ${proj.name}${task.repairCat?' · '+task.repairCat:''}</span>`:''}
        <span class="tc-tag ${pc}">${task.priority||'Low'}</span>
        ${task.dueDate?`<span class="tc-tag">📅 ${fmtDate(task.dueDate)}</span>`:''}
        ${task.cost?`<span class="tc-tag">$${parseFloat(task.cost).toFixed(2)}</span>`:''}
        ${(task.tools||[]).length>0?`<span class="tc-tag">🔧 ${task.tools.join(', ')}</span>`:''}
      </div>
      ${task.notes?`<div class="tc-note">${esc(task.notes)}</div>`:''}
      ${(task.photos||[]).length>0?`<div class="photo-grid">${task.photos.map(p=>`<img class="photo-thumb" src="${p}" onclick="viewPhoto('${p}')" />`).join('')}</div>`:''}
    </div>
    <div class="tc-actions">
      <button class="tca" onclick="openEditTask('${task.id}')">✎</button>
      <button class="tca del" onclick="deleteTask('${task.id}')">✕</button>
    </div>
  </div>`
}

// ── Tools ────────────────────────────────────────────────────
function vTools(){
  return`
  <div class="hero" style="background:var(--g2)">
    <div class="hero-top">
      <div><div class="hero-title">⚒ Tool Inventory</div><div class="hero-date">${db.tools.length} tools</div></div>
      <button class="hero-btn primary" onclick="openAddTool()">+ Add Tool</button>
    </div>
  </div>
  <div class="body">
    ${db.tools.length>0?db.tools.map(t=>`
      <div class="tool-item">
        <div><div class="ti-name">${esc(t.name)}</div>${t.link?`<a class="ti-link" href="${esc(t.link)}" target="_blank">View / Buy ↗</a>`:''}</div>
        <div style="display:flex;gap:6px"><button class="tca" onclick="openEditTool('${t.id}')">✎</button><button class="tca del" onclick="deleteTool('${t.id}')">✕</button></div>
      </div>`).join('')
    :`<div class="empty"><p>No tools yet.</p></div>`}
  </div>`
}

// ── Reminders ────────────────────────────────────────────────
function vReminders(){
  const s=db.settings;
  const np=typeof Notification!=='undefined'?Notification.permission:'denied';
  return`
  <div class="hero" style="background:var(--g3)">
    <div class="hero-top">
      <div><div class="hero-title">◷ Reminders</div><div class="hero-date">${db.reminders.length} active</div></div>
      <button class="hero-btn primary" onclick="openAddReminder()">+ Add</button>
    </div>
  </div>
  <div class="body">
    <div class="tool-item" style="margin-bottom:16px;border-radius:var(--rl);flex-direction:column;align-items:flex-start;gap:10px">
      <div style="font-weight:600;font-size:14px">Morning Digest</div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
        <input type="checkbox" id="digt" ${s.morningDigest?'checked':''} onchange="toggleDigest()"/>
        Daily summary of tasks due today
      </label>
      <input type="time" class="fi" style="width:130px" id="digt-time" value="${s.morningDigestTime||'08:00'}" onchange="saveDigestTime()"/>
    </div>
    <div class="tool-item" style="margin-bottom:20px;border-radius:var(--rl)">
      <div>
        <div style="font-weight:600;font-size:14px">Notifications</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">${np==='granted'?'Enabled ✓':np==='denied'?'Blocked — enable in browser settings':'Not yet enabled'}</div>
      </div>
      ${np!=='granted'?`<button class="btn btn-s" onclick="reqNotif()">Enable</button>`:''}
    </div>
    <div class="section-label">Your Reminders</div>
    ${db.reminders.length>0?db.reminders.map(r=>`
      <div class="rem-item">
        <div class="ri-body"><div class="ri-title">${esc(r.title)}</div><div class="ri-meta">${fmtRem(r)}</div></div>
        <div style="display:flex;gap:6px"><button class="tca" onclick="openEditReminder('${r.id}')">✎</button><button class="tca del" onclick="deleteReminder('${r.id}')">✕</button></div>
      </div>`).join('')
    :`<div class="empty"><p>No reminders set yet.</p></div>`}
  </div>`
}
function fmtRem(r){const p=[];if(r.type==='once')p.push(`Once — ${fmtDate(r.date)} at ${r.time}`);if(r.type==='daily')p.push(`Every day at ${r.time}`);if(r.type==='weekly')p.push(`Every ${r.weekday} at ${r.time}`);if(r.type==='monthly')p.push(`Monthly day ${r.monthDay} at ${r.time}`);if(r.type==='custom')p.push(`Every ${r.intervalDays} days at ${r.time}`);if(r.project)p.push(db.projects[r.project]?.name||'');return p.join(' · ')}

// ── Archive ──────────────────────────────────────────────────
function vArchive(){
  const done=db.tasks.filter(t=>t.completed).sort((a,b)=>(b.completedAt||'').localeCompare(a.completedAt||''));
  return`
  <div class="hero" style="background:var(--g4)">
    <div class="hero-top">
      <div><div class="hero-title">✓ Completed</div><div class="hero-date">${done.length} task${done.length!==1?'s':''} archived</div></div>
      ${done.length>0?`<button class="hero-btn" onclick="clearArchive()">Clear All</button>`:''}
    </div>
  </div>
  <div class="body">
    ${done.length>0?`<div class="task-list">${done.map(t=>taskCard(t)).join('')}</div>`:`<div class="empty"><p>No completed tasks yet.</p></div>`}
  </div>`
}

// ── Export ───────────────────────────────────────────────────
function vExport(){
  return`
  <div class="hero" style="background:var(--g5)">
    <div class="hero-top">
      <div><div class="hero-title">↓ Export & Backup</div><div class="hero-date">Save or restore your data</div></div>
    </div>
  </div>
  <div class="body">
    <div class="exp-grid">
      <div class="exp-card">
        <div class="exp-title">JSON Backup</div>
        <div class="exp-desc">Full backup of all tasks, notes, reminders and settings.</div>
        <button class="btn btn-p" onclick="exportJSON()">Download JSON</button>
      </div>
      <div class="exp-card">
        <div class="exp-title">CSV Export</div>
        <div class="exp-desc">Export tasks in spreadsheet format.</div>
        <button class="btn btn-s" onclick="exportCSV()">Download CSV</button>
      </div>
      <div class="exp-card">
        <div class="exp-title">Restore Backup</div>
        <div class="exp-desc">Import a previously exported JSON file. This will replace all current data.</div>
        <input type="file" id="imp-file" accept=".json" style="display:none" onchange="importJSON(this)"/>
        <button class="btn btn-g" onclick="document.getElementById('imp-file').click()">Choose File</button>
      </div>
      <div class="exp-card">
        <div class="exp-title">Share Project</div>
        <div class="exp-desc">Copy a project summary to send via message or email.</div>
        <select class="fsel" id="sp-sel" style="margin-bottom:10px">${Object.entries(db.projects).map(([k,p])=>`<option value="${k}">${p.name}</option>`).join('')}</select>
        <button class="btn btn-s" onclick="copyProjSummary()">Copy Summary</button>
      </div>
    </div>
  </div>`
}

// ── Task modal ────────────────────────────────────────────────
function openAddTask(pk){
  openModal(`<div class="mh"><div class="mt">New Task</div><button class="ib" onclick="closeModal()">✕</button></div>
  ${taskForm(null,pk,pk==='repairs'?curRepairCat:null)}
  <div class="mf"><button class="btn btn-g" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="submitTask(null)">Add Task</button></div>`)
}
function openEditTask(id){
  const t=db.tasks.find(t=>t.id===id);if(!t)return;
  openModal(`<div class="mh"><div class="mt">Edit Task</div><button class="ib" onclick="closeModal()">✕</button></div>
  ${taskForm(t,t.project,t.repairCat)}
  <div class="mf"><button class="btn btn-g" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="submitTask('${id}')">Save</button></div>`)
}
function taskForm(task,pk,rc){
  const isR=pk==='repairs';
  return`
  <div class="fg"><label class="fl">Task Title</label><input type="text" class="fi" id="tf-title" value="${esc(task?.title||'')}" placeholder="What needs to be done?"/></div>
  <div class="fr">
    <div class="fg"><label class="fl">Project</label><select class="fsel" id="tf-proj" onchange="onProjCh(this)"><option value="">— None —</option>${Object.entries(db.projects).map(([k,p])=>`<option value="${k}" ${(pk===k||task?.project===k)?'selected':''}>${p.name}</option>`).join('')}</select></div>
    <div class="fg" id="tf-rc-g" style="${isR?'':'display:none'}"><label class="fl">Category</label><select class="fsel" id="tf-rc">${db.repairCategories.map(c=>`<option value="${c}" ${(rc===c||task?.repairCat===c)?'selected':''}>${c}</option>`).join('')}</select></div>
  </div>
  <div class="fr3">
    <div class="fg"><label class="fl">Priority</label><select class="fsel" id="tf-pri"><option value="High" ${task?.priority==='High'?'selected':''}>High</option><option value="Medium" ${task?.priority==='Medium'?'selected':''}>Medium</option><option value="Low" ${(!task||task?.priority==='Low')?'selected':''}>Low</option></select></div>
    <div class="fg"><label class="fl">Due Date</label><input type="date" class="fi" id="tf-due" value="${task?.dueDate||''}"/></div>
    <div class="fg"><label class="fl">Cost ($)</label><input type="number" class="fi" id="tf-cost" value="${task?.cost||''}" placeholder="0.00" step="0.01" min="0"/></div>
  </div>
  <div class="fg"><label class="fl">Tools Needed</label>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px" id="sel-tools">${(task?.tools||[]).map(t=>`<span class="tc-tag" style="cursor:pointer" data-tool="${esc(t)}">${esc(t)} <span onclick="this.parentElement.remove()">✕</span></span>`).join('')}</div>
    <select class="fsel" onchange="addToolSel(this)"><option value="">Add from inventory...</option>${db.tools.map(t=>`<option value="${esc(t.name)}">${esc(t.name)}</option>`).join('')}</select>
    <div style="display:flex;gap:8px;margin-top:6px"><input type="text" class="fi" id="tf-ctool" placeholder="Custom tool..."/><button type="button" class="btn btn-g" style="white-space:nowrap" onclick="addCustomTool()">Add</button></div>
  </div>
  <div class="fg"><label class="fl">Reminder</label>
    <div class="fr"><select class="fsel" id="tf-remtype" onchange="onRemCh('tf')"><option value="">None</option><option value="once" ${task?.reminder?.type==='once'?'selected':''}>Specific date & time</option><option value="daily" ${task?.reminder?.type==='daily'?'selected':''}>Every day</option><option value="weekly" ${task?.reminder?.type==='weekly'?'selected':''}>Every week</option><option value="monthly" ${task?.reminder?.type==='monthly'?'selected':''}>Every month</option><option value="custom" ${task?.reminder?.type==='custom'?'selected':''}>Custom interval</option></select>
    <input type="time" class="fi" id="tf-remtime" value="${task?.reminder?.time||'09:00'}"/></div>
    <div id="tf-remex" style="margin-top:8px"></div>
  </div>
  <div class="fg"><label class="fl">Notes</label><textarea class="fta" id="tf-notes" placeholder="Additional details...">${esc(task?.notes||'')}</textarea></div>
  <div class="fg"><label class="fl">Photos</label>
    <input type="file" id="tf-photos" accept="image/*" multiple style="display:none" onchange="handlePhotos(this)"/>
    <button type="button" class="btn btn-g" onclick="document.getElementById('tf-photos').click()">📷 Attach Photos</button>
    <div class="photo-grid" id="photo-prev">${(task?.photos||[]).map(p=>`<img class="photo-thumb" src="${p}" data-src="${p}"/>`).join('')}</div>
  </div>`
}
function onProjCh(s){document.getElementById('tf-rc-g').style.display=s.value==='repairs'?'':'none'}
function onRemCh(p){
  const t=document.getElementById(`${p}-remtype`).value;const ex=document.getElementById(`${p}-remex`);if(!ex)return;
  if(t==='once')ex.innerHTML=`<input type="date" class="fi" id="${p}-remdate" value="${toDay()}"/>`;
  else if(t==='weekly')ex.innerHTML=`<select class="fsel" id="${p}-remday">${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=>`<option>${d}</option>`).join('')}</select>`;
  else if(t==='monthly')ex.innerHTML=`<input type="number" class="fi" id="${p}-remmday" min="1" max="28" value="1" placeholder="Day of month"/>`;
  else if(t==='custom')ex.innerHTML=`<input type="number" class="fi" id="${p}-remint" min="1" value="7" placeholder="Every X days"/>`;
  else ex.innerHTML='';
}
function handlePhotos(inp){Array.from(inp.files).forEach(f=>{const r=new FileReader();r.onload=e=>{const p=document.getElementById('photo-prev');const img=document.createElement('img');img.className='photo-thumb';img.src=e.target.result;img.dataset.src=e.target.result;p.appendChild(img)};r.readAsDataURL(f)})}
function addToolSel(s){if(!s.value)return;addToolTag(s.value);s.value=''}
function addCustomTool(){const i=document.getElementById('tf-ctool');if(!i.value.trim())return;addToolTag(i.value.trim());i.value=''}
function addToolTag(name){const c=document.getElementById('sel-tools');const s=document.createElement('span');s.className='tc-tag';s.style.cursor='pointer';s.dataset.tool=name;s.innerHTML=`${esc(name)} <span onclick="this.parentElement.remove()">✕</span>`;c.appendChild(s)}
function getTools(){return Array.from(document.querySelectorAll('#sel-tools .tc-tag')).map(e=>e.dataset.tool||e.textContent.replace('✕','').trim())}

function submitTask(editId){
  const title=document.getElementById('tf-title').value.trim();if(!title){toast('Enter a task title');return}
  const rt=document.getElementById('tf-remtype').value;let reminder=null;
  if(rt){reminder={type:rt,time:document.getElementById('tf-remtime').value};
    if(rt==='once')reminder.date=document.getElementById('tf-remdate')?.value;
    if(rt==='weekly')reminder.weekday=document.getElementById('tf-remday')?.value;
    if(rt==='monthly')reminder.monthDay=document.getElementById('tf-remmday')?.value;
    if(rt==='custom')reminder.intervalDays=document.getElementById('tf-remint')?.value;
  }
  const ex=editId?db.tasks.find(t=>t.id===editId):null;
  const imgs=Array.from(document.querySelectorAll('#photo-prev img')).map(i=>i.dataset.src||i.src);
  const task={id:editId||uid(),title,project:document.getElementById('tf-proj').value,repairCat:document.getElementById('tf-rc')?.value||null,priority:document.getElementById('tf-pri').value,dueDate:document.getElementById('tf-due').value,cost:document.getElementById('tf-cost').value,tools:getTools(),notes:document.getElementById('tf-notes').value.trim(),photos:imgs,reminder,completed:ex?.completed||false,completedAt:ex?.completedAt||null,createdAt:ex?.createdAt||new Date().toISOString()};
  if(editId){const i=db.tasks.findIndex(t=>t.id===editId);db.tasks[i]=task}else db.tasks.push(task);
  saveDB(db);closeModal();render();toast(editId?'Task updated':'Task added')
}
function toggleTask(id){const t=db.tasks.find(t=>t.id===id);if(!t)return;t.completed=!t.completed;t.completedAt=t.completed?new Date().toISOString():null;saveDB(db);render();toast(t.completed?'Task completed ✓':'Task reopened')}
function deleteTask(id){if(!confirm('Delete this task?'))return;db.tasks=db.tasks.filter(t=>t.id!==id);saveDB(db);render();toast('Task deleted')}
function clearArchive(){if(!confirm('Clear all completed tasks?'))return;db.tasks=db.tasks.filter(t=>!t.completed);saveDB(db);render();toast('Archive cleared')}

// ── Tool modal ────────────────────────────────────────────────
function openAddTool(){openModal(`<div class="mh"><div class="mt">Add Tool</div><button class="ib" onclick="closeModal()">✕</button></div><div class="fg"><label class="fl">Tool Name</label><input type="text" class="fi" id="tn" placeholder="e.g. Angle Grinder"/></div><div class="fg"><label class="fl">Buy / Reference Link</label><input type="url" class="fi" id="tl" placeholder="https://..."/></div><div class="mf"><button class="btn btn-g" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="submitTool(null)">Add</button></div>`)}
function openEditTool(id){const t=db.tools.find(t=>t.id===id);if(!t)return;openModal(`<div class="mh"><div class="mt">Edit Tool</div><button class="ib" onclick="closeModal()">✕</button></div><div class="fg"><label class="fl">Tool Name</label><input type="text" class="fi" id="tn" value="${esc(t.name)}"/></div><div class="fg"><label class="fl">Buy / Reference Link</label><input type="url" class="fi" id="tl" value="${esc(t.link||'')}"/></div><div class="mf"><button class="btn btn-g" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="submitTool('${id}')">Save</button></div>`)}
function submitTool(editId){const name=document.getElementById('tn').value.trim();if(!name){toast('Enter tool name');return}const link=document.getElementById('tl').value.trim();if(editId){const t=db.tools.find(t=>t.id===editId);t.name=name;t.link=link}else db.tools.push({id:uid(),name,link});saveDB(db);closeModal();render();toast(editId?'Tool updated':'Tool added')}
function deleteTool(id){if(!confirm('Remove this tool?'))return;db.tools=db.tools.filter(t=>t.id!==id);saveDB(db);render();toast('Tool removed')}

// ── Reminder modal ────────────────────────────────────────────
function openAddReminder(){openModal(`<div class="mh"><div class="mt">New Reminder</div><button class="ib" onclick="closeModal()">✕</button></div>${remForm(null)}<div class="mf"><button class="btn btn-g" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="submitReminder(null)">Add</button></div>`)}
function openEditReminder(id){const r=db.reminders.find(r=>r.id===id);if(!r)return;openModal(`<div class="mh"><div class="mt">Edit Reminder</div><button class="ib" onclick="closeModal()">✕</button></div>${remForm(r)}<div class="mf"><button class="btn btn-g" onclick="closeModal()">Cancel</button><button class="btn btn-p" onclick="submitReminder('${id}')">Save</button></div>`)}
function remForm(r){return`
  <div class="fg"><label class="fl">Title</label><input type="text" class="fi" id="rem-title" value="${esc(r?.title||'')}" placeholder="What should I remind you about?"/></div>
  <div class="fr">
    <div class="fg"><label class="fl">Type</label><select class="fsel" id="rem-remtype" onchange="onRemCh('rem')"><option value="once" ${r?.type==='once'?'selected':''}>Once</option><option value="daily" ${r?.type==='daily'?'selected':''}>Every day</option><option value="weekly" ${r?.type==='weekly'?'selected':''}>Every week</option><option value="monthly" ${r?.type==='monthly'?'selected':''}>Every month</option><option value="custom" ${r?.type==='custom'?'selected':''}>Custom interval</option></select></div>
    <div class="fg"><label class="fl">Time</label><input type="time" class="fi" id="rem-remtime" value="${r?.time||'09:00'}"/></div>
  </div>
  <div id="rem-remex" style="margin-bottom:12px">${r?.type==='once'?`<input type="date" class="fi" id="rem-remdate" value="${r?.date||toDay()}"/>`:''}${r?.type==='weekly'?`<select class="fsel" id="rem-remday">${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=>`<option ${r?.weekday===d?'selected':''}>${d}</option>`).join('')}</select>`:''}${r?.type==='monthly'?`<input type="number" class="fi" id="rem-remmday" min="1" max="28" value="${r?.monthDay||1}"/>`:''}${r?.type==='custom'?`<input type="number" class="fi" id="rem-remint" min="1" value="${r?.intervalDays||7}" placeholder="Every X days"/>`:''}
  </div>
  <div class="fg"><label class="fl">Project (optional)</label><select class="fsel" id="rem-proj"><option value="">None</option>${Object.entries(db.projects).map(([k,p])=>`<option value="${k}" ${r?.project===k?'selected':''}>${p.name}</option>`).join('')}</select></div>
  <div class="fg"><label class="fl">Notes</label><textarea class="fta" id="rem-notes" placeholder="Additional context...">${esc(r?.notes||'')}</textarea></div>`}
function submitReminder(editId){
  const title=document.getElementById('rem-title').value.trim();if(!title){toast('Enter a reminder title');return}
  const type=document.getElementById('rem-remtype').value;
  const r={id:editId||uid(),title,type,time:document.getElementById('rem-remtime').value,project:document.getElementById('rem-proj').value,notes:document.getElementById('rem-notes').value.trim()};
  if(type==='once')r.date=document.getElementById('rem-remdate')?.value;
  if(type==='weekly')r.weekday=document.getElementById('rem-remday')?.value;
  if(type==='monthly')r.monthDay=document.getElementById('rem-remmday')?.value;
  if(type==='custom')r.intervalDays=document.getElementById('rem-remint')?.value;
  if(editId){const i=db.reminders.findIndex(r=>r.id===editId);db.reminders[i]=r}else db.reminders.push(r);
  saveDB(db);closeModal();render();toast(editId?'Reminder updated':'Reminder added');schedRem(r)
}
function deleteReminder(id){if(!confirm('Delete this reminder?'))return;db.reminders=db.reminders.filter(r=>r.id!==id);saveDB(db);render();toast('Reminder deleted')}
function toggleDigest(){db.settings.morningDigest=document.getElementById('digt').checked;saveDB(db);toast(db.settings.morningDigest?'Morning digest on':'Morning digest off')}
function saveDigestTime(){db.settings.morningDigestTime=document.getElementById('digt-time').value;saveDB(db);toast('Time saved')}
function addRC(){const n=prompt('New repair category:');if(!n||!n.trim())return;db.repairCategories.push(n.trim());saveDB(db);curRepairCat=n.trim();render()}
async function reqNotif(){if(typeof Notification==='undefined'){toast('Not supported here');return}const p=await Notification.requestPermission();db.settings.notificationsEnabled=p==='granted';saveDB(db);render();toast(p==='granted'?'Notifications enabled!':'Not granted')}

// ── Notifications ─────────────────────────────────────────────
function schedRem(r){
  if(typeof Notification==='undefined'||Notification.permission!=='granted')return;
  const now=new Date();const[h,m]=(r.time||'09:00').split(':').map(Number);let target=null;
  if(r.type==='once'&&r.date){target=new Date(r.date+'T'+r.time)}
  else if(r.type==='daily'){target=new Date();target.setHours(h,m,0,0);if(target<=now)target.setDate(target.getDate()+1)}
  else if(r.type==='weekly'&&r.weekday){const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];const td=days.indexOf(r.weekday);target=new Date();target.setHours(h,m,0,0);while(target.getDay()!==td||target<=now)target.setDate(target.getDate()+1)}
  if(target&&target>now)setTimeout(()=>{new Notification('Life OS — '+r.title,{body:r.notes||fmtRem(r),icon:'icons/icon-192.png'})},target-now)
}

// ── Export / Import ───────────────────────────────────────────
function exportJSON(){dl(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),`lifeos-backup-${toDay()}.json`)}
function exportCSV(){const h=['Title','Project','Category','Priority','Due','Cost','Tools','Notes','Done'];const r=db.tasks.map(t=>[t.title,db.projects[t.project]?.name||'',t.repairCat||'',t.priority||'',t.dueDate||'',t.cost||'',(t.tools||[]).join('; '),t.notes||'',t.completed?'Yes':'No']);const csv=[h,...r].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');dl(new Blob([csv],{type:'text/csv'}),`lifeos-tasks-${toDay()}.csv`)}
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click()}
function importJSON(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{const d=JSON.parse(e.target.result);if(!d.tasks||!d.projects)throw 0;if(!confirm('Replace all data?'))return;db=d;saveDB(db);render();toast('Restored!')}catch{toast('Invalid file')}};r.readAsText(f)}
function copyProjSummary(){const k=document.getElementById('sp-sel').value;const p=db.projects[k];const tasks=db.tasks.filter(t=>t.project===k&&!t.completed);const cost=projCost(k);let text=`${p.name} — Summary\n${new Date().toLocaleDateString()}\n\n`;tasks.forEach(t=>{text+=`[${t.priority}] ${t.title}${t.dueDate?' — Due '+fmtDate(t.dueDate):''}${t.cost?' — $'+parseFloat(t.cost).toFixed(2):''}\n`});if(cost>0)text+=`\nTotal: $${cost.toFixed(2)}`;if(p.notes)text+=`\nNotes:\n${p.notes}`;navigator.clipboard.writeText(text).then(()=>toast('Copied!'))}
function shareProject(key){const p=db.projects[key];const tasks=db.tasks.filter(t=>t.project===key&&!t.completed);let text=`${p.name} — ${new Date().toLocaleDateString()}\n\n`;tasks.forEach(t=>{text+=`[${t.priority}] ${t.title}${t.dueDate?' (Due '+fmtDate(t.dueDate)+')':''}\n`});navigator.clipboard.writeText(text).then(()=>toast('Copied!'))}
function viewPhoto(src){openModal(`<div class="mh"><div class="mt">Photo</div><button class="ib" onclick="closeModal()">✕</button></div><img src="${src}" style="width:100%;border-radius:var(--r);margin-top:8px"/>`)}

// ── Modal ─────────────────────────────────────────────────────
function openModal(html){document.getElementById('mc').innerHTML=html;document.getElementById('mo').classList.remove('h')}
function closeModal(){document.getElementById('mo').classList.add('h')}
let tt;function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.remove('h');clearTimeout(tt);tt=setTimeout(()=>el.classList.add('h'),2500)}

// ── Utils ─────────────────────────────────────────────────────
function toDay(){return new Date().toISOString().slice(0,10)}
function fmtDate(s){if(!s)return'';const[y,mo,d]=s.split('-');return`${mo}/${d}/${y}`}
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('sbt').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('collapsed'));
  document.querySelectorAll('.ni').forEach(b=>b.addEventListener('click',()=>{curRepairCat=null;nav(b.dataset.view,b.dataset.project||null)}));
  document.querySelectorAll('.bn-item').forEach(b=>b.addEventListener('click',()=>{curRepairCat=null;nav(b.dataset.view,null)}));
  document.getElementById('mo').addEventListener('click',e=>{if(e.target===document.getElementById('mo'))closeModal()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
  db.reminders.forEach(schedRem);
  render();
});

