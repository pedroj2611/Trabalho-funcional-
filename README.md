# 🏥 Clínica Medical — Sistema de Gestão

Sistema de gestão clínica com autenticação, gerenciamento de pacientes, atendimentos e relatórios SQL.

## 👤 Acesso
| Login | Senha |
|-------|-------|
| admin | admin |

## 📁 Estrutura do Projeto
```
clinica-medical/
├── public/
│   ├── index.html        ← Estrutura HTML
│   ├── css/
│   │   └── style.css     ← Estilos CSS
│   └── js/
│       ├── app.ts        ← Lógica TypeScript (fonte)
│       └── app.js        ← Lógica compilada (browser)
├── tsconfig.json
├── package.json
└── README.md
```

## 🚀 Como usar

### Opção 1 — Abrir direto no navegador
Abra o arquivo `public/index.html` no navegador.

### Opção 2 — Servidor local
```bash
npm install
npm start
# Acesse: http://localhost:3000
```

### Compilar TypeScript
```bash
npm run build
# ou em modo watch:
npm run watch
```

## 🧩 Funcionalidades
- ✅ Login com usuário `admin` / senha `admin`
- ✅ Dashboard com estatísticas em tempo real
- ✅ Cadastro, edição e exclusão de pacientes
- ✅ Registro de atendimentos (paciente + sintoma)
- ✅ Relatórios SQL (Etapas 6 a 10)
- ✅ Geração de PDF com todos os dados

## 🛠 Tecnologias
- **TypeScript** — tipagem estática
- **HTML5 + CSS3** — interface responsiva
- **SQLite (in-memory)** — banco de dados simulado
- **JWT + bcrypt** — autenticação (referência de backend)

## 🌿 Branches
- `master` — versão de produção estável
- `brendi` — branch de desenvolvimento (Brendi)
- `pedro`  — branch de desenvolvimento (Pedro)

---
Autores: **Pedro J.** / **Brendi** · v2.0
