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

// --- LÓGICA DOS QUADRADINHOS (PIPS) ---
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
                // REMOVIDO: autoSalvar(); <-- Não salva mais ao clicar nos pips
            });
        });
    });
}

function atualizarPipsVisual(container, valor) {
    const pips = container.querySelectorAll('.pip');
    pips.forEach(p => {
        const pVal = parseInt(p.getAttribute('data-value'));
        p.classList.toggle('filled', pVal <= valor);
    });
}

// --- SALVAMENTO ---
// No seu script.js, substitua a função salvarFichaFirebase por esta versão atualizada:

async function salvarFichaFirebase() {
    const nomePersonagem = document.getElementById('nome').value.trim();
    const senha = document.getElementById('senha').value.trim().toUpperCase();

    if (!nomePersonagem || !senha) {
        alert("Para salvar manualmente, preencha o Nome e a Senha.");
        return;
    }

    // Define o ID da ficha baseado no nome (se ainda não existir)
    if (!idFichaAtual) {
        idFichaAtual = nomePersonagem.replace(/\s+/g, '_').toUpperCase();
        localStorage.setItem('idFichaAtual', idFichaAtual);
    }

    const ficha = {
        id: idFichaAtual,
        nome: nomePersonagem,
        senha: senha,
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
        
        // Antecedentes (Salvando agora apenas aqui)
        combateMod: document.getElementById('combateMod').value,
        combate: document.getElementById('combate').value, // O valor oculto dos pips
        negociosMod: document.getElementById('negociosMod').value,
        negocios: document.getElementById('negocios').value,
        montariaMod: document.getElementById('montariaMod').value,
        montaria: document.getElementById('montaria').value,
        tradicaoMod: document.getElementById('tradicaoMod').value,
        tradicao: document.getElementById('tradicao').value,
        labutaMod: document.getElementById('labutaMod').value,
        labuta: document.getElementById('labuta').value,
        exploracaoMod: document.getElementById('exploracaoMod').value,
        exploracao: document.getElementById('exploracao').value,
        rouboMod: document.getElementById('rouboMod').value,
        roubo: document.getElementById('roubo').value,
        medicinaMod: document.getElementById('medicinaMod').value,
        medicina: document.getElementById('medicina').value,
        tecnologiaMod: document.getElementById('tecnologiaMod').value,
        tecnologia: document.getElementById('tecnologia').value,
        culinariaMod: document.getElementById('culinariaMod').value,
        culinaria: document.getElementById('culinaria').value,
        domesticoMod: document.getElementById('domesticoMod').value,
        domestico: document.getElementById('domestico').value,
        direcaoMod: document.getElementById('direcaoMod').value,
        direcao: document.getElementById('direcao').value,

        // Montaria e Listas
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
        await setDoc(doc(db, "fichas", idFichaAtual), ficha);
        console.log("Ficha Completa Salva com Sucesso!");
        
        // Feedback visual rápido no botão se não for auto-save
        const btnSalvar = document.querySelector('button[onclick="salvarFicha()"]');
        if(btnSalvar) {
            const originalText = btnSalvar.innerText;
            btnSalvar.innerText = "✅ Salvo!";
            setTimeout(() => btnSalvar.innerText = originalText, 2000);
        }
    } catch (e) { 
        console.error("Erro ao salvar:", e); 
        alert("Erro ao salvar no banco de dados.");
    }
}

// --- CARREGAMENTO ---
function preencherCampos(ficha) {
    if (ficha.id) {
        idFichaAtual = ficha.id;
        localStorage.setItem('idFichaAtual', idFichaAtual);
    }

    // Campos de texto e número
    for (const key in ficha) {
        const element = document.getElementById(key);
        if (element && typeof ficha[key] !== 'object') {
            if (element.type === 'checkbox') {
                element.checked = ficha[key];
            } else {
                element.value = ficha[key];
            }
        }
    }

    // Atualiza visualmente os Pips
    document.querySelectorAll('.pips-container').forEach(container => {
        const id = container.getAttribute('data-ant');
        const valor = ficha[id] || 0;
        atualizarPipsVisual(container, valor);
    });

    // Listas
    document.getElementById('habilidadesContainer').innerHTML = '';
    ficha.habilidades?.forEach(h => {
        window.adicionarHabilidade();
        const div = document.getElementById('habilidadesContainer').lastElementChild;
        div.querySelector('input').value = h.nome;
        div.querySelector('textarea').value = h.descricao;
    });

    document.getElementById('inventarioContainer').innerHTML = '';
    carregarListaItens(ficha.inventario, window.adicionarItem, 'inventarioContainer');

    document.getElementById('inventarioMontariaContainer').innerHTML = '';
    carregarListaItens(ficha.inventarioMontaria, window.adicionarItemMontaria, 'inventarioMontariaContainer');
    
    window.calcularValores();
    window.atualizarHonra();
}

// --- SISTEMA DE DADOS ---
async function registrarRolagemNoFirebase(tipo, dado, bonus, total) {
    const player = document.getElementById('nome').value.trim() || "Pistoleiro Misterioso";
    try {
        await addDoc(collection(db, "rolagens"), {
            player: player, tipo, dado, bonus, total, timestamp: serverTimestamp()
        });
    } catch (e) { console.error("Erro rolagem:", e); }
}

window.rolarDado = function(campoId) {
    const resultadoDado = Math.floor(Math.random() * 6) + 1;
    const campo = document.getElementById(campoId);
    
    // Pips (Valor fixo do antecedente)
    let valorAntecedente = campo ? (parseInt(campo.value) || 0) : 0;
    
    // Modificador (Input de bônus/ônus temporário)
    const modInput = document.getElementById(campoId + 'Mod');
    let valorModificador = modInput ? (parseInt(modInput.value) || 0) : 0;
    
    // Soma tudo
    let valorBonusTotal = valorAntecedente + valorModificador;
    let nomeDoTeste = "";

    const labelElement = campo.closest('.campo-antecedente, .campo, .atributo-box')?.querySelector('label');
    nomeDoTeste = labelElement ? labelElement.textContent.trim() : campoId;

    const resultadoFinal = resultadoDado + valorBonusTotal;

    mostrarResultadoDado(resultadoDado, valorBonusTotal, resultadoFinal);
    registrarRolagemNoFirebase(nomeDoTeste, resultadoDado, valorBonusTotal, resultadoFinal);
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

// --- UTILITÁRIOS ---
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

window.toggleDescricao = (btn) => {
    const txt = btn.parentElement.parentElement.querySelector('textarea');
    txt.style.display = (txt.style.display === 'none') ? 'block' : 'none';
};

let timeoutSalvar = null;
function autoSalvar() {
    const senha = document.getElementById('senha').value.trim();
    if (!senha) return; // Não salva se não tiver senha definida

    clearTimeout(timeoutSalvar);
    timeoutSalvar = setTimeout(() => salvarFichaFirebase(), 1500); 
}

// --- BOTÕES E INICIALIZAÇÃO ---
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

window.novaFicha = () => {
    if(confirm('Isso apagará os dados locais e criará uma nova ficha. Continuar?')) {
        localStorage.removeItem('idFichaAtual');
        location.reload();
    }
};

window.addEventListener('load', async () => {
    configurarPips();

    const idSalvo = localStorage.getItem('idFichaAtual');
    if (idSalvo) {
        const docRef = doc(db, "fichas", idSalvo);
        const s = await getDoc(docRef);
        if (s.exists()) preencherCampos(s.data());
    }

    // Modificado para ignorar o campo 'senha'
    document.querySelectorAll('input, textarea, select').forEach(input => {
        if (input.id !== 'senha') { // Pula o campo de senha
            input.addEventListener('input', autoSalvar);
            input.addEventListener('change', autoSalvar);
        }
    });

    window.calcularValores();
    window.atualizarHonra();
});

// Exportações para o HTML
window.salvarFicha = salvarFichaFirebase;
// --- CARREGAMENTO APENAS PELA SENHA ---
window.carregarFichaManual = async () => {
    const senhaDigitada = document.getElementById('senha').value.trim().toUpperCase();

    if (!senhaDigitada) {
        alert("Digite sua senha no campo 'Código de Acesso' para carregar.");
        return;
    }

    try {
        // Busca na coleção "fichas" onde o campo "senha" é igual à senha digitada
        const fichasRef = collection(db, "fichas");
        const q = query(fichasRef, where("senha", "==", senhaDigitada));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Pega o primeiro documento encontrado com essa senha
            const dadosFicha = querySnapshot.docs[0].data();
            preencherCampos(dadosFicha);
            
            // Atualiza o ID atual no localStorage para manter a sessão
            idFichaAtual = querySnapshot.docs[0].id;
            localStorage.setItem('idFichaAtual', idFichaAtual);
            
            alert(`Ficha de ${dadosFicha.nome} carregada!`);
        } else {
            alert("Nenhuma ficha encontrada com esta senha.");
        }
    } catch (e) {
        console.error("Erro ao carregar:", e);
        alert("Erro ao acessar o banco de dados.");
    }
};
window.rolarDanoMontaria = function() {
    const resultadoDado = Math.floor(Math.random() * 6) + 1;
    const potencia = parseInt(document.getElementById('montariaPotencia').value) || 0;
    const bonus = parseInt(document.getElementById('montariaDanoBonus').value) || 0;
    const total = resultadoDado + potencia + bonus;
    
    mostrarResultadoDado(resultadoDado, (potencia + bonus), total);
    registrarRolagemNoFirebase("Dano da Montaria", resultadoDado, (potencia + bonus), total);
};

window.irParaBase = function() {
    // Salva a ficha do jogador antes de sair para garantir que nada se perca
    salvarFichaFirebase(); 
    
    document.body.style.opacity = '0';
    setTimeout(() => {
        window.location.href = 'base.html';
    }, 500);
};