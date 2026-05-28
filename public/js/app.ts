// ═══════════════════════════════════════════════════════════
//  Clínica Medical — Lógica Principal (app.ts)
//  Autores: Pedro J. / Brendi
//  Versão: 2.0
// ═══════════════════════════════════════════════════════════

// ─── Interfaces / Tipos ─────────────────────────────────────

interface Paciente {
  id: number;
  nome: string;
}

interface Consulta {
  id: number;
  paciente_id: number;
  data_consulta: string;
}

interface Sintoma {
  id: number;
  descricao: string;
}

interface ConsultaSintoma {
  consulta_id: number;
  sintoma_id: number;
}

interface Atendimento {
  id: number;
  paciente_id: number;
  nome: string;
  sintoma: string;
  data_consulta: string;
}

interface Usuario {
  nome: string;
  login: string;
  role: string;
}

interface Database {
  pacientes: Paciente[];
  consultas: Consulta[];
  sintomas: Sintoma[];
  consulta_sintoma: ConsultaSintoma[];
  nextPacienteId: number;
  nextConsultaId: number;
  nextSintomaId: number;
}

// ─── Banco de Dados em Memória ───────────────────────────────

const DB: Database = {
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
  nextSintomaId: 5,
};

// ─── Estado da Aplicação ─────────────────────────────────────

let currentUser: Usuario | null = null;
let editTarget: { id: number; nome: string } | null = null;
let deleteTarget: { id: number; nome: string } | null = null;
let toastTimer: ReturnType<typeof setTimeout>;

// ─── Constantes ──────────────────────────────────────────────

const AVATAR_COLORS = ['#1a56db', '#0d9488', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

// ════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════

function doLogin(): void {
  const userInput = document.getElementById('loginUser') as HTMLInputElement;
  const passInput = document.getElementById('loginPass') as HTMLInputElement;
  const err       = document.getElementById('loginError') as HTMLElement;

  if (userInput.value.trim() === 'admin' && passInput.value === 'admin') {
    err.classList.remove('show');
    currentUser = { nome: 'Administrador', login: 'admin', role: 'admin' };

    // Esconde login, exibe app
    (document.getElementById('loginScreen') as HTMLElement).style.display = 'none';
    (document.getElementById('appShell') as HTMLElement).classList.add('visible');

    // Atualiza interface
    (document.getElementById('sbUserName') as HTMLElement).textContent = currentUser.nome;
    (document.getElementById('sbAvatarText') as HTMLElement).textContent = 'A';
    (document.getElementById('topDate') as HTMLElement).textContent =
      new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

    (document.getElementById('cfgUserInfo') as HTMLElement).innerHTML = `
      <div style="font-size:15px;font-weight:700;margin-bottom:6px">Administrador</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:3px">Login: admin</div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:10px">Perfil: Administrador</div>
      <span class="badge badge-amber">admin</span>
    `;

    refreshDashboard();
    refreshPacientes();
    refreshAtendimentos();
    showToast('success', '✅ Bem-vindo, Administrador!');
  } else {
    err.classList.add('show');
    passInput.value = '';
    passInput.focus();
  }
}

function doLogout(): void {
  (document.getElementById('appShell') as HTMLElement).classList.remove('visible');
  (document.getElementById('loginScreen') as HTMLElement).style.display = 'flex';
  (document.getElementById('loginUser') as HTMLInputElement).value = '';
  (document.getElementById('loginPass') as HTMLInputElement).value = '';
}

// ════════════════════════════════════════════════════════════
//  NAVEGAÇÃO
// ════════════════════════════════════════════════════════════

function navTo(page: string, el: HTMLElement): void {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  if (el) el.classList.add('active');

  const titles: Record<string, string> = {
    dashboard:     'Dashboard',
    pacientes:     'Gerenciar Pacientes',
    atendimentos:  'Atendimentos',
    relatorios:    'Relatórios SQL',
    configuracoes: 'Configurações',
  };
  (document.getElementById('topTitle') as HTMLElement).textContent = titles[page] || page;
}

// ════════════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════════════

function refreshDashboard(): void {
  (document.getElementById('stTotal') as HTMLElement).textContent    = String(DB.pacientes.length);
  (document.getElementById('stConsultas') as HTMLElement).textContent = String(DB.consultas.length);
  (document.getElementById('stSintomas') as HTMLElement).textContent  = String(DB.sintomas.length);

  const hoje = new Date().toISOString().split('T')[0];
  const hoje_c = DB.consultas.filter(c => c.data_consulta === hoje).length;
  (document.getElementById('stHoje') as HTMLElement).textContent = String(hoje_c);

  // Pacientes recentes
  const dp = document.getElementById('dashPacientes') as HTMLElement;
  dp.innerHTML = DB.pacientes.slice(0, 5).map((p, i) => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:38px;height:38px;background:${AVATAR_COLORS[i % 6]};border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;flex-shrink:0">
        ${p.nome.slice(0, 2).toUpperCase()}
      </div>
      <div>
        <div style="font-weight:600;font-size:14px">${p.nome}</div>
        <div style="font-size:12px;color:var(--muted)">ID #${p.id}</div>
      </div>
    </div>
  `).join('');

  // Últimos atendimentos
  const da = document.getElementById('dashAtendimentos') as HTMLElement;
  const atEnd = getAtendimentos().slice(-6).reverse();
  if (atEnd.length === 0) {
    da.innerHTML = '<div class="empty"><div class="empty-icon">📋</div><p>Nenhum atendimento</p></div>';
  } else {
    da.innerHTML = atEnd.map(a => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
        <div><strong style="font-size:14px">${a.nome}</strong>
          <span style="color:var(--muted);font-size:13px;margin-left:8px">${a.sintoma}</span>
        </div>
        <span style="font-size:12px;color:var(--muted)">${formatDate(a.data_consulta)}</span>
      </div>
    `).join('');
  }
}

// ════════════════════════════════════════════════════════════
//  PACIENTES
// ════════════════════════════════════════════════════════════

function refreshPacientes(): void {
  const grid = document.getElementById('pacientesGrid') as HTMLElement;
  grid.innerHTML = DB.pacientes.map((p, i) => `
    <div class="p-card">
      <div class="p-avatar" style="background:${AVATAR_COLORS[i % 6]}">
        ${p.nome.slice(0, 2).toUpperCase()}
      </div>
      <div class="p-info">
        <div class="p-name">${p.nome}</div>
        <div class="p-id">ID #${p.id}</div>
      </div>
      <div class="p-actions">
        <button class="btn btn-sm btn-outline" onclick="abrirEditar(${p.id},'${escQ(p.nome)}')">✏️</button>
        <button class="btn btn-sm btn-danger"  onclick="abrirExcluir(${p.id},'${escQ(p.nome)}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

function abrirModalNovoPaciente(): void {
  (document.getElementById('novoPacienteNome') as HTMLInputElement).value = '';
  (document.getElementById('overlayNovoPaciente') as HTMLElement).classList.add('show');
}

function confirmarNovoPaciente(): void {
  const n = (document.getElementById('novoPacienteNome') as HTMLInputElement).value.trim();
  if (!n) { showToast('error', 'Nome não pode ser vazio!'); return; }
  DB.pacientes.push({ id: DB.nextPacienteId++, nome: n });
  fecharModal('overlayNovoPaciente');
  refreshPacientes();
  refreshDashboard();
  showToast('success', `✅ Paciente "${n}" cadastrado!`);
}

function abrirEditar(id: number, nome: string): void {
  editTarget = { id, nome };
  (document.getElementById('editNomeInput') as HTMLInputElement).value = nome;
  (document.getElementById('overlayEdit') as HTMLElement).classList.add('show');
}

function confirmarEdicao(): void {
  const n = (document.getElementById('editNomeInput') as HTMLInputElement).value.trim();
  if (!n) { showToast('error', 'Nome inválido!'); return; }
  const p = DB.pacientes.find(x => x.id === editTarget!.id);
  if (p) p.nome = n;
  fecharModal('overlayEdit');
  refreshPacientes();
  refreshDashboard();
  refreshAtendimentos();
  showToast('success', `✅ Paciente atualizado para "${n}"`);
}

function abrirExcluir(id: number, nome: string): void {
  deleteTarget = { id, nome };
  (document.getElementById('deleteNomeTxt') as HTMLElement).textContent = nome;
  (document.getElementById('overlayDelete') as HTMLElement).classList.add('show');
}

function confirmarExclusao(): void {
  DB.pacientes = DB.pacientes.filter(x => x.id !== deleteTarget!.id);
  const cids = DB.consultas.filter(c => c.paciente_id === deleteTarget!.id).map(c => c.id);
  DB.consultas = DB.consultas.filter(c => c.paciente_id !== deleteTarget!.id);
  DB.consulta_sintoma = DB.consulta_sintoma.filter(cs => !cids.includes(cs.consulta_id));
  fecharModal('overlayDelete');
  refreshPacientes();
  refreshDashboard();
  refreshAtendimentos();
  showToast('info', `🗑️ "${deleteTarget!.nome}" removido`);
}

function fecharModal(id: string): void {
  (document.getElementById(id) as HTMLElement).classList.remove('show');
}

// ════════════════════════════════════════════════════════════
//  ATENDIMENTOS
// ════════════════════════════════════════════════════════════

function getAtendimentos(): Atendimento[] {
  return DB.consultas.map(c => {
    const p  = DB.pacientes.find(x => x.id === c.paciente_id);
    const ss = DB.consulta_sintoma.filter(cs => cs.consulta_id === c.id);
    const nomes = ss.map(cs => DB.sintomas.find(s => s.id === cs.sintoma_id)?.descricao || '?');
    return {
      id: c.id,
      paciente_id: c.paciente_id,
      nome: p ? p.nome : 'Desconhecido',
      sintoma: nomes.join(', ') || '—',
      data_consulta: c.data_consulta,
    };
  });
}

function refreshAtendimentos(): void {
  const hist  = document.getElementById('ateHistorico') as HTMLElement;
  const lista = getAtendimentos().reverse();
  if (lista.length === 0) {
    hist.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:30px">Nenhum atendimento registrado</td></tr>';
    return;
  }
  hist.innerHTML = lista.map(a => `
    <tr>
      <td><span class="badge badge-blue">#${a.id}</span></td>
      <td><strong>${a.nome}</strong></td>
      <td>${a.sintoma}</td>
      <td style="color:var(--muted)">${formatDate(a.data_consulta)}</td>
    </tr>
  `).join('');
}

function registrarAtendimento(): void {
  const nome  = (document.getElementById('ateNome') as HTMLInputElement).value.trim();
  const sint  = (document.getElementById('ateSintoma') as HTMLInputElement).value.trim();

  if (!nome || !sint) { showToast('error', 'Preencha nome e sintoma!'); return; }

  // Busca ou cria paciente
  let p = DB.pacientes.find(x => x.nome.toLowerCase() === nome.toLowerCase());
  if (!p) { p = { id: DB.nextPacienteId++, nome }; DB.pacientes.push(p); }

  // Busca ou cria sintoma
  let s = DB.sintomas.find(x => x.descricao.toLowerCase() === sint.toLowerCase());
  if (!s) { s = { id: DB.nextSintomaId++, descricao: sint }; DB.sintomas.push(s); }

  // Registra consulta
  const hoje = new Date().toISOString().split('T')[0];
  const cid  = DB.nextConsultaId++;
  DB.consultas.push({ id: cid, paciente_id: p.id, data_consulta: hoje });
  DB.consulta_sintoma.push({ consulta_id: cid, sintoma_id: s.id });

  (document.getElementById('ateNome') as HTMLInputElement).value    = '';
  (document.getElementById('ateSintoma') as HTMLInputElement).value = '';

  refreshAtendimentos();
  refreshDashboard();
  refreshPacientes();
  showToast('success', `✅ Atendimento de "${nome}" registrado!`);
}

// ════════════════════════════════════════════════════════════
//  RELATÓRIOS SQL
// ════════════════════════════════════════════════════════════

function runQuery(q: string): void {
  const box = document.getElementById('codeResult') as HTMLElement;
  let data: unknown;
  let title = '';

  switch (q) {
    case 'etapa6':
      title = '-- Etapa 6: JOIN básico Paciente + Consulta\nSELECT p.nome, c.data_consulta\nFROM pacientes p JOIN consultas c ON p.id = c.paciente_id;\n\n';
      data  = DB.consultas.map(c => {
        const p = DB.pacientes.find(x => x.id === c.paciente_id);
        return { nome: p?.nome ?? '?', data_consulta: c.data_consulta };
      });
      break;

    case 'etapa7':
      title = '-- Etapa 7: JOIN completo Paciente + Sintoma\nSELECT p.nome, s.descricao AS sintoma\nFROM pacientes p JOIN consultas c ...\n\n';
      data  = DB.consulta_sintoma.map(cs => {
        const c = DB.consultas.find(x => x.id === cs.consulta_id);
        const p = DB.pacientes.find(x => x.id === c?.paciente_id);
        const s = DB.sintomas.find(x => x.id === cs.sintoma_id);
        return { nome: p?.nome ?? '?', sintoma: s?.descricao ?? '?' };
      });
      break;

    case 'etapa8': {
      title = "-- Etapa 8: Filtro - Pacientes com Febre\nSELECT DISTINCT p.nome\nFROM ... WHERE s.descricao = 'Febre';\n\n";
      const fid  = DB.sintomas.find(x => x.descricao === 'Febre')?.id;
      const cids = DB.consulta_sintoma.filter(cs => cs.sintoma_id === fid).map(cs => cs.consulta_id);
      const pids = [...new Set(DB.consultas.filter(c => cids.includes(c.id)).map(c => c.paciente_id))];
      data = DB.pacientes.filter(p => pids.includes(p.id)).map(p => ({ nome: p.nome }));
      break;
    }

    case 'etapa9':
      title = '-- Etapa 9: Total de consultas por paciente\nSELECT p.nome, COUNT(c.id) AS total_consultas\nFROM pacientes p LEFT JOIN consultas c ON p.id=c.paciente_id\nGROUP BY p.id;\n\n';
      data  = DB.pacientes.map(p => ({
        nome: p.nome,
        total_consultas: DB.consultas.filter(c => c.paciente_id === p.id).length,
      }));
      break;

    case 'etapa10': {
      title = '-- Etapa 10: Sintoma mais frequente\nSELECT s.descricao, COUNT(cs.sintoma_id) AS frequencia\nFROM consulta_sintoma cs JOIN sintomas s ...\nORDER BY frequencia DESC LIMIT 1;\n\n';
      const freq: Record<number, number> = {};
      DB.consulta_sintoma.forEach(cs => { freq[cs.sintoma_id] = (freq[cs.sintoma_id] || 0) + 1; });
      const max = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
      const s   = max ? DB.sintomas.find(x => x.id === Number(max[0])) : null;
      data = s ? { descricao: s.descricao, frequencia: max[1] } : { descricao: 'N/A', frequencia: 0 };
      break;
    }

    default:
      title = '-- SELECT * FROM pacientes;\n\n';
      data  = DB.pacientes;
  }

  box.innerHTML =
    `<span style="color:#94a3b8">${title}</span>` +
    JSON.stringify(data, null, 2)
      .replace(/"([^"]+)":/g, '<span class="key">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="str">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="val">$1</span>');
}

// ════════════════════════════════════════════════════════════
//  GERAÇÃO DE PDF (abre janela de impressão)
// ════════════════════════════════════════════════════════════

function gerarPDF(): void {
  showToast('info', '📄 Gerando PDF...');

  const atEnd      = getAtendimentos();
  const hoje       = new Date().toISOString().split('T')[0];
  const hojeFmt    = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const totalPorPaciente = DB.pacientes.map(p => ({
    id: p.id, nome: p.nome,
    total: DB.consultas.filter(c => c.paciente_id === p.id).length,
  }));

  const freq: Record<number, number> = {};
  DB.consulta_sintoma.forEach(cs => { freq[cs.sintoma_id] = (freq[cs.sintoma_id] || 0) + 1; });
  const maxE      = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  const sintomaTop = maxE ? DB.sintomas.find(x => x.id === Number(maxE[0]))?.descricao : 'N/A';
  const freqTop    = maxE ? maxE[1] : 0;

  const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Relatório Clínica Medical</title>
<style>
  body{font-family:Arial,sans-serif;margin:0;padding:0;color:#0f172a;font-size:13px;}
  .hdr{background:#0a1628;color:white;padding:36px 40px;display:flex;align-items:center;justify-content:space-between;}
  .hdr h1{font-size:26px;margin:0;font-weight:800;}
  .hdr p{margin:6px 0 0;opacity:.6;font-size:13px;}
  .hdr-r{text-align:right;font-size:13px;opacity:.7;}
  .sec{padding:28px 40px;border-bottom:1px solid #e2e8f0;}
  .sec-t{font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#1a56db;margin-bottom:16px;}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
  .stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;text-align:center;}
  .stat-n{font-size:30px;font-weight:800;color:#1a56db;}
  .stat-l{font-size:12px;color:#64748b;margin-top:4px;}
  table{width:100%;border-collapse:collapse;}
  th{background:#f1f5f9;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#64748b;padding:10px 14px;text-align:left;}
  td{padding:11px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;}
  .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;}
  .bb{background:#eef2ff;color:#1a56db;}.bg{background:#ecfdf5;color:#059669;}.ba{background:#fffbeb;color:#d97706;}
  .hl{background:#eef2ff;border-radius:10px;padding:16px;display:flex;justify-content:space-between;align-items:center;}
  .hl h4{font-size:15px;font-weight:700;color:#1a56db;margin:0;}
  .hl p{margin:4px 0 0;color:#64748b;font-size:12px;}
  .hl .big{font-size:28px;font-weight:800;color:#1a56db;}
  .ftr{background:#f8fafc;padding:16px 40px;text-align:center;color:#94a3b8;font-size:11px;}
</style></head><body>
<div class="hdr">
  <div><div style="font-size:28px;margin-bottom:8px">🏥</div><h1>Clínica Medical</h1><p>Relatório Geral do Sistema de Gestão</p></div>
  <div class="hdr-r"><div>Gerado em</div><div style="font-size:15px;font-weight:700;color:white;margin-top:4px">${hojeFmt}</div></div>
</div>
<div class="sec">
  <div class="sec-t">📊 Resumo Geral</div>
  <div class="stats">
    <div class="stat"><div class="stat-n">${DB.pacientes.length}</div><div class="stat-l">Pacientes</div></div>
    <div class="stat"><div class="stat-n">${DB.consultas.length}</div><div class="stat-l">Consultas</div></div>
    <div class="stat"><div class="stat-n">${DB.sintomas.length}</div><div class="stat-l">Sintomas</div></div>
    <div class="stat"><div class="stat-n">${DB.consultas.filter(c => c.data_consulta === hoje).length}</div><div class="stat-l">Hoje</div></div>
  </div>
</div>
<div class="sec">
  <div class="sec-t">👥 Pacientes Cadastrados</div>
  <table><thead><tr><th>ID</th><th>Nome</th><th>Consultas</th></tr></thead><tbody>
  ${totalPorPaciente.map(p => `<tr><td><span class="badge bb">#${p.id}</span></td><td>${p.nome}</td><td><span class="badge bg">${p.total}</span></td></tr>`).join('')}
  </tbody></table>
</div>
<div class="sec">
  <div class="sec-t">🩺 Histórico de Atendimentos</div>
  <table><thead><tr><th>#</th><th>Paciente</th><th>Sintoma(s)</th><th>Data</th></tr></thead><tbody>
  ${atEnd.map(a => `<tr><td><span class="badge bb">${a.id}</span></td><td>${a.nome}</td><td>${a.sintoma}</td><td>${a.data_consulta}</td></tr>`).join('')}
  </tbody></table>
</div>
<div class="sec">
  <div class="sec-t">⭐ Análise de Sintomas</div>
  <div class="hl"><div><h4>Sintoma mais frequente: ${sintomaTop}</h4><p>Aparece em ${freqTop} consulta(s)</p></div><div class="big">${freqTop}×</div></div>
  <div style="margin-top:16px">
  <table><thead><tr><th>Sintoma</th><th>Frequência</th></tr></thead><tbody>
  ${DB.sintomas.map(s => `<tr><td>${s.descricao}</td><td><span class="badge ba">${DB.consulta_sintoma.filter(cs => cs.sintoma_id === s.id).length}×</span></td></tr>`).join('')}
  </tbody></table></div>
</div>
<div class="ftr">Clínica Medical — Sistema de Gestão v2.0 · Relatório gerado em ${new Date().toLocaleString('pt-BR')}</div>
</body></html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (win) {
    win.document.write(htmlContent);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      showToast('success', '✅ PDF pronto!');
    }, 600);
  }
}

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════

function formatDate(d: string): string {
  if (!d) return '—';
  try {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  } catch {
    return d;
  }
}

function escQ(s: string): string {
  return s.replace(/'/g, "\\'");
}

function showToast(type: 'success' | 'error' | 'info', msg: string): void {
  const t = document.getElementById('toast') as HTMLElement;
  t.className  = 'toast ' + type;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ════════════════════════════════════════════════════════════
//  EVENTOS
// ════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Fechar overlay ao clicar fora
  document.querySelectorAll('.overlay').forEach(o => {
    o.addEventListener('click', (e: Event) => {
      if (e.target === o) (o as HTMLElement).classList.remove('show');
    });
  });

  // Enter no campo usuário → vai para senha
  const userInput = document.getElementById('loginUser') as HTMLInputElement;
  userInput?.addEventListener('keypress', (e: KeyboardEvent) => {
    if (e.key === 'Enter') (document.getElementById('loginPass') as HTMLInputElement).focus();
  });

  // Enter na senha → faz login
  const passInput = document.getElementById('loginPass') as HTMLInputElement;
  passInput?.addEventListener('keypress', (e: KeyboardEvent) => {
    if (e.key === 'Enter') doLogin();
  });
});
