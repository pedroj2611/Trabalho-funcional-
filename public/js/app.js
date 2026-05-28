// ═══════════════════════════════════════════════════════════
//  Clínica Medical — app.js (compilado do app.ts)
//  Autores: Pedro J. / Brendi
// ═══════════════════════════════════════════════════════════

"use strict";

// ─── Banco de Dados em Memória ───────────────────────────────
const DB = {
  pacientes: [
    { id: 1, nome: 'Ana Beatriz' },
    { id: 2, nome: 'Carlos Eduardo' },
    { id: 3, nome: 'Beatriz Santos' },
    { id: 4, nome: 'Jorge Ribeiro' },
    { id: 5, nome: 'Maria Fernanda' },
  ],
  consultas: [
    { id: 1, paciente_id: 1, data_consulta: '2026-04-10' },
    { id: 2, paciente_id: 2, data_consulta: '2026-04-11' },
    { id: 3, paciente_id: 3, data_consulta: '2026-04-12' },
    { id: 4, paciente_id: 1, data_consulta: '2026-04-15' },
    { id: 5, paciente_id: 4, data_consulta: '2026-04-18' },
    { id: 6, paciente_id: 5, data_consulta: '2026-05-01' },
  ],
  sintomas: [
    { id: 1, descricao: 'Febre' },
    { id: 2, descricao: 'Dor de cabeça' },
    { id: 3, descricao: 'Tosse' },
    { id: 4, descricao: 'Cansaço' },
  ],
  consulta_sintoma: [
    { consulta_id: 1, sintoma_id: 1 },
    { consulta_id: 1, sintoma_id: 2 },
    { consulta_id: 2, sintoma_id: 3 },
    { consulta_id: 3, sintoma_id: 1 },
    { consulta_id: 4, sintoma_id: 1 },
    { consulta_id: 4, sintoma_id: 3 },
    { consulta_id: 5, sintoma_id: 2 },
    { consulta_id: 6, sintoma_id: 4 },
  ],
  nextPacienteId: 6,
  nextConsultaId: 7,
  nextSintomaId:  5,
};

// ─── Estado ──────────────────────────────────────────────────
let currentUser  = null;
let editTarget   = null;
let deleteTarget = null;
let toastTimer;

const AVATAR_COLORS = ['#1a56db','#0d9488','#8b5cf6','#f59e0b','#ef4444','#06b6d4'];

// ════════ AUTH ════════
function doLogin() {
  const u   = document.getElementById('loginUser').value.trim();
  const p   = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  if (u === 'admin' && p === 'admin') {
    err.classList.remove('show');
    currentUser = { nome: 'Administrador', login: 'admin', role: 'admin' };
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appShell').classList.add('visible');
    document.getElementById('sbUserName').textContent = currentUser.nome;
    document.getElementById('sbAvatarText').textContent = 'A';
    document.getElementById('topDate').textContent =
      new Date().toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
    document.getElementById('cfgUserInfo').innerHTML = `
      <div style="font-size:15px;font-weight:700;margin-bottom:6px">Administrador</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:3px">Login: admin</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:10px">Perfil: Administrador</div>
      <span class="badge badge-amber">admin</span>`;
    refreshDashboard(); refreshPacientes(); refreshAtendimentos();
    showToast('success', '✅ Bem-vindo, Administrador!');
  } else {
    err.classList.add('show');
    document.getElementById('loginPass').value = '';
    document.getElementById('loginPass').focus();
  }
}

function doLogout() {
  document.getElementById('appShell').classList.remove('visible');
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
}

// ════════ NAVEGAÇÃO ════════
function navTo(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  if (el) el.classList.add('active');
  const titles = { dashboard:'Dashboard', pacientes:'Gerenciar Pacientes', atendimentos:'Atendimentos', relatorios:'Relatórios SQL', configuracoes:'Configurações' };
  document.getElementById('topTitle').textContent = titles[page] || page;
}

// ════════ DASHBOARD ════════
function refreshDashboard() {
  document.getElementById('stTotal').textContent    = DB.pacientes.length;
  document.getElementById('stConsultas').textContent = DB.consultas.length;
  document.getElementById('stSintomas').textContent  = DB.sintomas.length;
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('stHoje').textContent = DB.consultas.filter(c => c.data_consulta === hoje).length;
  const dp = document.getElementById('dashPacientes');
  dp.innerHTML = DB.pacientes.slice(0,5).map((p,i) => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:38px;height:38px;background:${AVATAR_COLORS[i%6]};border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;flex-shrink:0">${p.nome.slice(0,2).toUpperCase()}</div>
      <div><div style="font-weight:600;font-size:14px">${p.nome}</div><div style="font-size:12px;color:var(--muted)">ID #${p.id}</div></div>
    </div>`).join('');
  const da  = document.getElementById('dashAtendimentos');
  const ats = getAtendimentos().slice(-6).reverse();
  da.innerHTML = ats.length === 0
    ? '<div class="empty"><div class="empty-icon">📋</div><p>Nenhum atendimento</p></div>'
    : ats.map(a => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div><strong style="font-size:14px">${a.nome}</strong><span style="color:var(--muted);font-size:13px;margin-left:8px">${a.sintoma}</span></div>
        <span style="font-size:12px;color:var(--muted)">${formatDate(a.data_consulta)}</span>
      </div>`).join('');
}

// ════════ PACIENTES ════════
function refreshPacientes() {
  document.getElementById('pacientesGrid').innerHTML = DB.pacientes.map((p,i) => `
    <div class="p-card">
      <div class="p-avatar" style="background:${AVATAR_COLORS[i%6]}">${p.nome.slice(0,2).toUpperCase()}</div>
      <div class="p-info"><div class="p-name">${p.nome}</div><div class="p-id">ID #${p.id}</div></div>
      <div class="p-actions">
        <button class="btn btn-sm btn-outline" onclick="abrirEditar(${p.id},'${escQ(p.nome)}')">✏️</button>
        <button class="btn btn-sm btn-danger"  onclick="abrirExcluir(${p.id},'${escQ(p.nome)}')">🗑️</button>
      </div>
    </div>`).join('');
}

function abrirModalNovoPaciente() {
  document.getElementById('novoPacienteNome').value = '';
  document.getElementById('overlayNovoPaciente').classList.add('show');
}
function confirmarNovoPaciente() {
  const n = document.getElementById('novoPacienteNome').value.trim();
  if (!n) { showToast('error', 'Nome não pode ser vazio!'); return; }
  DB.pacientes.push({ id: DB.nextPacienteId++, nome: n });
  fecharModal('overlayNovoPaciente'); refreshPacientes(); refreshDashboard();
  showToast('success', `✅ Paciente "${n}" cadastrado!`);
}
function abrirEditar(id, nome) {
  editTarget = { id, nome };
  document.getElementById('editNomeInput').value = nome;
  document.getElementById('overlayEdit').classList.add('show');
}
function confirmarEdicao() {
  const n = document.getElementById('editNomeInput').value.trim();
  if (!n) { showToast('error', 'Nome inválido!'); return; }
  const p = DB.pacientes.find(x => x.id === editTarget.id);
  if (p) p.nome = n;
  fecharModal('overlayEdit'); refreshPacientes(); refreshDashboard(); refreshAtendimentos();
  showToast('success', `✅ Paciente atualizado para "${n}"`);
}
function abrirExcluir(id, nome) {
  deleteTarget = { id, nome };
  document.getElementById('deleteNomeTxt').textContent = nome;
  document.getElementById('overlayDelete').classList.add('show');
}
function confirmarExclusao() {
  DB.pacientes = DB.pacientes.filter(x => x.id !== deleteTarget.id);
  const cids = DB.consultas.filter(c => c.paciente_id === deleteTarget.id).map(c => c.id);
  DB.consultas = DB.consultas.filter(c => c.paciente_id !== deleteTarget.id);
  DB.consulta_sintoma = DB.consulta_sintoma.filter(cs => !cids.includes(cs.consulta_id));
  fecharModal('overlayDelete'); refreshPacientes(); refreshDashboard(); refreshAtendimentos();
  showToast('info', `🗑️ "${deleteTarget.nome}" removido`);
}
function fecharModal(id) { document.getElementById(id).classList.remove('show'); }

// ════════ ATENDIMENTOS ════════
function getAtendimentos() {
  return DB.consultas.map(c => {
    const p  = DB.pacientes.find(x => x.id === c.paciente_id);
    const ss = DB.consulta_sintoma.filter(cs => cs.consulta_id === c.id);
    const nomes = ss.map(cs => DB.sintomas.find(s => s.id === cs.sintoma_id)?.descricao || '?');
    return { id: c.id, paciente_id: c.paciente_id, nome: p ? p.nome : 'Desconhecido', sintoma: nomes.join(', ') || '—', data_consulta: c.data_consulta };
  });
}
function refreshAtendimentos() {
  const hist  = document.getElementById('ateHistorico');
  const lista = getAtendimentos().reverse();
  hist.innerHTML = lista.length === 0
    ? '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:30px">Nenhum atendimento registrado</td></tr>'
    : lista.map(a => `<tr><td><span class="badge badge-blue">#${a.id}</span></td><td><strong>${a.nome}</strong></td><td>${a.sintoma}</td><td style="color:var(--muted)">${formatDate(a.data_consulta)}</td></tr>`).join('');
}
function registrarAtendimento() {
  const nome = document.getElementById('ateNome').value.trim();
  const sint = document.getElementById('ateSintoma').value.trim();
  if (!nome || !sint) { showToast('error', 'Preencha nome e sintoma!'); return; }
  let p = DB.pacientes.find(x => x.nome.toLowerCase() === nome.toLowerCase());
  if (!p) { p = { id: DB.nextPacienteId++, nome }; DB.pacientes.push(p); }
  let s = DB.sintomas.find(x => x.descricao.toLowerCase() === sint.toLowerCase());
  if (!s) { s = { id: DB.nextSintomaId++, descricao: sint }; DB.sintomas.push(s); }
  const hoje = new Date().toISOString().split('T')[0];
  const cid  = DB.nextConsultaId++;
  DB.consultas.push({ id: cid, paciente_id: p.id, data_consulta: hoje });
  DB.consulta_sintoma.push({ consulta_id: cid, sintoma_id: s.id });
  document.getElementById('ateNome').value = '';
  document.getElementById('ateSintoma').value = '';
  refreshAtendimentos(); refreshDashboard(); refreshPacientes();
  showToast('success', `✅ Atendimento de "${nome}" registrado!`);
}

// ════════ RELATÓRIOS ════════
function runQuery(q) {
  const box = document.getElementById('codeResult');
  let data, title = '';
  if (q==='etapa6') {
    title='-- Etapa 6: JOIN básico\nSELECT p.nome, c.data_consulta FROM pacientes p JOIN consultas c ON p.id=c.paciente_id;\n\n';
    data=DB.consultas.map(c=>({nome:DB.pacientes.find(x=>x.id===c.paciente_id)?.nome??'?',data_consulta:c.data_consulta}));
  } else if(q==='etapa7') {
    title='-- Etapa 7: JOIN completo\n\n';
    data=DB.consulta_sintoma.map(cs=>{const c=DB.consultas.find(x=>x.id===cs.consulta_id);return{nome:DB.pacientes.find(x=>x.id===c?.paciente_id)?.nome??'?',sintoma:DB.sintomas.find(x=>x.id===cs.sintoma_id)?.descricao??'?'};});
  } else if(q==='etapa8') {
    title="-- Etapa 8: Filtro Febre\n\n";
    const fid=DB.sintomas.find(x=>x.descricao==='Febre')?.id;
    const cids=DB.consulta_sintoma.filter(cs=>cs.sintoma_id===fid).map(cs=>cs.consulta_id);
    const pids=[...new Set(DB.consultas.filter(c=>cids.includes(c.id)).map(c=>c.paciente_id))];
    data=DB.pacientes.filter(p=>pids.includes(p.id)).map(p=>({nome:p.nome}));
  } else if(q==='etapa9') {
    title='-- Etapa 9: Total por paciente\n\n';
    data=DB.pacientes.map(p=>({nome:p.nome,total_consultas:DB.consultas.filter(c=>c.paciente_id===p.id).length}));
  } else if(q==='etapa10') {
    title='-- Etapa 10: Sintoma mais frequente\n\n';
    const freq={};DB.consulta_sintoma.forEach(cs=>{freq[cs.sintoma_id]=(freq[cs.sintoma_id]||0)+1;});
    const max=Object.entries(freq).sort((a,b)=>b[1]-a[1])[0];
    const s=max?DB.sintomas.find(x=>x.id==max[0]):null;
    data=s?{descricao:s.descricao,frequencia:max[1]}:{descricao:'N/A',frequencia:0};
  } else {
    title='-- SELECT * FROM pacientes;\n\n'; data=DB.pacientes;
  }
  box.innerHTML=`<span style="color:#94a3b8">${title}</span>`+JSON.stringify(data,null,2).replace(/"([^"]+)":/g,'<span class="key">"$1"</span>:').replace(/: "([^"]+)"/g,': <span class="str">"$1"</span>').replace(/: (\d+)/g,': <span class="val">$1</span>');
}

// ════════ PDF ════════
function gerarPDF() {
  showToast('info','📄 Gerando PDF...');
  const atEnd=getAtendimentos(),hoje=new Date().toISOString().split('T')[0];
  const hojeFmt=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
  const tpp=DB.pacientes.map(p=>({id:p.id,nome:p.nome,total:DB.consultas.filter(c=>c.paciente_id===p.id).length}));
  const freq={};DB.consulta_sintoma.forEach(cs=>{freq[cs.sintoma_id]=(freq[cs.sintoma_id]||0)+1;});
  const maxE=Object.entries(freq).sort((a,b)=>b[1]-a[1])[0];
  const st=maxE?DB.sintomas.find(x=>x.id==maxE[0])?.descricao:'N/A',ft=maxE?maxE[1]:0;
  const win=window.open('','_blank','width=900,height=700');
  if(win){win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório</title><style>body{font-family:Arial,sans-serif;margin:0;padding:0;color:#0f172a;font-size:13px;}.hdr{background:#0a1628;color:white;padding:36px 40px;display:flex;justify-content:space-between;}.hdr h1{font-size:26px;margin:0;font-weight:800;}.sec{padding:28px 40px;border-bottom:1px solid #e2e8f0;}.sec-t{font-size:14px;font-weight:800;text-transform:uppercase;color:#1a56db;margin-bottom:16px;}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}.stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;text-align:center;}.stat-n{font-size:30px;font-weight:800;color:#1a56db;}.stat-l{font-size:12px;color:#64748b;}table{width:100%;border-collapse:collapse;}th{background:#f1f5f9;font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;padding:10px 14px;text-align:left;}td{padding:11px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;}.badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;}.bb{background:#eef2ff;color:#1a56db;}.bg{background:#ecfdf5;color:#059669;}.ba{background:#fffbeb;color:#d97706;}.hl{background:#eef2ff;border-radius:10px;padding:16px;display:flex;justify-content:space-between;align-items:center;}.hl h4{font-size:15px;font-weight:700;color:#1a56db;margin:0;}.hl .big{font-size:28px;font-weight:800;color:#1a56db;}.ftr{background:#f8fafc;padding:16px 40px;text-align:center;color:#94a3b8;font-size:11px;}</style></head><body>
  <div class="hdr"><div><div style="font-size:28px;margin-bottom:8px">🏥</div><h1>Clínica Medical</h1><p style="margin:6px 0 0;opacity:.6">Relatório Geral</p></div><div style="text-align:right;opacity:.7"><div>Gerado em</div><div style="font-size:15px;font-weight:700;color:white;margin-top:4px">${hojeFmt}</div></div></div>
  <div class="sec"><div class="sec-t">📊 Resumo</div><div class="stats"><div class="stat"><div class="stat-n">${DB.pacientes.length}</div><div class="stat-l">Pacientes</div></div><div class="stat"><div class="stat-n">${DB.consultas.length}</div><div class="stat-l">Consultas</div></div><div class="stat"><div class="stat-n">${DB.sintomas.length}</div><div class="stat-l">Sintomas</div></div><div class="stat"><div class="stat-n">${DB.consultas.filter(c=>c.data_consulta===hoje).length}</div><div class="stat-l">Hoje</div></div></div></div>
  <div class="sec"><div class="sec-t">👥 Pacientes</div><table><thead><tr><th>ID</th><th>Nome</th><th>Consultas</th></tr></thead><tbody>${tpp.map(p=>`<tr><td><span class="badge bb">#${p.id}</span></td><td>${p.nome}</td><td><span class="badge bg">${p.total}</span></td></tr>`).join('')}</tbody></table></div>
  <div class="sec"><div class="sec-t">🩺 Atendimentos</div><table><thead><tr><th>#</th><th>Paciente</th><th>Sintoma(s)</th><th>Data</th></tr></thead><tbody>${atEnd.map(a=>`<tr><td><span class="badge bb">${a.id}</span></td><td>${a.nome}</td><td>${a.sintoma}</td><td>${a.data_consulta}</td></tr>`).join('')}</tbody></table></div>
  <div class="sec"><div class="sec-t">⭐ Sintomas</div><div class="hl"><div><h4>Mais frequente: ${st}</h4><p>${ft} consulta(s)</p></div><div class="big">${ft}×</div></div><div style="margin-top:16px"><table><thead><tr><th>Sintoma</th><th>Freq.</th></tr></thead><tbody>${DB.sintomas.map(s=>`<tr><td>${s.descricao}</td><td><span class="badge ba">${DB.consulta_sintoma.filter(cs=>cs.sintoma_id===s.id).length}×</span></td></tr>`).join('')}</tbody></table></div></div>
  <div class="ftr">Clínica Medical v2.0 · ${new Date().toLocaleString('pt-BR')}</div></body></html>`);
  win.document.close();win.focus();setTimeout(()=>{win.print();showToast('success','✅ PDF pronto!');},600);}
}

// ════════ HELPERS ════════
function formatDate(d){if(!d)return'—';try{const[y,m,day]=d.split('-');return`${day}/${m}/${y}`;}catch{return d;}}
function escQ(s){return s.replace(/'/g,"\\'");}
function showToast(type,msg){const t=document.getElementById('toast');t.className='toast '+type;t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3500);}

// ════════ INIT ════════
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('show');}));
  document.getElementById('loginUser')?.addEventListener('keypress',e=>{if(e.key==='Enter')document.getElementById('loginPass').focus();});
  document.getElementById('loginPass')?.addEventListener('keypress',e=>{if(e.key==='Enter')doLogin();});
});
