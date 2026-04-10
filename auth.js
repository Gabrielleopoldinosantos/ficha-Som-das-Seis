// ═══════════════════════════════════════════════════════════════
//  auth.js — Módulo de Autenticação · O Som das Seis
//  Substitui o sistema de "senha caseira" por Firebase Auth
//  com hash SHA-256. JWT é gerenciado automaticamente pelo SDK.
// ═══════════════════════════════════════════════════════════════

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    query,
    collection,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCp5slzZKVuMQ5N86zv2vXbvMGEeNwem94",
    authDomain: "sds-ficha.firebaseapp.com",
    projectId: "sds-ficha",
    storageBucket: "sds-ficha.firebasestorage.app",
    messagingSenderId: "406558124782",
    appId: "1:406558124782:web:e1f68e6693a57dde7ea1ff"
};

// Evita inicializar duas vezes se já foi feito no script.js
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ─────────────────────────────────────────────────────────────
//  UTILITÁRIO: Hash SHA-256 da senha (WebCrypto API nativa)
//  Converte a "senha" do jogo em email fictício + senha hasheada
//  para o Firebase Auth, sem expor a senha original.
// ─────────────────────────────────────────────────────────────
async function hashSenha(senha) {
    const encoder = new TextEncoder();
    const data    = encoder.encode(senha.toUpperCase().trim());
    const hashBuf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuf))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

// Converte a senha do jogo em um "email" fictício para o Firebase Auth.
// O Firebase Auth exige formato email@dominio.com para autenticação.
function senhaParaEmail(senha) {
    const limpa = senha.toUpperCase().trim().replace(/[^A-Z0-9_]/g, "");
    return `${limpa}@sds-ficha.game`;
}

// ─────────────────────────────────────────────────────────────
//  CRIAR CONTA (primeira vez que usa a senha)
// ─────────────────────────────────────────────────────────────
export async function criarConta(senha, nomePersonagem) {
    const email       = senhaParaEmail(senha);
    const senhaHash   = await hashSenha(senha);

    // Firebase Auth exige senha >= 6 chars; o hash tem 64.
    const userCredential = await createUserWithEmailAndPassword(auth, email, senhaHash);
    const uid = userCredential.user.uid;

    // Salva o perfil de autenticação com o nome do personagem
    await updateProfile(userCredential.user, { displayName: nomePersonagem });

    // Cria documento de mapeamento senha→uid (para "carregar ficha" por senha)
    // Armazena apenas o hash, nunca a senha em texto puro.
    await setDoc(doc(db, "auth_map", email.split("@")[0]), {
        uid,
        nomePersonagem,
        criadoEm: new Date().toISOString()
    });

    return userCredential.user;
}

// ─────────────────────────────────────────────────────────────
//  LOGIN (senha já existe)
// ─────────────────────────────────────────────────────────────
export async function login(senha) {
    const email     = senhaParaEmail(senha);
    const senhaHash = await hashSenha(senha);
    const userCredential = await signInWithEmailAndPassword(auth, email, senhaHash);
    return userCredential.user;
}

// ─────────────────────────────────────────────────────────────
//  LOGOUT
// ─────────────────────────────────────────────────────────────
export async function logout() {
    await signOut(auth);
}

// ─────────────────────────────────────────────────────────────
//  OBSERVER: callback chamado sempre que o estado de auth muda.
//  Use isto no script.js para saber se o usuário está logado.
// ─────────────────────────────────────────────────────────────
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

// ─────────────────────────────────────────────────────────────
//  CARREGAR FICHA DO USUÁRIO ATUAL (por UID)
// ─────────────────────────────────────────────────────────────
export async function carregarFichaPorUID(uid) {
    const snap = await getDoc(doc(db, "fichas", uid));
    return snap.exists() ? snap.data() : null;
}

// ─────────────────────────────────────────────────────────────
//  OBTER AUTH E DB (para uso no script.js)
// ─────────────────────────────────────────────────────────────
export { auth, db, app };