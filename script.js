// ============================================
// ÁGUA FÁCIL - SCRIPT COMPLETO
// COM GRÁFICO, EXPORTAÇÃO, MAIS CULTURAS E TRADUÇÃO
// ============================================

// ============================================
// 1. DADOS SIMULADOS (FALLBACK)
// ============================================

function gerarDadosFake() {
    let temperatura = Math.floor(Math.random() * (38 - 18 + 1) + 18);
    let umidade = Math.floor(Math.random() * (85 - 30 + 1) + 30);
    return { temp: temperatura, umid: umidade };
}

// ============================================
// 2. CÁLCULO DO VPD
// ============================================

function calcularVPD(temperatura, umidade) {
    let svp = 610.78 * Math.exp((17.2694 * temperatura) / (temperatura + 238.3));
    let vpd = ((100 - umidade) / 100) * svp / 1000;
    return Math.round(vpd * 100) / 100;
}

// ============================================
// 3. COEFICIENTES DAS CULTURAS (ATUALIZADO)
// ============================================

function estimarPotencial(vpd, cultura, estadio, diasSemChuva) {
    const coeficientes = {
    milho: -0.35, soja: -0.40, tomate: -0.28,
    cafe: -0.32, abacaxi: -0.35, laranja: -0.30, trigo: -0.38,
    cana: -0.33, eucalipto: -0.45, algodao: -0.42,
    batata: -0.30
};
    
    let coeficiente = coeficientes[cultura] || -0.35;
    
    let fatorEstadio = 1.0;
    if (estadio === 'vegetativo') fatorEstadio = 0.9;
    if (estadio === 'floracao') fatorEstadio = 1.0;
    if (estadio === 'frutificacao') fatorEstadio = 1.1;
    
    let fatorChuva = 1.0;
    if (diasSemChuva == 1) fatorChuva = 1.05;
    if (diasSemChuva == 3) fatorChuva = 1.2;
    if (diasSemChuva == 5) fatorChuva = 1.3;
    if (diasSemChuva == 7) fatorChuva = 1.4;
    if (diasSemChuva == 15) fatorChuva = 1.6;
    if (diasSemChuva == 30) fatorChuva = 1.9;
    
    let potencialBase = coeficiente * vpd - 0.15;
    let potencialFinal = potencialBase * (fatorChuva / fatorEstadio);
    
    if (potencialFinal < -2.5) potencialFinal = -2.5;
    if (potencialFinal > -0.1) potencialFinal = -0.1;
    
    return Math.round(potencialFinal * 100) / 100;
}

// ============================================
// 4. ALERTA E RECOMENDAÇÃO
// ============================================

function gerarAlerta(potencial, idioma = 'pt') {
    const textos = {
        pt: {
            conforto: "✅ CONFORTO HÍDRICO: A planta está bem hidratada.",
            confortoRec: "Continue monitorando. Condições favoráveis.",
            alerta: "⚠️ ALERTA: A planta começa a sentir sede.",
            alertaRec: "Programe irrigação para as próximas 24-48 horas.",
            critico: "🔴 CRÍTICO: Estresse hídrico severo!",
            criticoRec: "IRRIGUE IMEDIATAMENTE! A polinização pode ser comprometida.",
            emergencia: "🚨 EMERGÊNCIA: Dano hídrico grave!",
            emergenciaRec: "IRRIGAÇÃO DE URGÊNCIA. Avalie danos na lavoura."
        },
        en: {
            conforto: "✅ WATER COMFORT: Plant is well hydrated.",
            confortoRec: "Keep monitoring. Favorable conditions.",
            alerta: "⚠️ ALERT: Plant begins to feel thirsty.",
            alertaRec: "Schedule irrigation for the next 24-48 hours.",
            critico: "🔴 CRITICAL: Severe water stress!",
            criticoRec: "IRRIGATE IMMEDIATELY! Pollination may be compromised.",
            emergencia: "🚨 EMERGENCY: Severe water damage!",
            emergenciaRec: "URGENT IRRIGATION. Assess crop damage."
        },
        es: {
            conforto: "✅ CONFORT HÍDRICO: La planta está bien hidratada.",
            confortoRec: "Continúe monitoreando. Condiciones favorables.",
            alerta: "⚠️ ALERTA: La planta comienza a tener sed.",
            alertaRec: "Programe riego para las próximas 24-48 horas.",
            critico: "🔴 CRÍTICO: ¡Estrés hídrico severo!",
            criticoRec: "¡RIEGUE INMEDIATAMENTE! La polinización puede verse comprometida.",
            emergencia: "🚨 EMERGENCIA: ¡Daño hídrico grave!",
            emergenciaRec: "RIEGO DE URGENCIA. Evalúe daños en el cultivo."
        }
    };
    
    const t = textos[idioma] || textos.pt;
    
    if (potencial > -0.5) {
        return { mensagem: t.conforto, recomendacao: t.confortoRec };
    } else if (potencial > -0.9) {
        return { mensagem: t.alerta, recomendacao: t.alertaRec };
    } else if (potencial > -1.4) {
        return { mensagem: t.critico, recomendacao: t.criticoRec };
    } else {
        return { mensagem: t.emergencia, recomendacao: t.emergenciaRec };
    }
}

// ============================================
// 5. GEOLOCALIZAÇÃO E CLIMA REAL
// ============================================

let ultimaLatitude = null;
let ultimaLongitude = null;

function obterLocalizacao() {
    const statusElement = document.getElementById('statusLocalizacao');
    
    if (!navigator.geolocation) {
        if (statusElement) statusElement.innerHTML = "❌ Seu navegador não suporta geolocalização.";
        return;
    }
    
    if (statusElement) statusElement.innerHTML = "📍 Buscando sua localização...";
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            ultimaLatitude = position.coords.latitude;
            ultimaLongitude = position.coords.longitude;
            
            if (statusElement) statusElement.innerHTML = `✅ Localização obtida!`;
            
            buscarClimaReal(ultimaLatitude, ultimaLongitude);
        },
        function(erro) {
            let mensagem = "";
            switch(erro.code) {
                case erro.PERMISSION_DENIED:
                    mensagem = "❌ Você negou o acesso à localização.";
                    break;
                default:
                    mensagem = "❌ Erro ao obter localização. Usando dados simulados.";
            }
            if (statusElement) statusElement.innerHTML = mensagem;
            
            const climaFake = gerarDadosFake();
            recalcularComDadosReais(climaFake.temp, climaFake.umid);
        }
    );
}

async function buscarClimaReal(latitude, longitude) {
    const statusElement = document.getElementById('statusLocalizacao');
    if (statusElement) statusElement.innerHTML = "🌤️ Buscando dados do clima...";
    
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m&timezone=auto`;
        const response = await fetch(url);
        const dados = await response.json();
        
        if (dados && dados.current) {
            const temperatura = dados.current.temperature_2m;
            const umidade = dados.current.relative_humidity_2m;
            
            document.getElementById('temp').innerText = temperatura;
            document.getElementById('umidade').innerText = umidade;
            
            recalcularComDadosReais(temperatura, umidade);
            
            if (statusElement) {
                statusElement.innerHTML = "✅ Dados atualizados!";
                setTimeout(() => { if (statusElement) statusElement.innerHTML = ""; }, 3000);
            }
        }
    } catch (erro) {
        console.error("Erro ao buscar clima:", erro);
        if (statusElement) statusElement.innerHTML = "❌ Erro. Usando simulação.";
        const climaFake = gerarDadosFake();
        recalcularComDadosReais(climaFake.temp, climaFake.umid);
    }
}

function recalcularComDadosReais(temperatura, umidade) {
    const culturaEscolhida = document.getElementById('cultura').value;
    const estadioEscolhido = document.getElementById('estadio').value;
    const diasChuva = parseInt(document.getElementById('chuva').value);
    const idioma = idiomaAtual || 'pt';
    
    const vpd = calcularVPD(temperatura, umidade);
    document.getElementById('vpdValor').innerText = vpd + " kPa";
    
    const potencial = estimarPotencial(vpd, culturaEscolhida, estadioEscolhido, diasChuva);
    document.getElementById('potencialValor').innerHTML = potencial + " MPa";
    
    const alerta = gerarAlerta(potencial, idioma);
    const alertaBox = document.getElementById('alertaBox');
    if (alertaBox) {
        alertaBox.innerHTML = `<p style="font-weight: bold;">${alerta.mensagem}</p><p>💡 ${traducoes[idioma].recomendacao || 'RECOMENDAÇÃO'}: ${alerta.recomendacao}</p>`;
    }
    
    const culturaNome = document.getElementById('cultura').options[document.getElementById('cultura').selectedIndex]?.text || 'Desconhecida';
    const estadioNome = document.getElementById('estadio').options[document.getElementById('estadio').selectedIndex]?.text || 'Desconhecido';
    
    salvarMedicao({
        temperatura: temperatura,
        umidade: umidade,
        vpd: vpd,
        potencial: potencial,
        cultura: culturaNome,
        estadio: estadioNome
    });
}

// ============================================
// 6. BANCO DE DADOS (INDEXEDDB)
// ============================================

let db = null;

function abrirBancoHistorico() {
    const request = indexedDB.open('AguaFacilDB', 2);
    
    request.onerror = function(event) {
        console.log('Erro ao abrir banco:', event);
    };
    
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Banco de dados aberto!');
        carregarHistorico();
    };
    
    request.onupgradeneeded = function(event) {
        const banco = event.target.result;
        if (!banco.objectStoreNames.contains('medicoes')) {
            banco.createObjectStore('medicoes', { keyPath: 'id', autoIncrement: true });
        }
    };
}

function salvarMedicao(medicao) {
    if (!db) {
        console.log('Banco não disponível');
        return;
    }
    
    const transaction = db.transaction(['medicoes'], 'readwrite');
    const store = transaction.objectStore('medicoes');
    
    const dados = {
        timestamp: new Date().toISOString(),
        data: new Date().toLocaleString('pt-BR'),
        temperatura: medicao.temperatura,
        umidade: medicao.umidade,
        vpd: medicao.vpd,
        potencial: medicao.potencial,
        cultura: medicao.cultura,
        estadio: medicao.estadio,
        localizacao: document.getElementById('localizacao')?.innerText || 'Desconhecida'
    };
    
    store.add(dados);
    transaction.oncomplete = () => carregarHistorico();
}

function carregarHistorico() {
    if (!db) return;
    
    const transaction = db.transaction(['medicoes'], 'readonly');
    const store = transaction.objectStore('medicoes');
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const medicoes = event.target.result;
        medicoes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        exibirHistorico(medicoes.slice(0, 20));
        criarGrafico(medicoes.slice(0, 10).reverse());
    };
}

function limparHistorico() {
    if (!db) return;
    if (confirm('Tem certeza? Isso apagará todo o histórico.')) {
        const transaction = db.transaction(['medicoes'], 'readwrite');
        const store = transaction.objectStore('medicoes');
        store.clear();
        transaction.oncomplete = () => carregarHistorico();
    }
}

// ============================================
// 7. GRÁFICO
// ============================================

let graficoHistorico = null;

function criarGrafico(medicoes) {
    const canvas = document.getElementById('graficoHistorico');
    if (!canvas) return;
    
    if (medicoes.length === 0) {
        if (graficoHistorico) graficoHistorico.destroy();
        return;
    }
    
    const datas = medicoes.map(m => {
        const data = new Date(m.timestamp);
        return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    });
    
    const potenciais = medicoes.map(m => m.potencial);
    
    if (graficoHistorico) graficoHistorico.destroy();
    
    const ctx = canvas.getContext('2d');
    graficoHistorico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datas,
            datasets: [{
                label: 'Potencial (MPa)',
                data: potenciais,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: potenciais.map(p => p > -0.5 ? '#28a745' : (p > -0.9 ? '#ffc107' : '#dc3545')),
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: { y: { title: { display: true, text: 'MPa' } } }
        }
    });
}

// ============================================
// 8. EXPORTAR CSV
// ============================================

function exportarParaCSV() {
    if (!db) return;
    
    const transaction = db.transaction(['medicoes'], 'readonly');
    const store = transaction.objectStore('medicoes');
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const medicoes = event.target.result;
        if (medicoes.length === 0) {
            alert('Nenhuma medição para exportar.');
            return;
        }
        
        let csvContent = "\uFEFFData;Temperatura(°C);Umidade(%);VPD(kPa);Potencial(MPa);Cultura;Estádio\n";
        medicoes.forEach(med => {
            csvContent += `"${med.data}";${med.temperatura};${med.umidade};${med.vpd};${med.potencial};"${med.cultura}";"${med.estadio}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `agua-facil-${new Date().toISOString().slice(0,19)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
}

// ============================================
// 9. TRADUÇÃO
// ============================================

const traducoes = {
    pt: { recomendacao: "RECOMENDAÇÃO" },
    en: { recomendacao: "RECOMMENDATION" },
    es: { recomendacao: "RECOMENDACIÓN" }
};

let idiomaAtual = 'pt';

function traduzirPagina() {
    const texto = traducoes[idiomaAtual];
    document.querySelectorAll('.rec-title').forEach(el => {
        if (el) el.innerHTML = `💡 ${texto.recomendacao}`;
    });
}

function mudarIdioma(idioma) {
    idiomaAtual = idioma;
    traduzirPagina();
    document.querySelectorAll('.idioma-btn').forEach(btn => btn.classList.remove('ativo'));
    document.getElementById(`btn${idioma.toUpperCase()}`).classList.add('ativo');
    localStorage.setItem('idioma', idioma);
    
    if (typeof ultimaLatitude === 'number' && ultimaLongitude) {
        buscarClimaReal(ultimaLatitude, ultimaLongitude);
    } else {
        const climaFake = gerarDadosFake();
        recalcularComDadosReais(climaFake.temp, climaFake.umid);
    }
}

// ============================================
// 10. EXIBIR HISTÓRICO
// ============================================

function exibirHistorico(medicoes) {
    const idioma = idiomaAtual;
    let historicoHTML = `
        <div class="historico-container">
            <h3>📋 Histórico de medições</h3>
    `;
    
    if (medicoes.length === 0) {
        historicoHTML += '<p style="color: #999;">Nenhuma medição salva ainda.</p>';
    } else {
        medicoes.forEach(med => {
            let corPotencial = med.potencial > -0.5 ? '#28a745' : (med.potencial > -0.9 ? '#ffc107' : '#dc3545');
            historicoHTML += `
                <div class="historico-item">
                    <div class="historico-data">${med.data}</div>
                    <div class="historico-dados">🌡️ ${med.temperatura}°C | 💨 ${med.umidade}% UR</div>
                    <div class="historico-potencial" style="color: ${corPotencial}">💧 ${med.potencial} MPa</div>
                    <div class="historico-cultura">${med.cultura} (${med.estadio})</div>
                </div>
            `;
        });
    }
    
    historicoHTML += `
        <div class="historico-botoes">
            <button id="btnExportarCSV" class="btn-exportar">📎 Exportar CSV</button>
            <button id="btnLimparHistorico" class="btn-limpar">🗑️ Limpar</button>
        </div>
    </div>`;
    
    const alertaBox = document.getElementById('alertaBox');
    if (alertaBox) {
        if (!document.querySelector('.grafico-container')) {
            alertaBox.insertAdjacentHTML('afterend', '<div class="grafico-container"><h3>📊 Evolução do Potencial</h3><canvas id="graficoHistorico"></canvas></div>');
        }
        if (!document.querySelector('.historico-container')) {
            document.querySelector('.grafico-container').insertAdjacentHTML('afterend', historicoHTML);
        } else {
            document.querySelector('.historico-container').outerHTML = historicoHTML;
        }
    }
    
    document.getElementById('btnExportarCSV')?.addEventListener('click', exportarParaCSV);
    document.getElementById('btnLimparHistorico')?.addEventListener('click', limparHistorico);
}

// ============================================
// 11. INICIALIZAÇÃO
// ============================================

document.getElementById('btnPt')?.addEventListener('click', () => mudarIdioma('pt'));
document.getElementById('btnEn')?.addEventListener('click', () => mudarIdioma('en'));
document.getElementById('btnEs')?.addEventListener('click', () => mudarIdioma('es'));

document.getElementById('botaoAtualizar')?.addEventListener('click', () => {
    if (ultimaLatitude && ultimaLongitude) {
        buscarClimaReal(ultimaLatitude, ultimaLongitude);
    } else {
        const climaFake = gerarDadosFake();
        recalcularComDadosReais(climaFake.temp, climaFake.umid);
    }
});

document.getElementById('botaoLocalizacao')?.addEventListener('click', obterLocalizacao);

const idiomaSalvo = localStorage.getItem('idioma');
if (idiomaSalvo) idiomaAtual = idiomaSalvo;

abrirBancoHistorico();
setTimeout(() => obterLocalizacao(), 500);