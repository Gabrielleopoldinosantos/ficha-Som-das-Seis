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

// --- CONTROLE DE ID ÚNICO ---
let idFichaAtual = localStorage.getItem('idFichaAtual') || null;

async function salvarFichaFirebase() {
    const nomePersonagem = document.getElementById('nome').value.trim();
    if (!nomePersonagem) return;

    // Se não tem ID, cria um fixo baseado no nome + timestamp (apenas na criação)
    if (!idFichaAtual) {
        idFichaAtual = nomePersonagem.replace(/\s+/g, '_') + "_" + Date.now();
        localStorage.setItem('idFichaAtual', idFichaAtual);
    }

    const ficha = {
        id: idFichaAtual, // ID fixo que nunca muda
        nome: nomePersonagem, // O nome pode mudar, o ID não
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
        inventarioMontaria: extrairLista('inventarioMontariaContainer'),
        ultimaAtualizacao: serverTimestamp()
    };

    try {
        // Salva sempre no documento com o ID único
        await setDoc(doc(db, "fichas", idFichaAtual), ficha);
        localStorage.setItem('ultimoIDSalvo', idFichaAtual); 
        console.log("Ficha sincronizada com sucesso!");
    } catch (e) { console.error("Erro ao salvar:", e); }
}

async function carregarFichaManual() {
    const nomeBusca = prompt("Digite o nome exato do personagem para buscar:");
    if (!nomeBusca) return;

    try {
        // Como o ID agora é aleatório, buscamos pelo campo 'nome'
        const q = query(collection(db, "fichas"), where("nome", "==", nomeBusca));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const fichaData = querySnapshot.docs[0].data();
            preencherCampos(fichaData);
            alert("Ficha carregada!");
        } else {
            alert("Personagem não encontrado.");
        }
    } catch (e) { console.error("Erro ao carregar:", e); }
}

// --- FUNÇÕES DE INTERFACE ---

function preencherCampos(ficha) {
    if (ficha.id) {
        idFichaAtual = ficha.id;
        localStorage.setItem('idFichaAtual', idFichaAtual);
    }

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

// --- SISTEMA DE DADOS ---

async function registrarRolagemNoFirebase(tipo, dado, bonus, total) {
    const player = document.getElementById('nome').value.trim() || "Pistoleiro Misterioso";
    try {
        await addDoc(collection(db, "rolagens"), {
            player: player,
            tipo: tipo,
            dado: dado,
            bonus: bonus,
            total: total,
            timestamp: serverTimestamp()
        });
    } catch (e) { console.error("Erro ao registrar rolagem:", e); }
}

window.rolarDado = function(campoId) {
    const resultadoDado = Math.floor(Math.random() * 6) + 1;
    const campo = document.getElementById(campoId);
    let valorBonus = campo ? (parseInt(campo.value) || 0) : 0;
    let nomeDoTeste = "";

    if (campoId === 'iniciativaBonus') {
        const coragem = parseInt(document.getElementById('coragem').value) || 0;
        valorBonus = valorBonus + coragem + 1; 
        nomeDoTeste = "Iniciativa";
    } else {
        const labelElement = campo.closest('.campo, .atributo-box')?.querySelector('label');
        nomeDoTeste = labelElement ? labelElement.textContent.trim() : campoId;
    }

    mostrarResultadoDado(resultadoDado, valorBonus, valorBonus + resultadoDado);
    registrarRolagemNoFirebase(nomeDoTeste, resultadoDado, valorBonus, valorBonus + resultadoDado);
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
    setTimeout(() => {
        resultDiv.style.animation = 'diceOut 0.3s ease-out forwards';
        setTimeout(() => resultDiv.remove(), 300);
    }, 2000);
}

// --- CÁLCULOS E UI ---

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

window.novaFicha = () => {
    if(confirm('Isso apagará os dados locais e criará uma nova ficha. Continuar?')) {
        localStorage.removeItem('idFichaAtual');
        localStorage.removeItem('ultimoIDSalvo');
        location.reload();
    }
};

// --- AUTO-SALVAMENTO ---
let timeoutSalvar = null;
function autoSalvar() {
    clearTimeout(timeoutSalvar);
    timeoutSalvar = setTimeout(() => {
        salvarFichaFirebase();
    }, 1500); 
}

// --- INICIALIZAÇÃO E EVENTOS ---
window.addEventListener('load', async () => {
    // Carrega a última ficha usada neste navegador
    const idSalvo = localStorage.getItem('idFichaAtual');
    if (idSalvo) {
        const docRef = doc(db, "fichas", idSalvo);
        const s = await getDoc(docRef);
        if (s.exists()) preencherCampos(s.data());
    }

    // Ativa escuta para auto-salvar
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', autoSalvar);
        input.addEventListener('change', autoSalvar);
    });

    window.calcularValores();
    window.atualizarHonra();
});

// Exportação de funções para botões HTML
window.salvarFicha = salvarFichaFirebase;
window.carregarFichaManual = carregarFichaManual;
window.adicionarHabilidade = function() {
    const div = document.createElement('div');
    div.className = 'item-box';
    div.innerHTML = `<input type="text" placeholder="Habilidade"><textarea placeholder="Descrição..."></textarea><button class="btn btn-small btn-danger" onclick="this.parentElement.remove()">Remover</button>`;
    document.getElementById('habilidadesContainer').appendChild(div);
};
window.adicionarItem = () => adicionarEstruturaItem(document.getElementById('inventarioContainer'), "Item");
window.adicionarItemMontaria = () => adicionarEstruturaItem(document.getElementById('inventarioMontariaContainer'), "Equipamento");

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