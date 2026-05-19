// ============================================
// ÁGUA FÁCIL - SCRIPT COMPLETO
// ============================================

// 1. Função que gera dados aleatórios (simula clima)
function gerarDadosFake() {
    let temperatura = Math.floor(Math.random() * (38 - 18 + 1) + 18);
    let umidade = Math.floor(Math.random() * (85 - 30 + 1) + 30);
    return { temp: temperatura, umid: umidade };
}

// 2. Função que calcula o VPD (sede do ar)
function calcularVPD(temperatura, umidade) {
    let svp = 610.78 * Math.exp((17.2694 * temperatura) / (temperatura + 238.3));
    let vpd = ((100 - umidade) / 100) * svp / 1000;
    return Math.round(vpd * 100) / 100;
}

// 3. Função que estima o potencial de água na planta
function estimarPotencial(vpd, cultura, estadio, diasSemChuva) {
    let coeficientes = {
    milho: -0.35,
    soja: -0.40,
    tomate: -0.28,
    cafe: -0.32,     // Café é sensível, mas tolera um pouco
    laranja: -0.30,  // Citros são mais tolerantes
    trigo: -0.38     // Trigo similar ao milho
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

// 4. Função que gera alerta e recomendação
function gerarAlerta(potencial) {
    if (potencial > -0.5) {
        return {
            mensagem: "✅ CONFORTO HÍDRICO: A planta está bem hidratada.",
            recomendacao: "Continue monitorando. Condições favoráveis."
        };
    } else if (potencial > -0.9) {
        return {
            mensagem: "⚠️ ALERTA: A planta começa a sentir sede.",
            recomendacao: "Programe irrigação para as próximas 24-48 horas."
        };
    } else if (potencial > -1.4) {
        return {
            mensagem: "🔴 CRÍTICO: Estresse hídrico severo!",
            recomendacao: "IRRIGUE IMEDIATAMENTE! A polinização pode ser comprometida."
        };
    } else {
        return {
            mensagem: "🚨 EMERGÊNCIA: Dano hídrico grave!",
            recomendacao: "IRRIGAÇÃO DE URGÊNCIA. Avalie danos na lavoura."
        };
    }
}

// 5. Função principal que atualiza tudo na tela
function atualizarApp() {
    let culturaEscolhida = document.getElementById('cultura').value;
    let estadioEscolhido = document.getElementById('estadio').value;
    let diasChuva = parseInt(document.getElementById('chuva').value);
    
    let clima = gerarDadosFake();
    let temperatura = clima.temp;
    let umidade = clima.umid;
    
    document.getElementById('temp').innerText = temperatura;
    document.getElementById('umidade').innerText = umidade;
    
    let vpd = calcularVPD(temperatura, umidade);
    document.getElementById('vpdValor').innerText = vpd + " kPa";
    
    let potencial = estimarPotencial(vpd, culturaEscolhida, estadioEscolhido, diasChuva);
    document.getElementById('potencialValor').innerText = potencial + " MPa";
    
    let alerta = gerarAlerta(potencial);
    
    let alertaBox = document.getElementById('alertaBox');
    alertaBox.innerHTML = `
        <p style="font-weight: bold;">${alerta.mensagem}</p>
        <p>💡 RECOMENDAÇÃO: ${alerta.recomendacao}</p>
    `;
    
    // Muda a cor da caixa de alerta
    if (potencial > -0.5) {
        alertaBox.style.background = "#d4edda";
        alertaBox.style.borderLeftColor = "#28a745";
    } else if (potencial > -0.9) {
        alertaBox.style.background = "#fff3cd";
        alertaBox.style.borderLeftColor = "#ffc107";
    } else {
        alertaBox.style.background = "#f8d7da";
        alertaBox.style.borderLeftColor = "#dc3545";
    }
}

// 6. Configurar o botão e iniciar
let botao = document.getElementById('botaoAtualizar');
botao.addEventListener('click', atualizarApp);
atualizarApp();
// ============================================
// GEOLOCALIZAÇÃO
// ============================================

function obterLocalizacao() {
    const statusElement = document.getElementById('statusLocalizacao');
    
    if (!navigator.geolocation) {
        statusElement.innerHTML = "❌ Seu navegador não suporta geolocalização.";
        return;
    }
    
    statusElement.innerHTML = "📍 Buscando sua localização...";
    
    navigator.geolocation.getCurrentPosition(
        // Sucesso - conseguiu a localização
        function(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            statusElement.innerHTML = `✅ Localização obtida! Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;
            
            // Salvar no app para usar nas buscas de clima
            window.ultimaLatitude = latitude;
            window.ultimaLongitude = longitude;
            
            // Atualizar o nome da localização (opcional - via geocoding)
            atualizarNomeLocalizacao(latitude, longitude);
            
            // Buscar dados climáticos reais
            buscarClimaReal(latitude, longitude);
        },
        // Erro - usuário negou ou não conseguiu
        function(erro) {
            let mensagem = "";
            switch(erro.code) {
                case erro.PERMISSION_DENIED:
                    mensagem = "❌ Você negou o acesso à localização.";
                    break;
                case erro.POSITION_UNAVAILABLE:
                    mensagem = "❌ Localização indisponível.";
                    break;
                case erro.TIMEOUT:
                    mensagem = "❌ Tempo excedido.";
                    break;
                default:
                    mensagem = "❌ Erro desconhecido.";
            }
            statusElement.innerHTML = mensagem;
        }
    );
}

// Opcional: converter coordenadas em nome da cidade
async function atualizarNomeLocalizacao(lat, lon) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
        const data = await response.json();
        if (data.address) {
            const cidade = data.address.city || data.address.town || data.address.village || "Localização";
            const estado = data.address.state || "";
            const localizacaoElement = document.getElementById('localizacao');
            // Só atualizar se o elemento existir
            if (localizacaoElement) {
                localizacaoElement.innerHTML = `📍 ${cidade}, ${estado}`;
            }
        }
    } catch (erro) {
        console.log("Não foi possível obter o nome da cidade:", erro);
    }
}
// ============================================
// API DE CLIMA REAL (Open-Meteo)
// ============================================

async function buscarClimaReal(latitude, longitude) {
    const statusElement = document.getElementById('statusLocalizacao');
    if (statusElement) {
        statusElement.innerHTML = "🌤️ Buscando dados do clima...";
    }
    
    try {
        // URL da API Open-Meteo - dados atuais
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m&timezone=auto`;
        
        const response = await fetch(url);
        const dados = await response.json();
        
        if (dados && dados.current) {
            const temperatura = dados.current.temperature_2m;
            const umidade = dados.current.relative_humidity_2m;
            
            // Atualizar a tela com dados reais
            document.getElementById('temp').innerText = temperatura;
            document.getElementById('umidade').innerText = umidade;
            
            // Recalcular tudo com os dados reais
            recalcularComDadosReais(temperatura, umidade);
            
            if (statusElement) {
                statusElement.innerHTML = "✅ Dados atualizados com sucesso!";
                setTimeout(() => {
                    if (statusElement) statusElement.innerHTML = "";
                }, 3000);
            }
        }
    } catch (erro) {
        console.error("Erro ao buscar clima:", erro);
        if (statusElement) {
            statusElement.innerHTML = "❌ Erro ao buscar dados. Usando simulação.";
        }
        // Fallback: usar dados aleatórios se a API falhar
        const climaFake = gerarDadosFake();
        recalcularComDadosReais(climaFake.temp, climaFake.umid);
    }
}

// Função que recalcula VPD e potencial com dados reais
function recalcularComDadosReais(temperatura, umidade) {
    // 1. Obter valores dos selects
    const culturaEscolhida = document.getElementById('cultura').value;
    const estadioEscolhido = document.getElementById('estadio').value;
    const diasChuva = parseInt(document.getElementById('chuva').value);
    
    // 2. Calcular VPD
    const vpd = calcularVPD(temperatura, umidade);
    document.getElementById('vpdValor').innerText = vpd + " kPa";
    
    // 3. Calcular potencial
    const potencial = estimarPotencial(vpd, culturaEscolhida, estadioEscolhido, diasChuva);
    document.getElementById('potencialValor').innerHTML = potencial + " MPa";
    
    // 4. Gerar alerta
    const alerta = gerarAlerta(potencial);
    const alertaBox = document.getElementById('alertaBox');
    alertaBox.innerHTML = `<p style="font-weight: bold;">${alerta.mensagem}</p><p>💡 RECOMENDAÇÃO: ${alerta.recomendacao}</p>`;
    
    // 5. Ajustar cor do alerta
    if (potencial > -0.5) {
        alertaBox.style.background = "#d4edda";
        alertaBox.style.borderLeftColor = "#28a745";
    } else if (potencial > -0.9) {
        alertaBox.style.background = "#fff3cd";
        alertaBox.style.borderLeftColor = "#ffc107";
    } else {
        alertaBox.style.background = "#f8d7da";
        alertaBox.style.borderLeftColor = "#dc3545";
    }
}
// ============================================
// INICIALIZAÇÃO
// ============================================

// Configurar o botão de localização
const botaoLocalizacao = document.getElementById('botaoLocalizacao');
if (botaoLocalizacao) {
    botaoLocalizacao.addEventListener('click', obterLocalizacao);
}

// Configurar o botão de atualização normal (agora usa dados reais ou simulados)
const botaoAtualizar = document.getElementById('botaoAtualizar');
if (botaoAtualizar) {
    botaoAtualizar.addEventListener('click', function() {
        if (window.ultimaLatitude && window.ultimaLongitude) {
            // Se temos localização, busca dados reais
            buscarClimaReal(window.ultimaLatitude, window.ultimaLongitude);
        } else {
            // Fallback: dados simulados
            const climaFake = gerarDadosFake();
            recalcularComDadosReais(climaFake.temp, climaFake.umid);
        }
    });
}

// Tentar obter localização automaticamente ao abrir o app
setTimeout(() => {
    obterLocalizacao();
}, 500);
// ============================================
// PREVISÃO DO TEMPO (próximos dias)
// ============================================

async function buscarPrevisao(latitude, longitude) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`;
        
        const response = await fetch(url);
        const dados = await response.json();
        
        if (dados && dados.daily) {
            let previsaoHTML = '<div class="previsao-container"><h3>📅 Previsão para os próximos dias</h3><div class="previsao-dias">';
            
            for (let i = 0; i < dados.daily.time.length; i++) {
                const data = new Date(dados.daily.time[i]);
                const dia = data.toLocaleDateString('pt-BR', { weekday: 'short' });
                const max = Math.round(dados.daily.temperature_2m_max[i]);
                const min = Math.round(dados.daily.temperature_2m_min[i]);
                const chuvaProb = dados.daily.precipitation_probability_max[i];
                
                previsaoHTML += `
                    <div class="previsao-dia">
                        <strong>${dia}</strong>
                        <span>🌡️ ${min}°/${max}°</span>
                        <span>☔ ${chuvaProb}%</span>
                    </div>
                `;
            }
            
            previsaoHTML += '</div></div>';
            
            // Adicionar na tela (depois do alerta)
            const alertaBox = document.getElementById('alertaBox');
            if (!document.querySelector('.previsao-container')) {
                alertaBox.insertAdjacentHTML('afterend', previsaoHTML);
            }
        }
    } catch (erro) {
        console.log("Erro ao buscar previsão:", erro);
    }
}

// Chamar a previsão junto com o clima
// Adicione esta linha dentro da função buscarClimaReal, após atualizar os dados:
// buscarPrevisao(latitude, longitude);