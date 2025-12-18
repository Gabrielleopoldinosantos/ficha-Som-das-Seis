import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// --- FUNÇÕES DE BANCO DE DADOS ---

async function salvarFichaFirebase() {
    const nomePersonagem = document.getElementById('nome').value.trim();
    if (!nomePersonagem) { alert("Nome necessário!"); return; }

    const ficha = {
        nome: nomePersonagem,
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
        combate: document.getElementById('combate').value,
        negocios: document.getElementById('negocios').value,
        montaria: document.getElementById('montaria').value,
        tradicao: document.getElementById('tradicao').value,
        labuta: document.getElementById('labuta').value,
        exploracao: document.getElementById('exploracao').value,
        roubo: document.getElementById('roubo').value,
        medicina: document.getElementById('medicina').value,
        tecnologia: document.getElementById('tecnologia').value,
        culinaria: document.getElementById('culinaria').value,
        domestico: document.getElementById('domestico').value,
        direcao: document.getElementById('direcao').value,
        montariaNome: document.getElementById('montariaNome').value,
        montariaPV: document.getElementById('montariaPV').value,
        montariaPVMax: document.getElementById('montariaPVMax').value,
        montariaDanoBonus: document.getElementById('montariaDanoBonus').value,
        montariaPotencia: document.getElementById('montariaPotencia').value,
        montariaResistencia: document.getElementById('montariaResistencia').value,
        habilidades: extrairLista('habilidadesContainer'),
        inventario: extrairLista('inventarioContainer'),
        inventarioMontaria: extrairLista('inventarioMontariaContainer')
    };

    try {
        await setDoc(doc(db, "fichas", nomePersonagem), ficha);
        localStorage.setItem('ultimoPersonagem', nomePersonagem);
        alert(`Ficha de "${nomePersonagem}" salva!`);
    } catch (e) { console.error("Erro ao salvar:", e); }
}

async function carregarFichaManual() {
    const nomeBusca = prompt("Digite o nome exato do personagem:");
    if (!nomeBusca) return;

    try {
        const docRef = doc(db, "fichas", nomeBusca);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            preencherCampos(docSnap.data());
            localStorage.setItem('ultimoPersonagem', nomeBusca);
        } else {
            alert("Personagem não encontrado.");
        }
    } catch (e) { console.error("Erro ao carregar:", e); }
}

// --- FUNÇÕES DE INTERFACE ---

function preencherCampos(ficha) {
    document.getElementById('habilidadesContainer').innerHTML = '';
    document.getElementById('inventarioContainer').innerHTML = '';
    document.getElementById('inventarioMontariaContainer').innerHTML = '';

    for (const key in ficha) {
        const element = document.getElementById(key);
        if (element && !['habilidades', 'inventario', 'inventarioMontaria', 'agua', 'comida'].includes(key)) {
            element.value = ficha[key];
        }
    }

    if (document.getElementById('agua')) document.getElementById('agua').checked = ficha.agua || false;
    if (document.getElementById('comida')) document.getElementById('comida').checked = ficha.comida || false;

    ficha.habilidades?.forEach(h => {
        window.adicionarHabilidade();
        const div = document.getElementById('habilidadesContainer').lastElementChild;
        div.querySelector('input').value = h.nome;
        div.querySelector('textarea').value = h.descricao;
    });

    carregarListaItens(ficha.inventario, window.adicionarItem, 'inventarioContainer');
    carregarListaItens(ficha.inventarioMontaria, window.adicionarItemMontaria, 'inventarioMontariaContainer');
    
    window.calcularValores();
    window.atualizarHonra();
}

function extrairLista(containerId) {
    return Array.from(document.getElementById(containerId).children).map(div => ({
        nome: div.querySelector('input').value,
        descricao: div.querySelector('textarea').value
    }));
}

function carregarListaItens(lista, funcAdicionar, containerId) {
    lista?.forEach(item => {
        funcAdicionar();
        const div = document.getElementById(containerId).lastElementChild;
        div.querySelector('input').value = item.nome;
        const txt = div.querySelector('textarea');
        txt.value = item.descricao;
        if (item.descricao) txt.style.display = 'block';
    });
}

// --- SISTEMA DE DADOS E CÁLCULOS ---

window.rolarDado = function(campoId) {
    const resultadoDado = Math.floor(Math.random() * 6) + 1;
    const campo = document.getElementById(campoId);
    const valorAtual = campo ? (parseInt(campo.value) || 0) : 0;
    mostrarResultadoDado(resultadoDado, valorAtual, valorAtual + resultadoDado);
};

function mostrarResultadoDado(resultadoDado, valorCampo, resultadoTotal) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'dice-result';
    
    let criticoLabel = '';
    
    if (resultadoDado === 6) {
        resultDiv.classList.add('critico-sucesso');
        criticoLabel = '<div class="critico-label">SUCESSO CRÍTICO!</div>';
    } else if (resultadoDado === 1) {
        resultDiv.classList.add('critico-falha');
        criticoLabel = '<div class="critico-label">ERRO CRÍTICO!</div>';
    }

    resultDiv.innerHTML = `
        <div class="dice-result-header">Bônus: ${valorCampo} + Dado: ${resultadoDado}</div>
        <div class="dice-result-total">${resultadoTotal}</div>
        ${criticoLabel}
    `;
    
    document.body.appendChild(resultDiv);
    
    // Força o navegador a processar o elemento antes da animação
    void resultDiv.offsetWidth; 

    setTimeout(() => {
        // Remove as classes de crítico antes de aplicar a animação de saída
        resultDiv.classList.remove('critico-sucesso', 'critico-falha');
        resultDiv.style.animation = 'diceOut 0.3s ease-out forwards';
        setTimeout(() => resultDiv.remove(), 300);
    }, 2000);
}

window.calcularValores = function() {
    const agilidade = parseInt(document.getElementById('agilidade').value) || 0;
    const coragem = parseInt(document.getElementById('coragem').value) || 0;
    const defB = parseInt(document.getElementById('defesaBonus').value) || 0;
    const acB = parseInt(document.getElementById('acoesBonus').value) || 0;
    const iniB = parseInt(document.getElementById('iniciativaBonus').value) || 0;

    document.getElementById('defesaTotal').textContent = 5 + defB;
    document.getElementById('acoesTotal').textContent = 1 + agilidade + acB;
    document.getElementById('iniciativaTotal').textContent = 1 + coragem + iniB;
};

window.atualizarHonra = function() {
    const val = Math.max(-15, Math.min(15, parseInt(document.getElementById('honraValor').value) || 0));
    document.getElementById('honraMarker').style.left = ((val + 15) / 30 * 100) + '%';
};

window.adicionarHabilidade = function() {
    const div = document.createElement('div');
    div.className = 'item-box';
    div.innerHTML = `<input type="text" placeholder="Habilidade"><textarea placeholder="Descrição..."></textarea><button class="btn btn-small btn-danger" onclick="this.parentElement.remove()">Remover</button>`;
    document.getElementById('habilidadesContainer').appendChild(div);
};

window.adicionarItem = function() {
    adicionarEstruturaItem(document.getElementById('inventarioContainer'), "Item");
};

window.adicionarItemMontaria = function() {
    adicionarEstruturaItem(document.getElementById('inventarioMontariaContainer'), "Equipamento");
};

function adicionarEstruturaItem(container, placeholder) {
    const div = document.createElement('div');
    div.className = 'item-box';
    div.innerHTML = `
        <div class="item-header">
            <input type="text" placeholder="${placeholder}">
            <button class="btn btn-small" onclick="window.toggleDescricao(this)">📝</button>
            <button class="btn btn-small btn-danger" onclick="this.parentElement.parentElement.remove()">🗑️</button>
        </div>
        <textarea placeholder="Descrição..." style="display: none;"></textarea>`;
    container.appendChild(div);
}

window.toggleDescricao = (btn) => {
    const txt = btn.parentElement.parentElement.querySelector('textarea');
    txt.style.display = (txt.style.display === 'none') ? 'block' : 'none';
};

window.rolarDanoMontaria = function() {
    const d = Math.floor(Math.random() * 6) + 1;
    const p = parseInt(document.getElementById('montariaPotencia').value) || 0;
    const b = parseInt(document.getElementById('montariaDanoBonus').value) || 0;
    mostrarResultadoDado(d, p + b, d + p + b);
};

window.novaFicha = () => confirm('Limpar tudo?') && (localStorage.removeItem('ultimoPersonagem'), location.reload());

// --- EXPORTAR PARA O WINDOW ---
window.salvarFicha = salvarFichaFirebase;
window.carregarFichaManual = carregarFichaManual;

// --- INICIALIZAÇÃO ---
window.addEventListener('load', () => {
    const ultimo = localStorage.getItem('ultimoPersonagem');
    if (ultimo) {
        const docRef = doc(db, "fichas", ultimo);
        getDoc(docRef).then(s => s.exists() && preencherCampos(s.data()));
    }
    window.calcularValores();
    window.atualizarHonra();
});