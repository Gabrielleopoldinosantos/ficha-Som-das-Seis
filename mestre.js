import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    onSnapshot,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { login, onAuthChange, logout } from "./auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCp5slzZKVuMQ5N86zv2vXbvMGEeNwem94",
    authDomain: "sds-ficha.firebaseapp.com",
    projectId: "sds-ficha",
    storageBucket: "sds-ficha.firebasestorage.app",
    messagingSenderId: "406558124782",
    appId: "1:406558124782:web:e1f68e6693a57dde7ea1ff",
    measurementId: "G-79SRX1P4D7"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─────────────────────────────────────────────────────────────
//  AUTENTICAÇÃO
// ─────────────────────────────────────────────────────────────
let usuarioAtual = null;
let unsubFichas = null;
let unsubRolagens = null;

onAuthChange((user) => {
    console.log('onAuthChange chamado com user:', user);
    usuarioAtual = user;
    if (user) {
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('telaMestre').style.display = 'block';
        // Iniciar listeners após login
        iniciarListeners();
    } else {
        document.getElementById('telaLogin').style.display = 'block';
        document.getElementById('telaMestre').style.display = 'none';
        // Parar listeners
        if (unsubFichas) unsubFichas();
        if (unsubRolagens) unsubRolagens();
        unsubFichas = null;
        unsubRolagens = null;
        jogadoresFirebase = {};
        renderizarTracker();
    }
});

function iniciarListeners() {
    // ── 1. FICHAS ─────────────────────────────────────────────
    unsubFichas = onSnapshot(collection(db, "fichas"), (snapshot) => {
        const grid = document.getElementById('gridPlayers');
        if (!grid) return;
        grid.innerHTML = '';

        snapshot.forEach((docSnap) => {
            const p = docSnap.data();
            const agi = parseInt(p.agilidade) || 0;
            const cor = parseInt(p.coragem)   || 0;

            // Atualiza tracker em tempo real
            jogadoresFirebase[docSnap.id] = {
                id: 'fb_' + docSnap.id,
                nome: p.nome || 'Pistoleiro',
                valor: agi + cor,
                avatarUrl: p.avatarUrl || ''
            };

            // Card de player
            const defTotal   = 5 + (parseInt(p.defesaBonus) || 0);
            const acoesTotal = 1 + agi + (parseInt(p.acoesBonus) || 0);
            const honra      = p.honraValor || 0;
            const vidaPct    = p.vidaMax > 0 ? Math.min(100, (p.vida / p.vidaMax) * 100) : 0;

            const avatarHTML = p.avatarUrl?.trim()
                ? `<img class="card-avatar" src="${p.avatarUrl}" alt="" onerror="this.style.display='none'">`
                : `<div class="card-avatar-placeholder">🤠</div>`;

            grid.innerHTML += `
                <div class="card-player">
                    <div class="card-header">${avatarHTML}<span>${p.nome || 'Pistoleiro'}</span></div>
                    <div class="card-body">
                        <div class="status-mini">
                            <span>PV: ${p.vida}/${p.vidaMax}</span>
                            <span>${p.agua ? '💧' : '💀'} ${p.comida ? '🍖' : '💀'}</span>
                        </div>
                        <div class="vida-barra"><div class="vida-progresso" style="width:${vidaPct}%"></div></div>
                        <div style="margin:8px 0;padding:5px;border:1px solid #6b4a7a;border-radius:4px;background:rgba(26,16,21,0.6);text-align:center;">
                            <div style="font-family:'Rye';color:#c8a2d0;font-size:0.65em;text-transform:uppercase;letter-spacing:1px;">Tormento</div>
                            <div style="font-family:'Special Elite';color:#e8dcc0;font-size:0.85em;font-style:italic;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${p.tormento || ''}">${p.tormento || '---'}</div>
                        </div>
                        <div class="info-combat-bar">
                            <div class="info-combat-item">DEFESA <b>${defTotal}</b></div>
                            <div class="divider">|</div>
                            <div class="info-combat-item">AÇÕES <b>${acoesTotal}</b></div>
                            <div class="divider">|</div>
                            <div class="info-combat-item">HONRA <b>${honra}</b></div>
                        </div>
                        ${p.montariaNome ? `
                        <div style="border:1px solid #3d2f24;padding:8px;border-radius:4px;background:rgba(0,0,0,0.2);margin-top:10px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                                <span style="font-family:'Rye';color:#d4a574;font-size:0.8em;">🐎 ${p.montariaNome}</span>
                                <span style="font-size:0.7em;color:#e8dcc0;font-family:'Special Elite';">${p.montariaPV}/${p.montariaPVMax}</span>
                            </div>
                            <div class="vida-barra" style="height:8px;background:#1a0a0a;">
                                <div class="vida-progresso" style="width:${p.montariaPVMax>0?Math.min(100,(p.montariaPV/p.montariaPVMax)*100):0}%;background:linear-gradient(90deg,#44ff44,#228822);"></div>
                            </div>
                        </div>` : ''}
                    </div>
                </div>`;
        });

        renderizarTracker();
    });

    // ── 2. LOG ────────────────────────────────────────────────
    const qRolagens = query(collection(db, "rolagens"), orderBy("timestamp", "desc"), limit(20));
    unsubRolagens = onSnapshot(qRolagens, (snapshot) => {
        const logDiv = document.getElementById('logRolagens');
        if (!logDiv) return;
        logDiv.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const r = docSnap.data();
            const hora = r.timestamp
                ? new Date(r.timestamp.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '--:--';
            const item = document.createElement('div');
            item.className = 'log-item';
            if (r.dado === 6) item.style.borderLeftColor = '#4ade80';
            if (r.dado === 1) item.style.borderLeftColor = '#ef4444';
            item.innerHTML = `
                <span class="log-resultado">${r.total}</span>
                <span class="log-nome">${r.player}</span>
                <span class="log-detalhe">${r.tipo}</span>
                <div style="font-size:0.8em;color:#8b6f47;">[Dado: ${r.dado}, Bônus: ${r.bonus}] • ${hora}</div>`;
            logDiv.appendChild(item);
        });
    });
}

// jogadores: mapa id → entry  (atualizado em tempo real)
// extras: entradas manuais do mestre
let jogadoresFirebase = {};
let extrasTracker = [];

// ── 3. TRACKER ────────────────────────────────────────────
function todasEntradas() {
    return [...Object.values(jogadoresFirebase), ...extrasTracker]
        .sort((a, b) => b.valor - a.valor);
}

function renderizarTracker() {
    const container = document.getElementById('trackerLista');
    if (!container) return;
    const lista = todasEntradas();

    if (lista.length === 0) {
        container.innerHTML = `<div class="tracker-empty">Aguardando fichas dos jogadores...</div>`;
        return;
    }

    container.innerHTML = lista.map((entry, idx) => {
        const isExtra   = !!entry._extra;
        const avatarTag = entry.avatarUrl
            ? `<img class="t-avatar" src="${entry.avatarUrl}" alt="" onerror="this.style.display='none'">`
            : `<span class="t-avatar-blank">—</span>`;
        const removeBtn = isExtra
            ? `<button class="t-remove" onclick="window.removerExtra('${entry.id}')">✕</button>`
            : `<span class="t-tag">JOGADOR</span>`;

        return `
            <div class="t-row ${isExtra ? 't-extra' : 't-player'}">
                <span class="t-pos">${idx + 1}</span>
                <span class="t-val">${entry.valor}</span>
                ${avatarTag}
                <span class="t-nome">${entry.nome}</span>
                ${removeBtn}
            </div>`;
    }).join('');
}

window.removerExtra = function(id) {
    extrasTracker = extrasTracker.filter(e => e.id !== id);
    renderizarTracker();
};

window.adicionarEntrada = function() {
    const nomeEl = document.getElementById('addNome');
    const valEl  = document.getElementById('addVal');
    const nome   = nomeEl.value.trim();
    const val    = parseInt(valEl.value) || 0;
    if (!nome) { nomeEl.focus(); return; }
    extrasTracker.push({ id: 'x_' + Date.now(), nome, valor: val, _extra: true });
    nomeEl.value = '';
    valEl.value  = '';
    nomeEl.focus();
    renderizarTracker();
};

window.limparExtras = function() {
    extrasTracker = [];
    renderizarTracker();
};

window.fazerLoginMestre = async function() {
    const senha = document.getElementById('senhaMestre').value.trim();
    console.log('Tentando login com senha:', senha);
    if (!senha) {
        mostrarErroLogin('Digite a senha.');
        return;
    }
    try {
        console.log('Chamando login...');
        await login(senha);
        console.log('Login bem-sucedido');
        document.getElementById('erroLoginMestre').textContent = '';
    } catch (error) {
        console.error('Erro no login:', error);
        mostrarErroLogin(traduzirErroAuth(error.code));
    }
};

window.fazerLogoutMestre = async function() {
    await logout();
};

function mostrarErroLogin(msg) {
    document.getElementById('erroLoginMestre').textContent = msg;
}

function traduzirErroAuth(code) {
    switch (code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Senha incorreta.';
        case 'auth/too-many-requests':
            return 'Muitas tentativas. Tente novamente mais tarde.';
        default:
            return 'Erro de autenticação.';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    const addNome = document.getElementById('addNome');
    const addVal  = document.getElementById('addVal');
    if (addNome) addNome.addEventListener('keydown', e => { if (e.key === 'Enter') addVal?.focus(); });
    if (addVal)  addVal.addEventListener('keydown',  e => { if (e.key === 'Enter') window.adicionarEntrada(); });

    // Login button
    const btnLogin = document.getElementById('btnLoginMestre');
    console.log('btnLogin:', btnLogin);
    if (btnLogin) btnLogin.addEventListener('click', window.fazerLoginMestre);
    const senhaInput = document.getElementById('senhaMestre');
    if (senhaInput) senhaInput.addEventListener('keydown', e => { if (e.key === 'Enter') window.fazerLoginMestre(); });

    renderizarTracker();
});