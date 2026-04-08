import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore, doc, setDoc, getDoc, collection, addDoc, serverTimestamp, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCp5slzZKVuMQ5N86zv2vXbvMGEeNwem94",
    authDomain: "sds-ficha.firebaseapp.com",
    projectId: "sds-ficha",
    storageBucket: "sds-ficha.firebasestorage.app",
    messagingSenderId: "406558124782",
    appId: "1:406558124782:web:e1f68e6693a57dde7ea1ff",
    measurementId: "G-79SRX1P4D7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let idFichaAtual = localStorage.getItem('idFichaAtual') || null;

// ─────────────────────────────────────────
//  INDICADOR DE SALVAMENTO
// ─────────────────────────────────────────
function mostrarStatusSalvamento(status) {
    const indicator = document.getElementById('saveIndicator');
    if (!indicator) return;
    indicator.className = 'save-indicator ' + status;
    if (status === 'saving') {
        indicator.innerHTML = '<span class="save-dot"></span> SALVANDO...';
    } else if (status === 'saved') {
        indicator.innerHTML = '<span class="save-check">✓</span> SALVO';
        setTimeout(() => {
            indicator.className = 'save-indicator idle';
            indicator.innerHTML = '';
        }, 3000);
    } else if (status === 'error') {
        indicator.innerHTML = '<span class="save-x">✗</span> ERRO AO SALVAR';
    }
}

// ─────────────────────────────────────────
//  AVATAR DO PERSONAGEM
// ─────────────────────────────────────────
window.abrirInputAvatar = function() {
    const url = prompt('Cole aqui a URL da imagem do seu personagem:', document.getElementById('avatarUrl')?.value || '');
    if (url !== null) {
        const input = document.getElementById('avatarUrl');
        if (input) input.value = url;
        atualizarAvatar(url);
        autoSalvar();
    }
};

function atualizarAvatar(url) {
    const img         = document.getElementById('avatarImg');
    const placeholder = document.getElementById('avatarPlaceholder');
    if (!img) return;
    if (url && url.trim()) {
        img.src = url.trim();
        img.classList.remove('sem-foto');
        if (placeholder) placeholder.style.display = 'none';
    } else {
        img.src = '';
        img.classList.add('sem-foto');
        if (placeholder) placeholder.style.display = 'flex';
    }
}

// ─────────────────────────────────────────
//  COMBATE DINÂMICO
// ─────────────────────────────────────────
let modoDinamico = false;

function danoParaMedia(opcao) {
    const tabela = { '0': 0, '1d3': 1, '1d6': 3, '2d6': 6, '3d6': 9, '4d6': 12, '5d6': 15, '6d6': 18 };
    return tabela[opcao] ?? 0;
}

function calcularMedia(campoId) {
    const pontos  = parseInt(document.getElementById(campoId)?.value) || 0;
    const modEl   = document.getElementById(campoId + 'Mod');
    const mod     = modEl ? (parseInt(modEl.value) || 0) : 0;
    return 3 + pontos + mod;
}

function atualizarMediasVisuais() {
    ['fisico','agilidade','intelecto','coragem'].forEach(id => {
        const el = document.getElementById('media' + id.charAt(0).toUpperCase() + id.slice(1));
        if (el) el.textContent = calcularMedia(id);
    });

    ['combate','negocios','montaria','tradicao','labuta','exploracao',
     'roubo','medicina','tecnologia','culinaria','domestico','direcao'].forEach(id => {
        const el = document.getElementById('media_' + id);
        if (el) el.textContent = calcularMedia(id);
    });

    const agi = parseInt(document.getElementById('agilidade')?.value) || 0;
    const cor = parseInt(document.getElementById('coragem')?.value) || 0;
    const elIni = document.getElementById('iniciativaDinamica');
    if (elIni) elIni.textContent = agi + cor;

    document.querySelectorAll('.ataque-box').forEach(box => {
        const bonusAtkEl  = box.querySelector('.atk-bonus');
        const danoSel     = box.querySelector('.ataque-dano-select');
        const bonusDanoEl = box.querySelector('.atk-dano-bonus');
        const mediaAtkEl  = box.querySelector('.atk-media-atk');
        const mediaDanoEl = box.querySelector('.atk-media-dano');

        if (!mediaAtkEl || !mediaDanoEl) return;

        const bonusAtk  = parseInt(bonusAtkEl?.value) || 0;
        const mediaAtk  = calcularMedia('combate') + bonusAtk;
        mediaAtkEl.textContent = ' ' + mediaAtk;

        const danoBase  = danoParaMedia(danoSel?.value || '0');
        const bonusDano = parseInt(bonusDanoEl?.value) || 0;
        const mediaDano = danoBase + bonusDano;
        mediaDanoEl.textContent = mediaDano;
    });
}

window.toggleCombateDinamico = function() {
    modoDinamico = !modoDinamico;
    document.body.classList.toggle('combate-dinamico', modoDinamico);

    const btn = document.getElementById('btnCombateDinamico');
    if (btn) {
        btn.textContent = modoDinamico ? 'COMBATE NORMAL' : 'COMBATE DINÂMICO';
    }

    if (modoDinamico) atualizarMediasVisuais();
    autoSalvar();
};

// ─────────────────────────────────────────
//  PIPS
// ─────────────────────────────────────────
function configurarPips() {
    document.querySelectorAll('.pips-container').forEach(container => {
        const idAlvo = container.getAttribute('data-ant');
        const pips = container.querySelectorAll('.pip');
        const hiddenInput = document.getElementById(idAlvo);

        pips.forEach(pip => {
            pip.addEventListener('click', () => {
                const val = parseInt(pip.getAttribute('data-value'));
                const novoValor = (hiddenInput.value == val) ? 0 : val;
                hiddenInput.value = novoValor;
                atualizarPipsVisual(container, novoValor);
                if (modoDinamico) atualizarMediasVisuais();
                autoSalvar();
            });
        });
    });
}

function atualizarPipsVisual(container, valor) {
    container.querySelectorAll('.pip').forEach(p => {
        p.classList.toggle('filled', parseInt(p.getAttribute('data-value')) <= valor);
    });
}

// ─────────────────────────────────────────
//  ATAQUES
// ─────────────────────────────────────────
function criarEstruturaAtaque(nome = '', bonusAtk = 0, dano = '0', bonusDano = 0) {
    const div = document.createElement('div');
    div.className = 'ataque-box';

    div.innerHTML = `
      <div class="ataque-header">
        <input type="text" placeholder="NOME DO ATAQUE" value="${nome}">
        <button class="btn btn-small btn-danger" onclick="this.closest('.ataque-box').remove(); window.triggerSalvar()">🗑️</button>
      </div>

      <div class="ataque-corpo">

        <div class="ataque-col col-atk">
          <span class="ataque-col-label">Ataque</span>
          <div class="ataque-controls">
            <input type="number" class="atk-bonus" value="${bonusAtk}" title="Bônus/ônus no ataque">
            <button class="atk-btn-rolar-atk" onclick="window.rolarAtaque(this)">🎲 ATQ</button>
          </div>
          <span class="atk-media-atk">—</span>
        </div>

        <div class="ataque-col-sep"></div>

        <div class="ataque-col col-dano">
          <span class="ataque-col-label">Dano</span>
          <select class="ataque-dano-select">
            <option value="0"   ${dano==='0'   ?'selected':''}>0</option>
            <option value="1d3" ${dano==='1d3' ?'selected':''}>1d3</option>
            <option value="1d6" ${dano==='1d6' ?'selected':''}>1d6</option>
            <option value="2d6" ${dano==='2d6' ?'selected':''}>2d6</option>
            <option value="3d6" ${dano==='3d6' ?'selected':''}>3d6</option>
            <option value="4d6" ${dano==='4d6' ?'selected':''}>4d6</option>
            <option value="5d6" ${dano==='5d6' ?'selected':''}>5d6</option>
            <option value="6d6" ${dano==='6d6' ?'selected':''}>6d6</option>
          </select>
          <div class="ataque-controls">
            <input type="number" class="atk-dano-bonus" value="${bonusDano}" title="Bônus/ônus no dano">
            <button class="atk-btn-rolar-dano" onclick="window.rolarDanoAtaque(this)">🎲 DANO</button>
          </div>
          <span class="atk-media-dano">—</span>
        </div>

      </div>
    `;

    div.addEventListener('input',  () => { if (modoDinamico) atualizarMediasVisuais(); window.triggerSalvar(); });
    div.addEventListener('change', () => { if (modoDinamico) atualizarMediasVisuais(); window.triggerSalvar(); });
    return div;
}

window.adicionarAtaque = function() {
    document.getElementById('ataquesContainer').appendChild(criarEstruturaAtaque());
};

window.rolarAtaque = function(btn) {
    const box = btn.closest('.ataque-box');
    const bonusAtkEl = box.querySelector('.atk-bonus');
    const bonusAtk   = parseInt(bonusAtkEl?.value) || 0;

    const pontCombate = parseInt(document.getElementById('combate')?.value) || 0;
    const modCombate  = parseInt(document.getElementById('combateMod')?.value) || 0;
    const totalBonus  = pontCombate + modCombate + bonusAtk;

    const dado = Math.floor(Math.random() * 6) + 1;
    const total = dado + totalBonus;

    const nomeAtaque = box.querySelector('input[type="text"]')?.value || 'Ataque';
    mostrarResultadoDado(dado, totalBonus, total);
    registrarRolagemNoFirebase(' ' + nomeAtaque, dado, totalBonus, total);
};

window.rolarDanoAtaque = function(btn) {
    const box = btn.closest('.ataque-box');
    const danoSel   = box.querySelector('.ataque-dano-select')?.value || '0';
    const bonusDano = parseInt(box.querySelector('.atk-dano-bonus')?.value) || 0;
    const nomeAtaque = box.querySelector('input[type="text"]')?.value || 'Ataque';

    if (danoSel === '0') {
        mostrarResultadoDano(0, bonusDano, bonusDano);
        return;
    }

    let resultado;
    if (danoSel === '1d3') {
        resultado = Math.floor(Math.random() * 3) + 1;
    } else {
        resultado = 0;
        const qtd = parseInt(danoSel.replace('d6',''));
        for (let i = 0; i < qtd; i++) resultado += Math.floor(Math.random() * 6) + 1;
    }

    const total = resultado + bonusDano;
    mostrarResultadoDano(resultado, bonusDano, total);
    registrarRolagemNoFirebase('Dano – ' + nomeAtaque, resultado, bonusDano, total);
};

// ─────────────────────────────────────────
//  ROLAR INICIATIVA
// ─────────────────────────────────────────
window.rolarIniciativa = function() {
    const cor    = parseInt(document.getElementById('coragem')?.value) || 0;
    const iniB   = parseInt(document.getElementById('iniciativaBonus')?.value) || 0;
    const totalIniciativa = 1 + cor + iniB;

    const dado  = Math.floor(Math.random() * 6) + 1;
    const total = dado + totalIniciativa;

    mostrarResultadoDado(dado, totalIniciativa, total);
    registrarRolagemNoFirebase('Iniciativa', dado, totalIniciativa, total);
};

// ─────────────────────────────────────────
//  SALVAMENTO
// ─────────────────────────────────────────
function extrairAtaques() {
    return Array.from(document.getElementById('ataquesContainer').children).map(div => ({
        nome:      div.querySelector('input[type="text"]')?.value || '',
        bonusAtk:  div.querySelector('.atk-bonus')?.value || '0',
        dano:      div.querySelector('.ataque-dano-select')?.value || '0',
        bonusDano: div.querySelector('.atk-dano-bonus')?.value || '0'
    }));
}

async function salvarFichaFirebase() {
    const nomePersonagem = document.getElementById('nome').value.trim();
    const senha = document.getElementById('senha').value.trim().toUpperCase();
    if (!nomePersonagem || !senha) return;

    if (!idFichaAtual) {
        idFichaAtual = nomePersonagem.replace(/\s+/g, '_').toUpperCase();
        localStorage.setItem('idFichaAtual', idFichaAtual);
    }

    mostrarStatusSalvamento('saving');

    const ficha = {
        id: idFichaAtual, nome: nomePersonagem, senha,
        nivel: document.getElementById('nivel').value,
        dinheiro: document.getElementById('dinheiro').value,
        fisico: document.getElementById('fisico').value,
        agilidade: document.getElementById('agilidade').value,
        intelecto: document.getElementById('intelecto').value,
        coragem: document.getElementById('coragem').value,
        tormento: document.getElementById('tormento').value,
        vida: document.getElementById('vida').value,
        vidaMax: document.getElementById('vidaMax').value,
        agua: document.getElementById('agua').checked,
        comida: document.getElementById('comida').checked,
        defesaBonus: document.getElementById('defesaBonus').value,
        acoesBonus: document.getElementById('acoesBonus').value,
        iniciativaBonus: document.getElementById('iniciativaBonus').value,
        recompensas: document.getElementById('recompensas').value,
        valorRecompensa: document.getElementById('valorRecompensa').value,
        honraValor: document.getElementById('honraValor').value,
        modoDinamico: modoDinamico,
        avatarUrl: document.getElementById('avatarUrl')?.value || '',
        diarioSessao: document.getElementById('diarioSessao')?.value || '',
        combate: document.getElementById('combate').value,
        combateMod: document.getElementById('combateMod').value,
        negocios: document.getElementById('negocios').value,
        negociosMod: document.getElementById('negociosMod').value,
        montaria: document.getElementById('montaria').value,
        montariaMod: document.getElementById('montariaMod').value,
        tradicao: document.getElementById('tradicao').value,
        tradicaoMod: document.getElementById('tradicaoMod').value,
        labuta: document.getElementById('labuta').value,
        labutaMod: document.getElementById('labutaMod').value,
        exploracao: document.getElementById('exploracao').value,
        exploracaoMod: document.getElementById('exploracaoMod').value,
        roubo: document.getElementById('roubo').value,
        rouboMod: document.getElementById('rouboMod').value,
        medicina: document.getElementById('medicina').value,
        medicinaMod: document.getElementById('medicinaMod').value,
        tecnologia: document.getElementById('tecnologia').value,
        tecnologiaMod: document.getElementById('tecnologiaMod').value,
        culinaria: document.getElementById('culinaria').value,
        culinariaMod: document.getElementById('culinariaMod').value,
        domestico: document.getElementById('domestico').value,
        domesticoMod: document.getElementById('domesticoMod').value,
        direcao: document.getElementById('direcao').value,
        direcaoMod: document.getElementById('direcaoMod').value,
        montariaNome: document.getElementById('montariaNome').value,
        montariaPV: document.getElementById('montariaPV').value,
        montariaPVMax: document.getElementById('montariaPVMax').value,
        montariaDanoBonus: document.getElementById('montariaDanoBonus').value,
        montariaPotencia: document.getElementById('montariaPotencia').value,
        montariaResistencia: document.getElementById('montariaResistencia').value,
        ataques: extrairAtaques(),
        habilidades: extrairLista('habilidadesContainer'),
        inventario: extrairLista('inventarioContainer'),
        inventarioMontaria: extrairLista('inventarioMontariaContainer'),
        ultimaAtualizacao: serverTimestamp()
    };

    try {
        await setDoc(doc(db, "fichas", idFichaAtual), ficha);
        mostrarStatusSalvamento('saved');
    } catch (e) {
        console.error("Erro ao salvar:", e);
        mostrarStatusSalvamento('error');
    }
}

// ─────────────────────────────────────────
//  CARREGAMENTO
// ─────────────────────────────────────────
function preencherCampos(ficha) {
    if (ficha.id) { idFichaAtual = ficha.id; localStorage.setItem('idFichaAtual', idFichaAtual); }

    for (const key in ficha) {
        const el = document.getElementById(key);
        if (el && typeof ficha[key] !== 'object' && key !== 'modoDinamico') {
            if (el.type === 'checkbox') {
                el.checked = ficha[key];
            } else if (key === 'valorRecompensa' && ficha[key]) {
                const raw = String(ficha[key]).replace(/^R\$\s*/, '').trim();
                el.value = raw ? 'R$ ' + raw : '';
            } else {
                el.value = ficha[key];
            }
        }
    }

    if (ficha.avatarUrl) {
        atualizarAvatar(ficha.avatarUrl);
    }

    document.querySelectorAll('.pips-container').forEach(container => {
        atualizarPipsVisual(container, ficha[container.getAttribute('data-ant')] || 0);
    });

    document.getElementById('ataquesContainer').innerHTML = '';
    ficha.ataques?.forEach(a => {
        document.getElementById('ataquesContainer')
            .appendChild(criarEstruturaAtaque(a.nome, a.bonusAtk, a.dano, a.bonusDano));
    });

    document.getElementById('habilidadesContainer').innerHTML = '';
    ficha.habilidades?.forEach(h => {
        adicionarHabilidade();
        const div = document.getElementById('habilidadesContainer').lastElementChild;
        div.querySelector('input').value = h.nome;
        div.querySelector('textarea').value = h.descricao;
    });

    document.getElementById('inventarioContainer').innerHTML = '';
    carregarListaItens(ficha.inventario, window.adicionarItem, 'inventarioContainer');
    document.getElementById('inventarioMontariaContainer').innerHTML = '';
    carregarListaItens(ficha.inventarioMontaria, window.adicionarItemMontaria, 'inventarioMontariaContainer');

    if (ficha.modoDinamico) {
        modoDinamico = false;
        window.toggleCombateDinamico();
    }

    calcularValores();
    atualizarHonra();
}

// ─────────────────────────────────────────
//  SISTEMA DE DADOS
// ─────────────────────────────────────────
async function registrarRolagemNoFirebase(tipo, dado, bonus, total) {
    const player = document.getElementById('nome').value.trim() || "Pistoleiro Misterioso";
    try {
        await addDoc(collection(db, "rolagens"), {
            player, tipo, dado, bonus, total, timestamp: serverTimestamp()
        });
    } catch (e) { console.error("Erro rolagem:", e); }
}

window.rolarDado = function(campoId) {
    const dado = Math.floor(Math.random() * 6) + 1;
    const campo = document.getElementById(campoId);
    const val   = campo ? (parseInt(campo.value) || 0) : 0;
    const modEl = document.getElementById(campoId + 'Mod');
    const mod   = modEl ? (parseInt(modEl.value) || 0) : 0;
    const bonus = val + mod;
    const total = dado + bonus;

    const labelEl = campo?.closest('.campo-antecedente, .campo, .atributo-box')?.querySelector('label');
    const nome    = labelEl ? labelEl.textContent.trim() : campoId;

    mostrarResultadoDado(dado, bonus, total);
    registrarRolagemNoFirebase(nome, dado, bonus, total);
};

function mostrarResultadoDado(dado, bonus, total) {
    document.querySelectorAll('.dice-result').forEach(el => {
        el.style.animation = 'diceOut 0.25s ease-out forwards';
        setTimeout(() => el.remove(), 250);
    });

    const div = document.createElement('div');
    div.className = 'dice-result';
    let critico = '';

    if (dado === 6) {
        div.classList.add('critico-sucesso');
        critico = '<div class="critico-label">SUCESSO CRÍTICO!</div>';
    } else if (dado === 1) {
        div.classList.add('critico-falha');
        critico = '<div class="critico-label">ERRO CRÍTICO!</div>';
    }

    div.style.animation = 'diceIn 0.35s ease-out forwards';

    div.innerHTML = `
        <div class="dice-result-header">Bônus: ${bonus} + Dado: ${dado}</div>
        <div class="dice-result-total">${total}</div>
        ${critico}
        <div style="font-family:'Special Elite';font-size:0.25em;margin-top:20px;color:#8b6f47;letter-spacing:2px;">
            CLIQUE EM QUALQUER LUGAR PARA FECHAR
        </div>
    `;

    document.body.appendChild(div);

    function fechar() {
        div.style.animation = 'diceOut 0.3s ease-out forwards';
        setTimeout(() => div.remove(), 300);
        document.removeEventListener('click', fechar);
    }
    setTimeout(() => document.addEventListener('click', fechar), 120);
}

function mostrarResultadoDano(dado, bonus, total) {
    document.querySelectorAll('.dice-result').forEach(el => {
        el.style.animation = 'diceOut 0.25s ease-out forwards';
        setTimeout(() => el.remove(), 250);
    });

    const div = document.createElement('div');
    div.className = 'dice-result';
    div.style.animation = 'diceIn 0.35s ease-out forwards';

    div.innerHTML = `
        <div class="dice-result-header">Bônus: ${bonus} + Dado: ${dado}</div>
        <div class="dice-result-total">${total}</div>
        <div style="font-family:'Special Elite';font-size:0.25em;margin-top:20px;color:#8b6f47;letter-spacing:2px;">
            CLIQUE EM QUALQUER LUGAR PARA FECHAR
        </div>
    `;

    document.body.appendChild(div);

    function fechar() {
        div.style.animation = 'diceOut 0.3s ease-out forwards';
        setTimeout(() => div.remove(), 300);
        document.removeEventListener('click', fechar);
    }
    setTimeout(() => document.addEventListener('click', fechar), 120);
}

// ─────────────────────────────────────────
//  UTILITÁRIOS
// ─────────────────────────────────────────
function extrairLista(containerId) {
    return Array.from(document.getElementById(containerId).children).map(div => ({
        nome:      div.querySelector('input').value,
        descricao: div.querySelector('textarea').value,
        expandido: div.classList.contains('inv-expandido') ||
                   (div.querySelector('textarea')?.style.display === 'block')
    }));
}

function carregarListaItens(lista, fn, containerId) {
    lista?.forEach(item => {
        fn();
        const div = document.getElementById(containerId).lastElementChild;
        div.querySelector('input').value = item.nome;
        const txt = div.querySelector('textarea');
        txt.value = item.descricao;

        if (item.expandido) {
            txt.style.display = 'block';
            div.classList.add('inv-expandido');
            const btn = div.querySelector('.inv-expand-btn');
            if (btn) { btn.textContent = '▾'; btn.title = 'Recolher'; }
        } else {
            txt.style.display = 'none';
            div.classList.remove('inv-expandido');
            const btn = div.querySelector('.inv-expand-btn');
            if (btn) { btn.textContent = '▸'; btn.title = 'Expandir'; }
        }
    });
}

window.calcularValores = function() {
    const agi  = parseInt(document.getElementById('agilidade').value) || 0;
    const cor  = parseInt(document.getElementById('coragem').value) || 0;
    const defB = parseInt(document.getElementById('defesaBonus').value) || 0;
    const acB  = parseInt(document.getElementById('acoesBonus').value) || 0;
    const iniB = parseInt(document.getElementById('iniciativaBonus').value) || 0;

    document.getElementById('defesaTotal').textContent   = 5 + defB;
    document.getElementById('acoesTotal').textContent    = 1 + agi + acB;
    document.getElementById('iniciativaTotal').textContent = 1 + cor + iniB;

    if (modoDinamico) atualizarMediasVisuais();
};

window.atualizarHonra = function() {
    const input  = document.getElementById('honraValor');
    const marker = document.getElementById('honraMarker');
    if (!input || !marker) return;
    const val  = Math.max(-15, Math.min(15, parseInt(input.value) || 0));
    const bar  = marker.parentElement;
    const W    = bar.offsetWidth;
    const mW   = 40;
    const left = ((val + 15) / 30) * (W - mW);
    marker.style.left      = left + 'px';
    marker.style.transform = 'translateY(-50%)';
};

window.toggleDescricao = (btn) => {
    const itemBox = btn.closest('.inv-item');
    const txt = itemBox.querySelector('textarea');
    const isVisible = txt.style.display !== 'none' && txt.style.display !== '';
    if (isVisible) {
        txt.style.display = 'none';
        itemBox.classList.remove('inv-expandido');
        btn.textContent = '▸';
        btn.title = 'Expandir';
    } else {
        txt.style.display = 'block';
        itemBox.classList.add('inv-expandido');
        btn.textContent = '▾';
        btn.title = 'Recolher';
        txt.focus();
    }
    autoSalvar();
};

let timeoutSalvar = null;
function autoSalvar() {
    if (!document.getElementById('senha').value.trim()) return;
    clearTimeout(timeoutSalvar);
    mostrarStatusSalvamento('saving');
    timeoutSalvar = setTimeout(() => salvarFichaFirebase(), 1500);
}
window.triggerSalvar = autoSalvar;

// ─────────────────────────────────────────
//  DRAG-AND-DROP PARA REORDENAR INVENTÁRIO
// ─────────────────────────────────────────

// Estado do drag
let dragSrc = null;         // o elemento sendo arrastado
let dragContainer = null;   // o container pai
let dropIndicator = null;   // linha indicadora de posição

function criarDropIndicator() {
    const el = document.createElement('div');
    el.id = 'inv-drop-indicator';
    el.style.cssText = `
        height: 2px;
        background: #b8860b;
        box-shadow: 0 0 6px rgba(184,134,11,0.8);
        margin: 0;
        border-radius: 1px;
        pointer-events: none;
        display: none;
    `;
    return el;
}

function habilitarDragDrop(container) {
    // Usa MutationObserver para reconfigurar quando novos itens forem adicionados
    const observer = new MutationObserver(() => configurarDragItens(container));
    observer.observe(container, { childList: true });
    configurarDragItens(container);
}

function configurarDragItens(container) {
    Array.from(container.children).forEach(item => {
        if (item.dataset.dragConfigured) return;
        item.dataset.dragConfigured = 'true';

        // Torna o item arrastável
        item.setAttribute('draggable', 'true');

        // Handle visual (ícone de arrastar) — inserido no inv-row se ainda não existe
        const row = item.querySelector('.inv-row');
        if (row && !row.querySelector('.inv-drag-handle')) {
            const handle = document.createElement('span');
            handle.className = 'inv-drag-handle';
            handle.innerHTML = '⠿';
            handle.title = 'Arrastar para reordenar';
            handle.style.cssText = `
                flex-shrink: 0;
                width: 18px;
                color: #3d2f24;
                font-size: 1em;
                cursor: grab;
                display: flex;
                align-items: center;
                justify-content: center;
                user-select: none;
                transition: color 0.15s;
                padding: 0 2px;
                line-height: 1;
            `;
            handle.addEventListener('mouseenter', () => handle.style.color = '#8b6f47');
            handle.addEventListener('mouseleave', () => handle.style.color = dragSrc === item ? '#b8860b' : '#3d2f24');
            // Insere o handle como primeiro filho do inv-row
            row.insertBefore(handle, row.firstChild);
        }

        // Drag events
        item.addEventListener('dragstart', onDragStart);
        item.addEventListener('dragend',   onDragEnd);
        item.addEventListener('dragover',  onDragOver);
        item.addEventListener('dragleave', onDragLeave);
        item.addEventListener('drop',      onDrop);
    });
}

function onDragStart(e) {
    // Impede drag se clicar em elementos interativos (input, textarea, button)
    if (e.target.closest('input, textarea, button')) {
        e.preventDefault();
        return;
    }

    dragSrc = this;
    dragContainer = this.parentElement;

    // Estilo visual no item sendo arrastado
    setTimeout(() => {
        dragSrc.style.opacity = '0.4';
        dragSrc.style.outline = '1px dashed #b8860b';
    }, 0);

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // necessário para Firefox

    // Criar e inserir o indicador de drop se ainda não existir
    if (!dropIndicator) {
        dropIndicator = criarDropIndicator();
        document.body.appendChild(dropIndicator);
    }
}

function onDragEnd() {
    if (dragSrc) {
        dragSrc.style.opacity = '';
        dragSrc.style.outline = '';

        // Remove o handle de cor diferente
        const handle = dragSrc.querySelector('.inv-drag-handle');
        if (handle) handle.style.color = '#3d2f24';
    }

    // Esconde o indicador e limpa o estado
    if (dropIndicator) dropIndicator.style.display = 'none';

    // Remove highlight de todos os itens
    if (dragContainer) {
        Array.from(dragContainer.children).forEach(c => {
            c.style.background = '';
        });
    }

    dragSrc = null;
    dragContainer = null;
}

function onDragOver(e) {
    if (!dragSrc || this === dragSrc) return;
    if (this.parentElement !== dragContainer) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Determina se o cursor está na metade superior ou inferior do item
    const rect = this.getBoundingClientRect();
    const meio = rect.top + rect.height / 2;
    const depois = e.clientY > meio;

    // Posiciona o indicador de drop
    const containerRect = dragContainer.getBoundingClientRect();
    dropIndicator.style.display = 'block';
    dropIndicator.style.position = 'fixed';
    dropIndicator.style.left = containerRect.left + 'px';
    dropIndicator.style.width = containerRect.width + 'px';
    dropIndicator.style.zIndex = '9999';

    if (depois) {
        // Após o elemento alvo
        const bottom = rect.bottom;
        dropIndicator.style.top = (bottom - 1) + 'px';
        this.dataset.dropPosition = 'after';
    } else {
        // Antes do elemento alvo
        dropIndicator.style.top = (rect.top - 1) + 'px';
        this.dataset.dropPosition = 'before';
    }

    // Highlight sutil no alvo
    Array.from(dragContainer.children).forEach(c => c.style.background = '');
    this.style.background = 'rgba(184,134,11,0.06)';
}

function onDragLeave() {
    this.style.background = '';
    delete this.dataset.dropPosition;
}

function onDrop(e) {
    if (!dragSrc || this === dragSrc) return;
    if (this.parentElement !== dragContainer) return;

    e.preventDefault();
    e.stopPropagation();

    const position = this.dataset.dropPosition || 'before';

    if (position === 'before') {
        dragContainer.insertBefore(dragSrc, this);
    } else {
        // Inserir após 'this'
        const next = this.nextSibling;
        if (next) {
            dragContainer.insertBefore(dragSrc, next);
        } else {
            dragContainer.appendChild(dragSrc);
        }
    }

    this.style.background = '';
    delete this.dataset.dropPosition;

    // Salva imediatamente após reordenar
    mostrarStatusSalvamento('saving');
    salvarFichaFirebase().then(() => {
        mostrarStatusSalvamento('saved');
    }).catch((e) => {
        console.error("Erro ao salvar:", e);
        mostrarStatusSalvamento('error');
    });
}

// ─────────────────────────────────────────
//  LISTAS
// ─────────────────────────────────────────
window.adicionarHabilidade = function() {
    const div = document.createElement('div');
    div.className = 'item-box';
    div.innerHTML = `
        <input type="text" placeholder="Habilidade">
        <textarea placeholder="Descrição..."></textarea>
        <button class="btn btn-small btn-danger" onclick="this.parentElement.remove(); window.triggerSalvar()">Remover</button>`;
    document.getElementById('habilidadesContainer').appendChild(div);
};

// ── INVENTÁRIO COMPACTO ───────────────────────────────────
function adicionarEstruturaItem(container, placeholder) {
    const div = document.createElement('div');
    div.className = 'inv-item';

    div.innerHTML = `
        <div class="inv-row">
            <button class="inv-expand-btn" onclick="window.toggleDescricao(this)" title="Expandir">▸</button>
            <input type="text" class="inv-nome" placeholder="${placeholder}">
            <button class="inv-del-btn" onclick="this.closest('.inv-item').remove(); window.triggerSalvar()" title="Remover">✕</button>
        </div>
        <textarea class="inv-desc" placeholder="Detalhes e propriedades..." style="display:none;"></textarea>
    `;

    container.appendChild(div);
    setTimeout(() => div.querySelector('.inv-nome').focus(), 50);
}

window.adicionarItem = () => adicionarEstruturaItem(document.getElementById('inventarioContainer'), "Nome do item...");
window.adicionarItemMontaria = () => adicionarEstruturaItem(document.getElementById('inventarioMontariaContainer'), "Equipamento...");

// ─────────────────────────────────────────
//  OUTRAS FUNÇÕES
// ─────────────────────────────────────────
window.novaFicha = () => {
    if (confirm('Isso apagará os dados locais e criará uma nova ficha. Continuar?')) {
        localStorage.removeItem('idFichaAtual');
        location.reload();
    }
};

window.rolarDanoMontaria = function() {
    const dado   = Math.floor(Math.random() * 6) + 1;
    const pot    = parseInt(document.getElementById('montariaPotencia').value) || 0;
    const bonus  = parseInt(document.getElementById('montariaDanoBonus').value) || 0;
    const total  = dado + pot + bonus;
    mostrarResultadoDano(dado, pot + bonus, total);
    registrarRolagemNoFirebase("Dano da Montaria", dado, pot + bonus, total);
};

window.irParaBase = function() {
    salvarFichaFirebase();
    document.body.style.opacity = '0';
    setTimeout(() => { window.location.href = 'base.html'; }, 500);
};

// ─────────────────────────────────────────
//  CAMPO VALOR RECOMPENSA (R$ livre)
// ─────────────────────────────────────────
function configurarCampoRecompensa() {
    const el = document.getElementById('valorRecompensa');
    if (!el) return;

    const PREFIX = 'R$ ';

    el.addEventListener('focus', () => {
        if (!el.value.startsWith(PREFIX)) {
            const raw = el.value.replace(/^R\$\s*/, '').trim();
            el.value = PREFIX + raw;
        }
        setTimeout(() => {
            const pos = el.value.length;
            el.setSelectionRange(pos, pos);
        }, 0);
    });

    el.addEventListener('keydown', (e) => {
        const selStart = el.selectionStart;
        const selEnd   = el.selectionEnd;
        if (['Backspace', 'Delete'].includes(e.key)) {
            if (selStart <= PREFIX.length && selEnd <= PREFIX.length) {
                e.preventDefault();
                return;
            }
            if (selStart < PREFIX.length) {
                e.preventDefault();
                el.setSelectionRange(PREFIX.length, selEnd);
            }
        }
        if (e.key === 'Home' && !e.shiftKey) {
            e.preventDefault();
            el.setSelectionRange(PREFIX.length, PREFIX.length);
        }
    });

    el.addEventListener('input', () => {
        if (!el.value.startsWith(PREFIX)) {
            const clean = el.value.replace(/^R\$\s*/, '');
            el.value = PREFIX + clean;
        }
        if (el.selectionStart < PREFIX.length) {
            el.setSelectionRange(PREFIX.length, PREFIX.length);
        }
    });

    el.addEventListener('blur', () => {
        if (el.value.trim() === 'R$' || el.value.trim() === 'R$ ') {
            el.value = '';
        }
    });

    el.addEventListener('click', () => {
        if (el.selectionStart < PREFIX.length) {
            el.setSelectionRange(PREFIX.length, PREFIX.length);
        }
    });
}

// ─────────────────────────────────────────
//  INICIALIZAÇÃO
// ─────────────────────────────────────────
window.addEventListener('load', async () => {
    configurarPips();
    configurarCampoRecompensa();

    // Ativa drag-and-drop nos dois containers de inventário
    habilitarDragDrop(document.getElementById('inventarioContainer'));
    habilitarDragDrop(document.getElementById('inventarioMontariaContainer'));

    const idSalvo = localStorage.getItem('idFichaAtual');
    if (idSalvo) {
        const s = await getDoc(doc(db, "fichas", idSalvo));
        if (s.exists()) preencherCampos(s.data());
    }

    document.addEventListener('input',  e => {
        if (e.target.matches('input, textarea, select')) {
            if (modoDinamico) atualizarMediasVisuais();
            autoSalvar();
        }
    });
    document.addEventListener('change', e => {
        if (e.target.matches('input, textarea, select')) {
            if (modoDinamico) atualizarMediasVisuais();
            autoSalvar();
        }
    });

    calcularValores();
    atualizarHonra();
    setTimeout(atualizarHonra, 50);
});

// Exportações
window.salvarFicha = salvarFichaFirebase;

window.carregarFichaManual = async () => {
    const senha = document.getElementById('senha').value.trim().toUpperCase();
    if (!senha) { alert("Digite sua senha no campo 'Código de Acesso' para carregar."); return; }
    try {
        const q   = query(collection(db, "fichas"), where("senha", "==", senha));
        const snp = await getDocs(q);
        if (!snp.empty) {
            const data = snp.docs[0].data();
            preencherCampos(data);
            idFichaAtual = snp.docs[0].id;
            localStorage.setItem('idFichaAtual', idFichaAtual);
            alert(`Ficha de ${data.nome} carregada!`);
        } else {
            alert("Nenhuma ficha encontrada com esta senha.");
        }
    } catch (e) { console.error(e); alert("Erro ao acessar o banco de dados."); }
};