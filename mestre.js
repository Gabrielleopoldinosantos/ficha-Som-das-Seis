import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    query, 
    orderBy, 
    limit 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuração do Firebase (conforme fornecido anteriormente)
const firebaseConfig = {    
    apiKey: "AIzaSyCp5slzZKVuMQ5N86zv2vXbvMGEeNwem94",
    authDomain: "sds-ficha.firebaseapp.com",
    projectId: "sds-ficha",
    storageBucket: "sds-ficha.firebasestorage.app",
    messagingSenderId: "406558124782",
    appId: "1:406558124782:web:e1f68e6693a57dde7ea1ff",
    measurementId: "G-79SRX1P4D7"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 1. MONITORAMENTO DAS FICHAS (GRID DE PLAYERS) ---
// Ouve mudanças na coleção "fichas" e atualiza os cards automaticamente
onSnapshot(collection(db, "fichas"), (snapshot) => {
    const grid = document.getElementById('gridPlayers');
    if (!grid) return;
    grid.innerHTML = '';
    
// Dentro do onSnapshot(collection(db, "fichas")...
snapshot.forEach((doc) => {
    const p = doc.data();
// Dentro do seu loop snapshot.forEach...
const defTotal = 5 + (parseInt(p.defesaBonus) || 0);
const acoesTotal = 1 + (parseInt(p.agilidade) || 0) + (parseInt(p.acoesBonus) || 0);
const honra = p.honraValor || 0;

grid.innerHTML += `
    <div class="card-player">
        <div class="card-header">${p.nome || "Pistoleiro"}</div>
        <div class="card-body">
            <div class="status-mini">
                <span>❤️ PV: ${p.vida}/${p.vidaMax}</span>
                <span>${p.agua ? "💧" : "💀"} ${p.comida ? "🍖" : "💀"}</span>
            </div>
            <div class="vida-barra">
                <div class="vida-progresso" style="width: ${(p.vida/p.vidaMax)*100}%"></div>
            </div>

            <div style="margin: 8px 0; padding: 5px; border: 1px solid #6b4a7a; border-radius: 4px; background: rgba(26, 16, 21, 0.6); text-align: center;">
                <div style="font-family: 'Rye'; color: #c8a2d0; font-size: 0.65em; text-transform: uppercase; letter-spacing: 1px;">Tormento</div>
                <div style="font-family: 'Special Elite'; color: #e8dcc0; font-size: 0.85em; font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${p.tormento || 'Nenhum'}">
                    ${p.tormento || "---"}
                </div>
            </div>

            <div class="info-combat-bar">
                <div class="info-combat-item">DEFESA <b>${defTotal}</b></div>
                <div class="divider">|</div>
                <div class="info-combat-item">AÇÕES <b>${acoesTotal}</b></div>
                <div class="divider">|</div>
                <div class="info-combat-item">HONRA <b>${honra}</b></div>
            </div>

${p.montariaNome ? `
    <div style="border: 1px solid #3d2f24; padding: 8px; border-radius: 4px; background: rgba(0,0,0,0.2); margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-family: 'Rye'; color: #d4a574; font-size: 0.8em;">🐎 ${p.montariaNome}</span>
            <span style="font-size: 0.7em; color: #e8dcc0; font-family: 'Special Elite';">
                ${p.montariaPV}/${p.montariaPVMax}
            </span>
        </div>
        <div class="vida-barra" style="height: 8px; margin-bottom: 0; position: relative; background: #1a0a0a;">
            <div class="vida-progresso" 
                 style="width: ${(p.montariaPV/p.montariaPVMax)*100}%; 
                        background: linear-gradient(90deg, #44ff44, #228822); 
                        height: 100%;">
            </div>
        </div>
    </div>
` : ''}
        </div>
    </div>
`;
});
});

// --- 2. MONITORAMENTO DO LOG DE ROLAGENS ---
// Busca as últimas 20 rolagens ordenadas por tempo
const qRolagens = query(
    collection(db, "rolagens"), 
    orderBy("timestamp", "desc"), 
    limit(20)
);

onSnapshot(qRolagens, (snapshot) => {
    const logDiv = document.getElementById('logRolagens');
    if (!logDiv) return;
    
    logDiv.innerHTML = '';
    
    snapshot.forEach((doc) => {
        const r = doc.data();
        const dataHora = r.timestamp ? new Date(r.timestamp.seconds * 1000).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '--:--';
        
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        
        // Identifica se foi sucesso ou erro crítico para mudar a cor se desejar
        if (r.dado === 6) logItem.style.borderLeftColor = "#00ff00";
        if (r.dado === 1) logItem.style.borderLeftColor = "#ff0000";

        logItem.innerHTML = `
            <span class="log-resultado">${r.total}</span>
            <span class="log-nome">${r.player}</span>
            <span class="log-detalhe">${r.tipo}</span>
            <div style="font-size: 0.8em; color: #8b6f47;">
                [Dado: ${r.dado}, Bônus: ${r.bonus}] • ${dataHora}
            </div>
        `;
        logDiv.appendChild(logItem);
    });
});