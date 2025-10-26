
const DBKEY='mpb_v7_final';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const screens={pret:'#screen-pret',rendre:'#screen-rendre',eleves:'#screen-eleves',livres:'#screen-livres',historique:'#screen-histo'};
let state;
try{ state = JSON.parse(localStorage.getItem(DBKEY) || '{"students":[],"books":[],"loans":[],"history":[]}'); }
catch(e){ state = {"students":[],"books":[],"loans":[],"history":[]}; }
function save(){ try{ localStorage.setItem(DBKEY, JSON.stringify(state)); }catch(e){} }
function uid(p){ return p+Math.random().toString(36).slice(2,9); }
function today(){ return new Date().toISOString().slice(0,10); }
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1400); }

function show(tab){
  Object.values(screens).forEach(s=>$(s).classList.add('hidden'));
  ( $(screens[tab]) || $(screens.pret) ).classList.remove('hidden');
  $$('.nav a').forEach(a=>a.classList.remove('active'));
  $('#tab-'+tab)?.classList.add('active');
  location.hash='#'+tab;
  render();
}
window.addEventListener('hashchange', ()=> show((location.hash||'#pret').slice(1)) );

function renderStudents(){
  $('#selStudent').innerHTML = '<option value="">— choisir —</option>' + state.students.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  $('#badgeStudents').textContent = state.students.length;
  const q = ($('#searchStudents')?.value||'').toLowerCase();
  const sort = $('#sortStudents')?.value||'az';
  let arr = [...state.students];
  if(q) arr = arr.filter(s=>s.name.toLowerCase().includes(q));
  if(sort==='az') arr.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==='za') arr.sort((a,b)=>b.name.localeCompare(a.name));
  if(sort==='new') arr.reverse();
  $('#listStudents').innerHTML = arr.map(s=>{
    const loan = state.loans.find(l=>l.studentId===s.id);
    return `<div class="item">
      <div><div class="name">${s.name}</div><div class="sub">${loan? 'Livre en cours' : 'Aucun prêt'}</div></div>
      <div class="btns">
        <button class="iconbtn" data-act="view-stu" data-id="${s.id}">📖</button>
        <button class="iconbtn" data-act="edit-stu" data-id="${s.id}">✏️</button>
        <button class="iconbtn danger" data-act="del-stu" data-id="${s.id}">🗑️</button>
      </div>
    </div>`;
  }).join('') || '<div class="helper">Aucun élève pour le moment.</div>';
}
function renderBooks(){
  $('#badgeBooks').textContent = state.books.length;
  const q = ($('#searchBooks')?.value||'').toLowerCase();
  const sort = $('#sortBooks')?.value||'az';
  let arr = [...state.books];
  if(q) arr = arr.filter(b=>(b.title||'').toLowerCase().includes(q) || (b.code||'').toLowerCase().includes(q));
  if(sort==='az') arr.sort((a,b)=>(a.title||a.code).localeCompare(b.title||b.code));
  if(sort==='za') arr.sort((a,b)=>(b.title||b.code).localeCompare(a.title||a.code));
  if(sort==='new') arr.reverse();
  $('#listBooks').innerHTML = arr.map(b=>{
    const onLoan = state.loans.some(l=>l.bookId===b.id);
    return `<div class="item">
      <div><div class="name">${b.title || '—'}</div><div class="sub"><code>${b.code}</code> ${onLoan? ' • emprunté':''}</div></div>
      <div class="btns">
        <button class="iconbtn" data-act="edit-bok" data-id="${b.id}">✏️</button>
        <button class="iconbtn danger" data-act="del-bok" data-id="${b.id}">🗑️</button>
      </div>
    </div>`;
  }).join('') || '<div class="helper">Aucun livre pour le moment.</div>';
}
function renderHisto(){
  $('#histoList').innerHTML = state.history.slice().reverse().map(h=>{
    const s=state.students.find(x=>x.id===h.studentId)?.name||'—';
    const b=state.books.find(x=>x.id===h.bookId)?.title||state.books.find(x=>x.id===h.bookId)?.code||'—';
    return `• ${h.dateOut} — ${s} → ${b}${h.dateIn? ' (retour '+h.dateIn+')':''}`;
  }).join('<br>') || 'Aucun historique.';
}
function render(){ renderStudents(); renderBooks(); renderHisto(); }

document.addEventListener('click', (e)=>{
  const btn = e.target.closest('button.iconbtn'); if(!btn) return;
  const id = btn.getAttribute('data-id'); const act = btn.getAttribute('data-act');
  if (act==='del-stu'){
    const hasLoans = state.loans.some(l=>l.studentId===id);
    if (hasLoans){ alert('Impossible : cet élève a un prêt en cours. Marque le retour d’abord.'); return; }
    if (!confirm('Supprimer cet élève ?')) return;
    state.students = state.students.filter(s=>s.id!==id);
    save(); render(); toast('Élève supprimé');
  }
  if (act==='edit-stu'){
    const s = state.students.find(x=>x.id===id); if(!s) return;
    const nv = prompt('Nouveau prénom :', s.name);
    if (nv===null) return;
    s.name = nv.trim(); save(); render(); toast('Prénom modifié');
  }
  if (act==='view-stu'){ openDrawer(id); }
  if (act==='del-bok'){
    const onLoan = state.loans.some(l=>l.bookId===id);
    if (onLoan){ alert('Impossible : ce livre est emprunté. Rends-le d’abord.'); return; }
    if (!confirm('Supprimer ce livre ?')) return;
    state.books = state.books.filter(b=>b.id!==id);
    save(); render(); toast('Livre supprimé');
  }
  if (act==='edit-bok'){
    const b = state.books.find(x=>x.id===id); if(!b) return;
    const nv = prompt('Nouveau titre (laisser vide pour aucun) :', b.title||'');
    if (nv===null) return;
    b.title = nv.trim(); save(); render(); toast('Titre modifié');
  }
});

// Add / bulk
$('#btnAddStudent').addEventListener('click', ()=>{
  const name=($('#inStudentName').value||'').trim(); if(!name) return toast('Entre un prénom');
  state.students.push({id:uid('s_'), name}); $('#inStudentName').value=''; save(); render(); toast('Élève ajouté');
});
$('#btnAddBulk').addEventListener('click', ()=>{
  const lines=($('#inBulk').value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(!lines.length) return toast('Liste vide');
  const exists=new Set(state.students.map(s=>s.name.toLowerCase())); let n=0;
  lines.forEach(nm=>{ if(!exists.has(nm.toLowerCase())){ state.students.push({id:uid('s_'), name:nm}); n++; } });
  $('#inBulk').value=''; save(); render(); toast(n+' élèves ajoutés');
});
$('#searchStudents')?.addEventListener('input', renderStudents);

// Books
$('#btnAddBook').addEventListener('click', ()=>{
  const code=($('#inBookCode').value||'').trim(); if(!code) return toast('Entre un code');
  if(state.books.some(b=>b.code===code)) return toast('Code déjà présent');
  const title=($('#inBookTitle').value||'').trim();
  state.books.push({id:uid('b_'), code, title}); $('#inBookCode').value=''; $('#inBookTitle').value=''; save(); render(); toast('Livre ajouté');
});
$('#searchBooks').addEventListener('input', renderBooks);

// Core loan helpers
function ensureBook(code){
  let book=state.books.find(b=>b.code===code);
  if(!book){ book={id:uid('b_'), code, title:''}; state.books.push(book); }
  return book;
}
function closeOpenLoanForStudent(sid){
  const li = state.loans.findIndex(l=>l.studentId===sid);
  if(li>=0){
    const loan = state.loans[li];
    state.loans.splice(li,1);
    const hist = state.history.slice().reverse().find(h=>h.studentId===sid && !h.dateIn);
    if(hist) hist.dateIn = today();
  }
}
function createLoanFor(sid, code){
  const book = ensureBook(code);
  const taken = state.loans.find(l=>l.bookId===book.id);
  if(taken && taken.studentId!==sid){ const who=state.students.find(s=>s.id===taken.studentId)?.name||'un autre élève'; toast('Déjà emprunté par '+who); return false; }
  closeOpenLoanForStudent(sid);
  state.loans.push({id:uid('l_'), studentId:sid, bookId:book.id, dateOut:today()});
  state.history.push({id:uid('h_'), studentId:sid, bookId:book.id, dateOut:today(), dateIn:null});
  save(); render(); return true;
}

// Prêt / retour
$('#btnPret').addEventListener('click', ()=>{
  const sid=$('#selStudent').value; const code=($('#bookCode').value||'').trim();
  if(!sid) return toast('Choisis l’élève'); if(!code) return toast('Scanne/entre le code');
  if(createLoanFor(sid, code)){ $('#bookCode').value=''; toast('Prêt enregistré'); }
});
$('#btnDoReturn').addEventListener('click', ()=>{
  const code=($('#returnCode').value||'').trim(); if(!code) return toast('Entre/scanne le code');
  const book=state.books.find(b=>b.code===code); if(!book) return toast('Livre inconnu');
  const i=state.loans.findIndex(l=>l.bookId===book.id); if(i<0) return toast('Pas en prêt');
  const loan=state.loans[i]; state.loans.splice(i,1);
  const hist=state.history.slice().reverse().find(h=>h.bookId===loan.bookId && !h.dateIn); if(hist) hist.dateIn=today();
  $('#returnCode').value=''; save(); render(); toast('Rendu enregistré');
});

// Scanner
let reader;
async function scan(callback){
  try{
    if(!reader) reader=new ZXing.BrowserMultiFormatReader();
    const devs=await ZXing.BrowserCodeReader.listVideoInputDevices(); const id=devs?.[0]?.deviceId; if(!id) throw new Error('Aucune caméra');
    const video=document.createElement('video'); video.className='scanbox'; video.playsInline=true;
    const wrap=document.createElement('div'); wrap.className='card'; wrap.style.padding='12px'; wrap.appendChild(video); document.querySelector('main').prepend(wrap);
    await reader.decodeFromVideoDevice(id, video, (res,err)=>{ if(res){ if(navigator.vibrate) navigator.vibrate(50); try{reader.reset()}catch(e){}; wrap.remove(); callback(res.text); } });
  }catch(e){ alert('Scan impossible : '+e.message); }
}
document.getElementById('scanQRBtn').addEventListener('click', ()=> scan((txt)=>{
  if(String(txt).startsWith('MPB:')){
    const sid=String(txt).slice(4); const s=state.students.find(x=>x.id===sid); if(s){ $('#selStudent').value=s.id; toast('Élève : '+s.name); } else toast('QR inconnu');
  }else toast('QR élève attendu');
}));
document.getElementById('btnScanBook').addEventListener('click', ()=> scan((txt)=>{
  const sid=$('#selStudent').value;
  if(sid){ if(createLoanFor(sid, String(txt).trim())) toast('Prêt enregistré (scan)'); }
  else { $('#bookCode').value=txt; toast('Code scanné — choisis un élève puis “Enregistrer le prêt”'); }
}));
document.getElementById('btnScanAddBook').addEventListener('click', ()=> scan((txt)=>{ $('#inBookCode').value=txt; toast('Code détecté (onglet Livres)'); }));

// Export / Import
$('#btnExportCSV').addEventListener('click', ()=>{
  const rows=[['Type','Date prêt','Date retour','Élève','Livre','Code']];
  state.history.forEach(h=>{
    const s=state.students.find(x=>x.id===h.studentId)?.name||''; const b=state.books.find(x=>x.id===h.bookId);
    rows.push(['HISTORIQUE', h.dateOut||'', h.dateIn||'', s, b?.title||b?.code||'', b?.code||'']);
  });
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='mapetitebiblio.csv'; a.click();
});
$('#btnExportJSON').addEventListener('click', ()=>{
  const data = JSON.stringify(state, null, 2);
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([data],{type:'application/json'})); a.download='mapetitebiblio-donnees.json'; a.click();
});
$('#btnImportJSON').addEventListener('click', ()=> $('#importInput').click());
document.getElementById('importInput').addEventListener('change', (e)=>{
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      if(!confirm('Importer ces données et remplacer l’existant ?')) return;
      state = {students:data.students||[], books:data.books||[], loans:data.loans||[], history:data.history||[]};
      save(); render(); toast('Import terminé');
    }catch(err){ alert('Fichier invalide'); }
  };
  reader.readAsText(file);
});

// QR cards
function openQRCards(printNow=false){
  const data = JSON.stringify(state.students.map(s=>({id:s.id,name:s.name}))).replace(/</g,'\\u003c');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Cartes QR — MaPetiteBiblio</title>
  <style>@page { size: A4; margin: 12mm; } body{font-family:system-ui;margin:0;padding:12mm;background:#f7efe7}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.card{background:#fff;border:1px solid #eee;border-radius:12px;padding:12px;display:flex;align-items:center;gap:10px}
  .qr{width:96px;height:96px}.name{font-weight:800;font-size:18px}</style></head><body><h2>Cartes QR — MaPetiteBiblio</h2><div class="grid" id="g"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <script>const students = ${data}; const g = document.getElementById('g'); students.forEach(s=>{ const div = document.createElement('div'); div.className='card'; const qrBox = document.createElement('div'); qrBox.className='qr'; div.appendChild(qrBox); const lab = document.createElement('div'); lab.innerHTML = '<div class="name">'+s.name+'</div><div style="color:#6b7280;font-size:12px">MPB:'+s.id+'</div>'; div.appendChild(lab); g.appendChild(div); new QRCode(qrBox, {text: 'MPB:'+s.id, width:96, height:96}); });</script></body></html>`;
  const w = window.open('', '_blank'); w.document.open(); w.document.write(html); w.document.close(); if(printNow) w.onload = ()=> w.print();
}
document.getElementById('btnShowQRCards').addEventListener('click', ()=> openQRCards(false));
document.getElementById('btnPrintQRCards').addEventListener('click', ()=> openQRCards(true));

// Drawer (edit loans by student)
const drawer = $('#drawer'); const drawerName = $('#drawerName'); const drawerContent = $('#drawerContent');
$('#drawerClose').addEventListener('click', ()=> drawer.classList.remove('show'));

function openDrawer(sid){
  const s = state.students.find(x=>x.id===sid); if(!s) return;
  drawerName.textContent = s.name;
  const current = state.loans.find(l=>l.studentId===sid);
  let html = '';
  if(current){
    const b = state.books.find(x=>x.id===current.bookId);
    html += `<div class='item'><div><div class='name'>Actuel : ${b?.title||b?.code||'—'}</div><div class='sub'>Code: <code>${b?.code||''}</code> • depuis ${current.dateOut}</div></div>
    <div class='btns'>
      <button class='iconbtn' data-act='cur-return' data-sid='${sid}'>✅ Rendu</button>
      <button class='iconbtn' data-act='cur-title' data-bid='${b?.id||''}'>✏️ Titre</button>
    </div></div>`;
  } else {
    html += `<div class='helper'>Aucun prêt en cours.</div>`;
  }
  const hist = state.history.filter(h=>h.studentId===sid).slice().reverse();
  if(hist.length) html += `<div class='helper' style='margin-top:6px'>Historique</div>`;
  hist.forEach(h=>{
    const b = state.books.find(x=>x.id===h.bookId);
    html += `<div class='item'>
      <div><div class='name'>${b?.title||b?.code||'—'}</div><div class='sub'>Code: <code>${b?.code||''}</code> • prêt: ${h.dateOut}${h.dateIn? ' • retour: '+h.dateIn : ''}</div></div>
      <div class='btns'>
        <button class='iconbtn' data-act='hist-title' data-bid='${b?.id||''}'>✏️</button>
        <button class='iconbtn danger' data-act='hist-del' data-hid='${h.id}'>🗑️</button>
      </div></div>`;
  });
  drawerContent.innerHTML = html || '<div class="helper">Aucun historique.</div>';
  drawer.classList.add('show');
}
drawer.addEventListener('click', (e)=>{
  const btn = e.target.closest('button.iconbtn'); if(!btn) return;
  const act = btn.getAttribute('data-act');
  if(act==='cur-return'){
    const sid = btn.getAttribute('data-sid');
    const i = state.loans.findIndex(l=>l.studentId===sid); if(i<0) return;
    const loan = state.loans[i]; state.loans.splice(i,1);
    const hist=state.history.slice().reverse().find(h=>h.bookId===loan.bookId && h.studentId===sid && !h.dateIn); if(hist) hist.dateIn=today();
    save(); render(); openDrawer(sid); toast('Rendu enregistré');
  }
  if(act==='cur-title' || act==='hist-title'){
    const bid = btn.getAttribute('data-bid'); const b = state.books.find(x=>x.id===bid); if(!b) return;
    const nv = prompt('Nouveau titre :', b.title||''); if(nv===null) return;
    b.title = nv.trim(); save(); render(); drawer.classList.add('show'); toast('Titre modifié');
  }
  if(act==='hist-del'){
    const hid = btn.getAttribute('data-hid');
    if(!confirm('Supprimer cette ligne d’historique ?')) return;
    const idx = state.history.findIndex(h=>h.id===hid); if(idx>=0) state.history.splice(idx,1);
    save(); render(); toast('Ligne supprimée');
    const nm = drawerName.textContent; const s = state.students.find(x=>x.name===nm); if(s) openDrawer(s.id);
  }
});

if('serviceWorker' in navigator){ addEventListener('load', ()=> navigator.serviceWorker.register('service-worker.js')); }
show((location.hash||'#pret').slice(1)); render();
