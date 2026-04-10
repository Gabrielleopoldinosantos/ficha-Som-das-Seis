// ═══════════════════════════════════════════════════════════════
//  script.js — O Som das Seis · Auth por email/senha real
//  · Firebase Auth com email + senha reais
//  · Múltiplas fichas por conta (coleção fichas/{fichaId})
//  · Seletor de fichas após login
// ═══════════════════════════════════════════════════════════════

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    serverTimestamp,
    getDocs,
    query,
    where,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ─────────────────────────────────────────
//  FIREBASE INIT
// ─────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyCp5slzZKVuMQ5N86zv2vXbvMGEeNwem94",
    authDomain: "sds-ficha.firebaseapp.com",
    projectId: "sds-ficha",
    storageBucket: "sds-ficha.firebasestorage.app",
    messagingSenderId: "406558124782",
    appId: "1:406558124782:web:e1f68e6693a57dde7ea1ff",
    measurementId: "G-79SRX1P4D7"
};

const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ─────────────────────────────────────────
//  ESTADO GLOBAL
// ─────────────────────────────────────────
let usuarioAtual  = null;   // Firebase User object
let fichaAtualId  = null;   // ID do documento da ficha aberta
let modoDinamico  = false;

// ─────────────────────────────────────────
//  AUTH OBSERVER
// ─────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
    usuarioAtual = user;
    if (user) {
        atualizarInfoUsuario(user);
        mostrarTela("seletor");
        await carregarSeletorFichas();
    } else {
        mostrarTela("login");
    }
});

// ─────────────────────────────────────────
//  CONTROLE DE TELAS
//  "login" | "seletor" | "ficha"
// ─────────────────────────────────────────
function mostrarTela(tela) {
    const ids = ["telaLogin", "telaSeletor", "telaFicha"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = "none";
        el.style.opacity = "0";
    });

    const alvo = document.getElementById(
        tela === "login"   ? "telaLogin"   :
        tela === "seletor" ? "telaSeletor" : "telaFicha"
    );
    if (!alvo) return;
    alvo.style.display = "block";
    setTimeout(() => alvo.style.opacity = "1", 30);

    const authBar = document.getElementById("authBar");
    if (authBar) authBar.style.display = tela !== "login" ? "flex" : "none";
}

function atualizarInfoUsuario(user) {
    const el = document.getElementById("authUserInfo");
    if (el) el.textContent = `✓ ${user.email}`;
}

// ─────────────────────────────────────────
//  LOGIN / CADASTRO
// ─────────────────────────────────────────
window.fazerLogin = async function() {
    const emailEl = document.getElementById("loginEmail");
    const senhaEl = document.getElementById("loginSenha");
    const email   = emailEl?.value?.trim();
    const senha   = senhaEl?.value;

    if (!email || !senha) { mostrarErroLogin("Preencha email e senha."); return; }

    setLoginLoading(true);
    mostrarErroLogin("", true);

    try {
        await signInWithEmailAndPassword(auth, email, senha);
        // onAuthStateChanged cuida do resto
    } catch (err) {
        setLoginLoading(false);
        mostrarErroLogin(traduzirErroAuth(err.code));
    }
};

window.fazerCadastro = async function() {
    const emailEl = document.getElementById("loginEmail");
    const senhaEl = document.getElementById("loginSenha");
    const email   = emailEl?.value?.trim();
    const senha   = senhaEl?.value;

    if (!email || !senha) { mostrarErroLogin("Preencha email e senha."); return; }
    if (senha.length < 6) { mostrarErroLogin("Senha precisa ter no mínimo 6 caracteres."); return; }

    setLoginLoading(true);
    mostrarErroLogin("", true);

    try {
        await createUserWithEmailAndPassword(auth, email, senha);
        // onAuthStateChanged cuida do resto
    } catch (err) {
        setLoginLoading(false);
        mostrarErroLogin(traduzirErroAuth(err.code));
    }
};

window.recuperarSenha = async function() {
    const email = document.getElementById("loginEmail")?.value?.trim();
    if (!email) { mostrarErroLogin("Digite seu email para recuperar a senha."); return; }
    try {
        await sendPasswordResetEmail(auth, email);
        mostrarErroLogin("Email de recuperação enviado! Verifique sua caixa de entrada.", true);
        const el = document.getElementById("loginErro");
        if (el) {
            el.style.display = "block";
            el.style.color = "#7abf7a";
            el.style.borderColor = "#3a6a3a";
            el.style.background = "rgba(30,60,30,0.2)";
            el.textContent = "Email de recuperação enviado!";
        }
    } catch (err) {
        mostrarErroLogin(traduzirErroAuth(err.code));
    }
};

window.fazerLogout = async function() {
    if (!confirm("Sair da conta?")) return;
    fichaAtualId = null;
    await signOut(auth);
};

function traduzirErroAuth(code) {
    const erros = {
        "auth/user-not-found":        "Email não encontrado. Crie uma conta primeiro.",
        "auth/wrong-password":        "Senha incorreta.",
        "auth/invalid-credential":    "Email ou senha incorretos.",
        "auth/email-already-in-use":  "Este email já está cadastrado. Faça login.",
        "auth/weak-password":         "Senha muito curta (mínimo 6 caracteres).",
        "auth/invalid-email":         "Formato de email inválido.",
        "auth/too-many-requests":     "Muitas tentativas. Aguarde alguns minutos.",
        "auth/network-request-failed":"Sem conexão. Verifique sua internet.",
    };
    return erros[code] || `Erro: ${code}`;
}

function mostrarErroLogin(msg, limpar = false) {
    const el = document.getElementById("loginErro");
    if (!el) return;
    if (limpar && !msg) { el.textContent = ""; el.style.display = "none"; return; }
    // Reset para cor de erro
    el.style.color = "#bf7a7a";
    el.style.borderColor = "#6a3a3a";
    el.style.background = "rgba(100,30,30,0.2)";
    el.textContent = msg;
    el.style.display = "block";
}

function setLoginLoading(loading) {
    const btn = document.getElementById("btnLogin");
    const btn2 = document.getElementById("btnCadastro");
    if (btn)  btn.disabled  = loading;
    if (btn2) btn2.disabled = loading;
    if (btn)  btn.textContent  = loading ? "AGUARDE..." : "ENTRAR";
    if (btn2) btn2.textContent = loading ? "AGUARDE..." : "CRIAR CONTA";
}

// ─────────────────────────────────────────
//  SELETOR DE FICHAS
// ─────────────────────────────────────────
async function carregarSeletorFichas() {
    const lista = document.getElementById("listaSeletor");
    if (!lista) return;
    lista.innerHTML = `<div style="color:#5a4a3a;font-style:italic;text-align:center;padding:20px;">Carregando fichas...</div>`;

    try {
        const q    = query(collection(db, "fichas"), where("uid", "==", usuarioAtual.uid));
        const snap = await getDocs(q);

        if (snap.empty) {
            lista.innerHTML = `<div style="color:#5a4a3a;font-style:italic;text-align:center;padding:20px;">Nenhuma ficha ainda. Crie a primeira!</div>`;
            return;
        }

        lista.innerHTML = "";
        snap.docs
            .sort((a, b) => {
                const ta = a.data().ultimaAtualizacao?.seconds || 0;
                const tb = b.data().ultimaAtualizacao?.seconds || 0;
                return tb - ta;
            })
            .forEach(docSnap => {
                const f   = docSnap.data();
                const id  = docSnap.id;
                const pct = f.vidaMax > 0 ? Math.min(100, (f.vida / f.vidaMax) * 100) : 0;
                const ts  = f.ultimaAtualizacao?.seconds
                    ? new Date(f.ultimaAtualizacao.seconds * 1000).toLocaleDateString("pt-BR")
                    : "—";

                const card = document.createElement("div");
                card.className = "seletor-card";
                card.innerHTML = `
                    <div class="seletor-card-av">
                        ${f.avatarUrl
                            ? `<img src="${f.avatarUrl}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" style="width:100%;height:100%;object-fit:cover;display:block;"><div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:1.4em;">🤠</div>`
                            : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:1.4em;">🤠</div>`
                        }
                    </div>
                    <div class="seletor-card-info">
                        <div class="seletor-card-nome">${f.nome || "Sem nome"}</div>
                        <div class="seletor-card-sub">Nv ${f.nivel || 1} · PV ${f.vida || 0}/${f.vidaMax || 0} · ${ts}</div>
                        <div class="seletor-pv-bar"><div class="seletor-pv-fill" style="width:${pct}%"></div></div>
                        ${f.tormento ? `<div class="seletor-card-torm">"${f.tormento.substring(0,50)}${f.tormento.length > 50 ? '…' : ''}"</div>` : ""}
                    </div>
                    <div class="seletor-card-btns">
                        <button class="seletor-btn-abrir" onclick="window.abrirFicha('${id}')">ABRIR</button>
                        <button class="seletor-btn-del" onclick="window.deletarFicha('${id}', '${(f.nome || 'esta ficha').replace(/'/g, '\\\'')}')" title="Deletar ficha">🗑</button>
                    </div>
                `;
                lista.appendChild(card);
            });
    } catch (e) {
        console.error(e);
        lista.innerHTML = `<div style="color:#bf7a7a;text-align:center;padding:20px;">Erro ao carregar fichas.</div>`;
    }
}

window.abrirFicha = async function(id) {
    fichaAtualId = id;
    const snap = await getDoc(doc(db, "fichas", id));
    if (snap.exists()) preencherCampos(snap.data());
    mostrarTela("ficha");
};

window.criarNovaFicha = async function() {
    if (!usuarioAtual) return;
    // Cria documento novo na coleção fichas com uid do usuário
    const novaRef = doc(collection(db, "fichas"));
    const ficha = {
        uid: usuarioAtual.uid,
        nome: "",
        nivel: 1, dinheiro: 0,
        vida: 10, vidaMax: 10,
        fisico: 0, agilidade: 0, intelecto: 0, coragem: 0,
        tormento: "", agua: false, comida: false,
        defesaBonus: 0, acoesBonus: 0, iniciativaBonus: 0,
        honraValor: 0, recompensas: "", valorRecompensa: "",
        modoDinamico: false, avatarUrl: "", diarioSessao: "",
        combate:0, combateMod:0, negocios:0, negociosMod:0,
        montaria:0, montariaMod:0, tradicao:0, tradicaoMod:0,
        labuta:0, labutaMod:0, exploracao:0, exploracaoMod:0,
        roubo:0, rouboMod:0, medicina:0, medicinaMod:0,
        tecnologia:0, tecnologiaMod:0, culinaria:0, culinariaMod:0,
        domestico:0, domesticoMod:0, direcao:0, direcaoMod:0,
        montariaNome:"", montariaPV:5, montariaPVMax:5,
        montariaDanoBonus:0, montariaPotencia:0, montariaResistencia:0,
        ataques:[], habilidades:[], inventario:[], inventarioMontaria:[],
        ultimaAtualizacao: serverTimestamp()
    };
    await setDoc(novaRef, ficha);
    fichaAtualId = novaRef.id;
    // Limpa os campos e abre a tela de ficha vazia
    limparCamposFicha();
    mostrarTela("ficha");
};

window.voltarParaSeletor = async function() {
    // Salva antes de voltar se houver ficha aberta
    if (fichaAtualId) await salvarFichaFirebase();
    fichaAtualId = null;
    modoDinamico = false;
    document.body.classList.remove("combate-dinamico");
    await carregarSeletorFichas();
    mostrarTela("seletor");
};

window.deletarFicha = async function(id, nome) {
    if (!confirm(`Deletar a ficha de "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
        await deleteDoc(doc(db, "fichas", id));
        await carregarSeletorFichas();
    } catch (e) {
        console.error(e);
        alert("Erro ao deletar ficha.");
    }
};

function limparCamposFicha() {
    const campos = [
        "nome","nivel","dinheiro","fisico","agilidade","intelecto","coragem",
        "tormento","vida","vidaMax","defesaBonus","acoesBonus","iniciativaBonus",
        "recompensas","valorRecompensa","honraValor","diarioSessao",
        "combate","combateMod","negocios","negociosMod","montaria","montariaMod",
        "tradicao","tradicaoMod","labuta","labutaMod","exploracao","exploracaoMod",
        "roubo","rouboMod","medicina","medicinaMod","tecnologia","tecnologiaMod",
        "culinaria","culinariaMod","domestico","domesticoMod","direcao","direcaoMod",
        "montariaNome","montariaPV","montariaPVMax","montariaDanoBonus",
        "montariaPotencia","montariaResistencia","avatarUrl"
    ];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === "checkbox") el.checked = false;
        else el.value = ["vida","vidaMax"].includes(id) ? "10" :
                        ["nivel"].includes(id) ? "1" :
                        ["montariaPV","montariaPVMax"].includes(id) ? "5" : "0";
    });
    // Limpa listas
    ["ataquesContainer","habilidadesContainer","inventarioContainer","inventarioMontariaContainer"]
        .forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ""; });
    // Limpa pips
    document.querySelectorAll(".pips-container").forEach(c => atualizarPipsVisual(c, 0));
    document.querySelectorAll(".pip").forEach(p => p.classList.remove("filled"));
    atualizarAvatar("");
    calcularValores();
    atualizarHonra();
}

// ─────────────────────────────────────────
//  INDICADOR DE SALVAMENTO
// ─────────────────────────────────────────
function mostrarStatusSalvamento(status) {
    const indicator = document.getElementById("saveIndicator");
    if (!indicator) return;
    indicator.className = "save-indicator " + status;
    if (status === "saving") {
        indicator.innerHTML = '<span class="save-dot"></span> SALVANDO...';
    } else if (status === "saved") {
        indicator.innerHTML = '<span class="save-check">✓</span> SALVO';
        setTimeout(() => { indicator.className = "save-indicator idle"; indicator.innerHTML = ""; }, 3000);
    } else if (status === "error") {
        indicator.innerHTML = '<span class="save-x">✗</span> ERRO AO SALVAR';
    }
}

// ─────────────────────────────────────────
//  AVATAR
// ─────────────────────────────────────────
window.abrirInputAvatar = function() {
    const url = prompt("Cole aqui a URL da imagem do seu personagem:", document.getElementById("avatarUrl")?.value || "");
    if (url !== null) {
        const input = document.getElementById("avatarUrl");
        if (input) input.value = url;
        atualizarAvatar(url);
        autoSalvar();
    }
};

function atualizarAvatar(url) {
    const img         = document.getElementById("avatarImg");
    const placeholder = document.getElementById("avatarPlaceholder");
    if (!img) return;
    if (url && url.trim()) {
        img.src = url.trim();
        img.classList.remove("sem-foto");
        if (placeholder) placeholder.style.display = "none";
    } else {
        img.src = "";
        img.classList.add("sem-foto");
        if (placeholder) placeholder.style.display = "flex";
    }
}

// ─────────────────────────────────────────
//  COMBATE DINÂMICO
// ─────────────────────────────────────────
function danoParaMedia(opcao) {
    const tabela = { "0": 0, "1d3": 1, "1d6": 3, "2d6": 6, "3d6": 9, "4d6": 12, "5d6": 15, "6d6": 18 };
    return tabela[opcao] ?? 0;
}

function calcularMedia(campoId) {
    const pontos = parseInt(document.getElementById(campoId)?.value) || 0;
    const modEl  = document.getElementById(campoId + "Mod");
    const mod    = modEl ? (parseInt(modEl.value) || 0) : 0;
    return 3 + pontos + mod;
}

function atualizarMediasVisuais() {
    ["fisico","agilidade","intelecto","coragem"].forEach(id => {
        const el = document.getElementById("media" + id.charAt(0).toUpperCase() + id.slice(1));
        if (el) el.textContent = calcularMedia(id);
    });
    ["combate","negocios","montaria","tradicao","labuta","exploracao",
     "roubo","medicina","tecnologia","culinaria","domestico","direcao"].forEach(id => {
        const el = document.getElementById("media_" + id);
        if (el) el.textContent = calcularMedia(id);
    });
    const agi   = parseInt(document.getElementById("agilidade")?.value) || 0;
    const cor   = parseInt(document.getElementById("coragem")?.value) || 0;
    const elIni = document.getElementById("iniciativaDinamica");
    if (elIni) elIni.textContent = agi + cor;

    document.querySelectorAll(".ataque-box").forEach(box => {
        const bonusAtkEl  = box.querySelector(".atk-bonus");
        const danoSel     = box.querySelector(".ataque-dano-select");
        const bonusDanoEl = box.querySelector(".atk-dano-bonus");
        const mediaAtkEl  = box.querySelector(".atk-media-atk");
        const mediaDanoEl = box.querySelector(".atk-media-dano");
        if (!mediaAtkEl || !mediaDanoEl) return;
        mediaAtkEl.textContent = " " + (calcularMedia("combate") + (parseInt(bonusAtkEl?.value) || 0));
        mediaDanoEl.textContent = danoParaMedia(danoSel?.value || "0") + (parseInt(bonusDanoEl?.value) || 0);
    });
}

window.toggleCombateDinamico = function() {
    modoDinamico = !modoDinamico;
    document.body.classList.toggle("combate-dinamico", modoDinamico);
    const btn = document.getElementById("btnCombateDinamico");
    if (btn) btn.textContent = modoDinamico ? "COMBATE NORMAL" : "COMBATE DINÂMICO";
    if (modoDinamico) atualizarMediasVisuais();
    autoSalvar();
};

// ─────────────────────────────────────────
//  PIPS
// ─────────────────────────────────────────
function configurarPips() {
    document.querySelectorAll(".pips-container").forEach(container => {
        const idAlvo = container.getAttribute("data-ant");
        const hidden = document.getElementById(idAlvo);
        container.querySelectorAll(".pip").forEach(pip => {
            pip.addEventListener("click", () => {
                const val = parseInt(pip.getAttribute("data-value"));
                const novoValor = (hidden.value == val) ? 0 : val;
                hidden.value = novoValor;
                atualizarPipsVisual(container, novoValor);
                if (modoDinamico) atualizarMediasVisuais();
                autoSalvar();
            });
        });
    });
}

function atualizarPipsVisual(container, valor) {
    container.querySelectorAll(".pip").forEach(p => {
        p.classList.toggle("filled", parseInt(p.getAttribute("data-value")) <= valor);
    });
}

// ─────────────────────────────────────────
//  ATAQUES
// ─────────────────────────────────────────
function criarEstruturaAtaque(nome = "", bonusAtk = 0, dano = "0", bonusDano = 0) {
    const div = document.createElement("div");
    div.className = "ataque-box";
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
            <option value="0"   ${dano==="0"   ?"selected":""}>0</option>
            <option value="1d3" ${dano==="1d3" ?"selected":""}>1d3</option>
            <option value="1d6" ${dano==="1d6" ?"selected":""}>1d6</option>
            <option value="2d6" ${dano==="2d6" ?"selected":""}>2d6</option>
            <option value="3d6" ${dano==="3d6" ?"selected":""}>3d6</option>
            <option value="4d6" ${dano==="4d6" ?"selected":""}>4d6</option>
            <option value="5d6" ${dano==="5d6" ?"selected":""}>5d6</option>
            <option value="6d6" ${dano==="6d6" ?"selected":""}>6d6</option>
          </select>
          <div class="ataque-controls">
            <input type="number" class="atk-dano-bonus" value="${bonusDano}" title="Bônus/ônus no dano">
            <button class="atk-btn-rolar-dano" onclick="window.rolarDanoAtaque(this)">🎲 DANO</button>
          </div>
          <span class="atk-media-dano">—</span>
        </div>
      </div>`;
    div.addEventListener("input",  () => { if (modoDinamico) atualizarMediasVisuais(); window.triggerSalvar(); });
    div.addEventListener("change", () => { if (modoDinamico) atualizarMediasVisuais(); window.triggerSalvar(); });
    return div;
}

window.adicionarAtaque = function() {
    document.getElementById("ataquesContainer").appendChild(criarEstruturaAtaque());
};

window.rolarAtaque = function(btn) {
    const box = btn.closest(".ataque-box");
    const bonusAtk    = parseInt(box.querySelector(".atk-bonus")?.value) || 0;
    const pontCombate = parseInt(document.getElementById("combate")?.value) || 0;
    const modCombate  = parseInt(document.getElementById("combateMod")?.value) || 0;
    const dado        = Math.floor(Math.random() * 6) + 1;
    const total       = dado + pontCombate + modCombate + bonusAtk;
    const nome        = box.querySelector("input[type='text']")?.value || "Ataque";
    mostrarResultadoDado(dado, pontCombate + modCombate + bonusAtk, total);
    registrarRolagem(" " + nome, dado, pontCombate + modCombate + bonusAtk, total);
};

window.rolarDanoAtaque = function(btn) {
    const box        = btn.closest(".ataque-box");
    const danoSel    = box.querySelector(".ataque-dano-select")?.value || "0";
    const bonusDano  = parseInt(box.querySelector(".atk-dano-bonus")?.value) || 0;
    const nome       = box.querySelector("input[type='text']")?.value || "Ataque";
    if (danoSel === "0") { mostrarResultadoDano(0, bonusDano, bonusDano); return; }
    let resultado = danoSel === "1d3"
        ? Math.floor(Math.random() * 3) + 1
        : Array.from({length: parseInt(danoSel)}, () => Math.floor(Math.random() * 6) + 1).reduce((a, b) => a + b, 0);
    mostrarResultadoDano(resultado, bonusDano, resultado + bonusDano);
    registrarRolagem("Dano – " + nome, resultado, bonusDano, resultado + bonusDano);
};

// ─────────────────────────────────────────
//  INICIATIVA
// ─────────────────────────────────────────
window.rolarIniciativa = function() {
    const cor  = parseInt(document.getElementById("coragem")?.value) || 0;
    const iniB = parseInt(document.getElementById("iniciativaBonus")?.value) || 0;
    const base = 1 + cor + iniB;
    const dado = Math.floor(Math.random() * 6) + 1;
    mostrarResultadoDado(dado, base, dado + base);
    registrarRolagem("Iniciativa", dado, base, dado + base);
};

// ─────────────────────────────────────────
//  SALVAR FICHA
// ─────────────────────────────────────────
function extrairAtaques() {
    return Array.from(document.getElementById("ataquesContainer").children).map(div => ({
        nome:      div.querySelector("input[type='text']")?.value || "",
        bonusAtk:  div.querySelector(".atk-bonus")?.value || "0",
        dano:      div.querySelector(".ataque-dano-select")?.value || "0",
        bonusDano: div.querySelector(".atk-dano-bonus")?.value || "0"
    }));
}

async function salvarFichaFirebase() {
    if (!usuarioAtual || !fichaAtualId) return;
    mostrarStatusSalvamento("saving");

    const ficha = {
        uid:              usuarioAtual.uid,
        nome:             document.getElementById("nome").value,
        nivel:            document.getElementById("nivel").value,
        dinheiro:         document.getElementById("dinheiro").value,
        fisico:           document.getElementById("fisico").value,
        agilidade:        document.getElementById("agilidade").value,
        intelecto:        document.getElementById("intelecto").value,
        coragem:          document.getElementById("coragem").value,
        tormento:         document.getElementById("tormento").value,
        vida:             document.getElementById("vida").value,
        vidaMax:          document.getElementById("vidaMax").value,
        agua:             document.getElementById("agua").checked,
        comida:           document.getElementById("comida").checked,
        defesaBonus:      document.getElementById("defesaBonus").value,
        acoesBonus:       document.getElementById("acoesBonus").value,
        iniciativaBonus:  document.getElementById("iniciativaBonus").value,
        recompensas:      document.getElementById("recompensas").value,
        valorRecompensa:  document.getElementById("valorRecompensa").value,
        honraValor:       document.getElementById("honraValor").value,
        modoDinamico,
        avatarUrl:        document.getElementById("avatarUrl")?.value || "",
        diarioSessao:     document.getElementById("diarioSessao")?.value || "",
        combate:          document.getElementById("combate").value,
        combateMod:       document.getElementById("combateMod").value,
        negocios:         document.getElementById("negocios").value,
        negociosMod:      document.getElementById("negociosMod").value,
        montaria:         document.getElementById("montaria").value,
        montariaMod:      document.getElementById("montariaMod").value,
        tradicao:         document.getElementById("tradicao").value,
        tradicaoMod:      document.getElementById("tradicaoMod").value,
        labuta:           document.getElementById("labuta").value,
        labutaMod:        document.getElementById("labutaMod").value,
        exploracao:       document.getElementById("exploracao").value,
        exploracaoMod:    document.getElementById("exploracaoMod").value,
        roubo:            document.getElementById("roubo").value,
        rouboMod:         document.getElementById("rouboMod").value,
        medicina:         document.getElementById("medicina").value,
        medicinaMod:      document.getElementById("medicinaMod").value,
        tecnologia:       document.getElementById("tecnologia").value,
        tecnologiaMod:    document.getElementById("tecnologiaMod").value,
        culinaria:        document.getElementById("culinaria").value,
        culinariaMod:     document.getElementById("culinariaMod").value,
        domestico:        document.getElementById("domestico").value,
        domesticoMod:     document.getElementById("domesticoMod").value,
        direcao:          document.getElementById("direcao").value,
        direcaoMod:       document.getElementById("direcaoMod").value,
        montariaNome:     document.getElementById("montariaNome").value,
        montariaPV:       document.getElementById("montariaPV").value,
        montariaPVMax:    document.getElementById("montariaPVMax").value,
        montariaDanoBonus: document.getElementById("montariaDanoBonus").value,
        montariaPotencia:  document.getElementById("montariaPotencia").value,
        montariaResistencia: document.getElementById("montariaResistencia").value,
        ataques:            extrairAtaques(),
        habilidades:        extrairLista("habilidadesContainer"),
        inventario:         extrairLista("inventarioContainer"),
        inventarioMontaria: extrairLista("inventarioMontariaContainer"),
        ultimaAtualizacao:  serverTimestamp()
    };

    try {
        await setDoc(doc(db, "fichas", fichaAtualId), ficha);
        mostrarStatusSalvamento("saved");
    } catch (e) {
        console.error("Erro ao salvar:", e);
        mostrarStatusSalvamento("error");
    }
}

// ─────────────────────────────────────────
//  PREENCHER CAMPOS
// ─────────────────────────────────────────
function preencherCampos(ficha) {
    for (const key in ficha) {
        const el = document.getElementById(key);
        if (el && typeof ficha[key] !== "object" && key !== "modoDinamico" && key !== "uid") {
            if (el.type === "checkbox") el.checked = ficha[key];
            else if (key === "valorRecompensa" && ficha[key]) {
                const raw = String(ficha[key]).replace(/^R\$\s*/, "").trim();
                el.value = raw ? "R$ " + raw : "";
            } else el.value = ficha[key];
        }
    }

    if (ficha.avatarUrl) atualizarAvatar(ficha.avatarUrl);

    document.querySelectorAll(".pips-container").forEach(container => {
        atualizarPipsVisual(container, ficha[container.getAttribute("data-ant")] || 0);
    });

    document.getElementById("ataquesContainer").innerHTML = "";
    ficha.ataques?.forEach(a =>
        document.getElementById("ataquesContainer").appendChild(criarEstruturaAtaque(a.nome, a.bonusAtk, a.dano, a.bonusDano))
    );

    document.getElementById("habilidadesContainer").innerHTML = "";
    ficha.habilidades?.forEach(h => {
        adicionarHabilidade();
        const div = document.getElementById("habilidadesContainer").lastElementChild;
        div.querySelector("input").value    = h.nome;
        div.querySelector("textarea").value = h.descricao;
    });

    document.getElementById("inventarioContainer").innerHTML = "";
    carregarListaItens(ficha.inventario, window.adicionarItem, "inventarioContainer");
    document.getElementById("inventarioMontariaContainer").innerHTML = "";
    carregarListaItens(ficha.inventarioMontaria, window.adicionarItemMontaria, "inventarioMontariaContainer");

    if (ficha.modoDinamico) { modoDinamico = false; window.toggleCombateDinamico(); }
    calcularValores();
    atualizarHonra();
}

// ─────────────────────────────────────────
//  SISTEMA DE DADOS + LOG
// ─────────────────────────────────────────
async function registrarRolagem(tipo, dado, bonus, total) {
    if (!usuarioAtual) return;
    const player = document.getElementById("nome")?.value?.trim() || "Pistoleiro";
    try {
        await addDoc(collection(db, "rolagens"), {
            player, tipo, dado, bonus, total,
            uid: usuarioAtual.uid,
            timestamp: serverTimestamp()
        });
    } catch (e) { console.error("Erro ao registrar rolagem:", e); }
}

window.rolarDado = function(campoId) {
    const dado  = Math.floor(Math.random() * 6) + 1;
    const campo = document.getElementById(campoId);
    const val   = campo ? (parseInt(campo.value) || 0) : 0;
    const modEl = document.getElementById(campoId + "Mod");
    const mod   = modEl ? (parseInt(modEl.value) || 0) : 0;
    const bonus = val + mod;
    const total = dado + bonus;
    const labelEl = campo?.closest(".campo-antecedente, .campo, .atributo-box")?.querySelector("label");
    mostrarResultadoDado(dado, bonus, total);
    registrarRolagem(labelEl ? labelEl.textContent.trim() : campoId, dado, bonus, total);
};

function mostrarResultadoDado(dado, bonus, total) {
    document.querySelectorAll(".dice-result").forEach(el => {
        el.style.animation = "diceOut 0.25s ease-out forwards";
        setTimeout(() => el.remove(), 250);
    });
    const div = document.createElement("div");
    div.className = "dice-result";
    let critico = "";
    if (dado === 6) { div.classList.add("critico-sucesso"); critico = '<div class="critico-label">SUCESSO CRÍTICO!</div>'; }
    if (dado === 1) { div.classList.add("critico-falha");   critico = '<div class="critico-label">ERRO CRÍTICO!</div>'; }
    div.style.animation = "diceIn 0.35s ease-out forwards";
    div.innerHTML = `
        <div class="dice-result-header">Bônus: ${bonus} + Dado: ${dado}</div>
        <div class="dice-result-total">${total}</div>${critico}
        <div style="font-family:'Special Elite';font-size:0.25em;margin-top:20px;color:#8b6f47;letter-spacing:2px;">CLIQUE EM QUALQUER LUGAR PARA FECHAR</div>`;
    document.body.appendChild(div);
    function fechar() { div.style.animation = "diceOut 0.3s ease-out forwards"; setTimeout(() => div.remove(), 300); document.removeEventListener("click", fechar); }
    setTimeout(() => document.addEventListener("click", fechar), 120);
}

function mostrarResultadoDano(dado, bonus, total) {
    document.querySelectorAll(".dice-result").forEach(el => {
        el.style.animation = "diceOut 0.25s ease-out forwards";
        setTimeout(() => el.remove(), 250);
    });
    const div = document.createElement("div");
    div.className = "dice-result";
    div.style.animation = "diceIn 0.35s ease-out forwards";
    div.innerHTML = `
        <div class="dice-result-header">Bônus: ${bonus} + Dado: ${dado}</div>
        <div class="dice-result-total">${total}</div>
        <div style="font-family:'Special Elite';font-size:0.25em;margin-top:20px;color:#8b6f47;letter-spacing:2px;">CLIQUE EM QUALQUER LUGAR PARA FECHAR</div>`;
    document.body.appendChild(div);
    function fechar() { div.style.animation = "diceOut 0.3s ease-out forwards"; setTimeout(() => div.remove(), 300); document.removeEventListener("click", fechar); }
    setTimeout(() => document.addEventListener("click", fechar), 120);
}

// ─────────────────────────────────────────
//  UTILITÁRIOS
// ─────────────────────────────────────────
function extrairLista(containerId) {
    return Array.from(document.getElementById(containerId).children).map(div => ({
        nome:      div.querySelector("input").value,
        descricao: div.querySelector("textarea").value,
        expandido: div.classList.contains("inv-expandido") ||
                   (div.querySelector("textarea")?.style.display === "block")
    }));
}

function carregarListaItens(lista, fn, containerId) {
    lista?.forEach(item => {
        fn();
        const div = document.getElementById(containerId).lastElementChild;
        div.querySelector("input").value    = item.nome;
        const txt = div.querySelector("textarea");
        txt.value = item.descricao;
        if (item.expandido) {
            txt.style.display = "block";
            div.classList.add("inv-expandido");
            const btn = div.querySelector(".inv-expand-btn");
            if (btn) { btn.textContent = "▾"; btn.title = "Recolher"; }
        } else {
            txt.style.display = "none";
        }
    });
}

window.calcularValores = function() {
    const agi  = parseInt(document.getElementById("agilidade").value) || 0;
    const cor  = parseInt(document.getElementById("coragem").value) || 0;
    const defB = parseInt(document.getElementById("defesaBonus").value) || 0;
    const acB  = parseInt(document.getElementById("acoesBonus").value) || 0;
    const iniB = parseInt(document.getElementById("iniciativaBonus").value) || 0;
    document.getElementById("defesaTotal").textContent    = 5 + defB;
    document.getElementById("acoesTotal").textContent     = 1 + agi + acB;
    document.getElementById("iniciativaTotal").textContent = 1 + cor + iniB;
    if (modoDinamico) atualizarMediasVisuais();
};

window.atualizarHonra = function() {
    const input  = document.getElementById("honraValor");
    const marker = document.getElementById("honraMarker");
    if (!input || !marker) return;
    const val  = Math.max(-15, Math.min(15, parseInt(input.value) || 0));
    const bar  = marker.parentElement;
    const W    = bar.offsetWidth;
    const left = ((val + 15) / 30) * (W - 40);
    marker.style.left      = left + "px";
    marker.style.transform = "translateY(-50%)";
};

window.toggleDescricao = (btn) => {
    const itemBox = btn.closest(".inv-item");
    const txt = itemBox.querySelector("textarea");
    const isVisible = txt.style.display !== "none" && txt.style.display !== "";
    if (isVisible) {
        txt.style.display = "none"; itemBox.classList.remove("inv-expandido");
        btn.textContent = "▸"; btn.title = "Expandir";
    } else {
        txt.style.display = "block"; itemBox.classList.add("inv-expandido");
        btn.textContent = "▾"; btn.title = "Recolher"; txt.focus();
    }
    autoSalvar();
};

let timeoutSalvar = null;
function autoSalvar() {
    if (!usuarioAtual || !fichaAtualId) return;
    clearTimeout(timeoutSalvar);
    mostrarStatusSalvamento("saving");
    timeoutSalvar = setTimeout(() => salvarFichaFirebase(), 1500);
}
window.triggerSalvar = autoSalvar;

// ─────────────────────────────────────────
//  DRAG-AND-DROP
// ─────────────────────────────────────────
let dragSrc = null, dragContainer = null, dropIndicator = null;

function criarDropIndicator() {
    const el = document.createElement("div");
    el.id = "inv-drop-indicator";
    el.style.cssText = "height:2px;background:#b8860b;box-shadow:0 0 6px rgba(184,134,11,0.8);margin:0;border-radius:1px;pointer-events:none;display:none;position:fixed;z-index:9999;";
    return el;
}

function habilitarDragDrop(container) {
    const observer = new MutationObserver(() => configurarDragItens(container));
    observer.observe(container, { childList: true });
    configurarDragItens(container);
}

function configurarDragItens(container) {
    Array.from(container.children).forEach(item => {
        if (item.dataset.dragConfigured) return;
        item.dataset.dragConfigured = "true";
        item.setAttribute("draggable", "true");
        const row = item.querySelector(".inv-row");
        if (row && !row.querySelector(".inv-drag-handle")) {
            const handle = document.createElement("span");
            handle.className = "inv-drag-handle";
            handle.innerHTML = "⠿";
            handle.title = "Arrastar para reordenar";
            handle.style.cssText = "flex-shrink:0;width:18px;color:#3d2f24;font-size:1em;cursor:grab;display:flex;align-items:center;justify-content:center;user-select:none;transition:color 0.15s;padding:0 2px;line-height:1;";
            row.insertBefore(handle, row.firstChild);
        }
        item.addEventListener("dragstart", onDragStart);
        item.addEventListener("dragend",   onDragEnd);
        item.addEventListener("dragover",  onDragOver);
        item.addEventListener("dragleave", onDragLeave);
        item.addEventListener("drop",      onDrop);
    });
}

function onDragStart(e) {
    if (e.target.closest("input, textarea, button")) { e.preventDefault(); return; }
    dragSrc = this; dragContainer = this.parentElement;
    setTimeout(() => { dragSrc.style.opacity = "0.4"; dragSrc.style.outline = "1px dashed #b8860b"; }, 0);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
    if (!dropIndicator) { dropIndicator = criarDropIndicator(); document.body.appendChild(dropIndicator); }
}

function onDragEnd() {
    if (dragSrc) { dragSrc.style.opacity = ""; dragSrc.style.outline = ""; }
    if (dropIndicator) dropIndicator.style.display = "none";
    if (dragContainer) Array.from(dragContainer.children).forEach(c => c.style.background = "");
    dragSrc = null; dragContainer = null;
}

function onDragOver(e) {
    if (!dragSrc || this === dragSrc || this.parentElement !== dragContainer) return;
    e.preventDefault(); e.dataTransfer.dropEffect = "move";
    const rect = this.getBoundingClientRect();
    const depois = e.clientY > rect.top + rect.height / 2;
    const cRect = dragContainer.getBoundingClientRect();
    dropIndicator.style.display = "block";
    dropIndicator.style.left    = cRect.left + "px";
    dropIndicator.style.width   = cRect.width + "px";
    dropIndicator.style.top     = (depois ? rect.bottom : rect.top) - 1 + "px";
    this.dataset.dropPosition   = depois ? "after" : "before";
    Array.from(dragContainer.children).forEach(c => c.style.background = "");
    this.style.background = "rgba(184,134,11,0.06)";
}

function onDragLeave() { this.style.background = ""; delete this.dataset.dropPosition; }

function onDrop(e) {
    if (!dragSrc || this === dragSrc || this.parentElement !== dragContainer) return;
    e.preventDefault(); e.stopPropagation();
    const position = this.dataset.dropPosition || "before";
    if (position === "before") dragContainer.insertBefore(dragSrc, this);
    else { const next = this.nextSibling; next ? dragContainer.insertBefore(dragSrc, next) : dragContainer.appendChild(dragSrc); }
    this.style.background = ""; delete this.dataset.dropPosition;
    salvarFichaFirebase();
}

// ─────────────────────────────────────────
//  LISTAS
// ─────────────────────────────────────────
window.adicionarHabilidade = function() {
    const div = document.createElement("div");
    div.className = "item-box";
    div.innerHTML = `
        <input type="text" placeholder="Habilidade">
        <textarea placeholder="Descrição..."></textarea>
        <button class="btn btn-small btn-danger" onclick="this.parentElement.remove(); window.triggerSalvar()">Remover</button>`;
    document.getElementById("habilidadesContainer").appendChild(div);
};

function adicionarEstruturaItem(container, placeholder) {
    const div = document.createElement("div");
    div.className = "inv-item";
    div.innerHTML = `
        <div class="inv-row">
            <button class="inv-expand-btn" onclick="window.toggleDescricao(this)" title="Expandir">▸</button>
            <input type="text" class="inv-nome" placeholder="${placeholder}">
            <button class="inv-del-btn" onclick="this.closest('.inv-item').remove(); window.triggerSalvar()" title="Remover">✕</button>
        </div>
        <textarea class="inv-desc" placeholder="Detalhes e propriedades..." style="display:none;"></textarea>`;
    container.appendChild(div);
    setTimeout(() => div.querySelector(".inv-nome").focus(), 50);
}

window.adicionarItem         = () => adicionarEstruturaItem(document.getElementById("inventarioContainer"), "Nome do item...");
window.adicionarItemMontaria = () => adicionarEstruturaItem(document.getElementById("inventarioMontariaContainer"), "Equipamento...");

// ─────────────────────────────────────────
//  OUTRAS FUNÇÕES
// ─────────────────────────────────────────
window.rolarDanoMontaria = function() {
    const dado  = Math.floor(Math.random() * 6) + 1;
    const pot   = parseInt(document.getElementById("montariaPotencia").value) || 0;
    const bonus = parseInt(document.getElementById("montariaDanoBonus").value) || 0;
    mostrarResultadoDano(dado, pot + bonus, dado + pot + bonus);
    registrarRolagem("Dano da Montaria", dado, pot + bonus, dado + pot + bonus);
};

window.irParaBase = function() {
    salvarFichaFirebase();
    document.body.style.opacity = "0";
    setTimeout(() => { window.location.href = "base.html"; }, 500);
};

// Compatibilidade com botões antigos do HTML
window.salvarFicha         = salvarFichaFirebase;
window.novaFicha           = window.criarNovaFicha;
window.carregarFichaManual = () => alert("Com o novo sistema, use o seletor de fichas após o login.");

// ─────────────────────────────────────────
//  CAMPO VALOR RECOMPENSA
// ─────────────────────────────────────────
function configurarCampoRecompensa() {
    const el = document.getElementById("valorRecompensa");
    if (!el) return;
    const PREFIX = "R$ ";
    el.addEventListener("focus", () => {
        if (!el.value.startsWith(PREFIX)) el.value = PREFIX + el.value.replace(/^R\$\s*/, "").trim();
        setTimeout(() => el.setSelectionRange(el.value.length, el.value.length), 0);
    });
    el.addEventListener("keydown", (e) => {
        const s = el.selectionStart, end = el.selectionEnd;
        if (["Backspace","Delete"].includes(e.key)) {
            if (s <= PREFIX.length && end <= PREFIX.length) { e.preventDefault(); return; }
            if (s < PREFIX.length) { e.preventDefault(); el.setSelectionRange(PREFIX.length, end); }
        }
        if (e.key === "Home" && !e.shiftKey) { e.preventDefault(); el.setSelectionRange(PREFIX.length, PREFIX.length); }
    });
    el.addEventListener("input", () => {
        if (!el.value.startsWith(PREFIX)) el.value = PREFIX + el.value.replace(/^R\$\s*/, "");
        if (el.selectionStart < PREFIX.length) el.setSelectionRange(PREFIX.length, PREFIX.length);
    });
    el.addEventListener("blur", () => { if (["R$", "R$ "].includes(el.value.trim())) el.value = ""; });
}

// ─────────────────────────────────────────
//  INICIALIZAÇÃO
// ─────────────────────────────────────────
window.addEventListener("load", () => {
    // Enter nos campos de login
    ["loginEmail","loginSenha"].forEach(id => {
        document.getElementById(id)?.addEventListener("keydown", e => {
            if (e.key === "Enter") window.fazerLogin();
        });
    });

    configurarPips();
    configurarCampoRecompensa();
    habilitarDragDrop(document.getElementById("inventarioContainer"));
    habilitarDragDrop(document.getElementById("inventarioMontariaContainer"));

    document.addEventListener("input", e => {
        if (!usuarioAtual || !fichaAtualId) return;
        if (e.target.matches("input, textarea, select")) {
            if (modoDinamico) atualizarMediasVisuais();
            autoSalvar();
        }
    });
    document.addEventListener("change", e => {
        if (!usuarioAtual || !fichaAtualId) return;
        if (e.target.matches("input, textarea, select")) {
            if (modoDinamico) atualizarMediasVisuais();
            autoSalvar();
        }
    });

    calcularValores();
    atualizarHonra();
    setTimeout(atualizarHonra, 50);
});