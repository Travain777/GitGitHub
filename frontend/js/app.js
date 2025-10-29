/**
 * Aplicação Principal - Dashboard PLC Mitsubishi
 * Integra PLCClient, AIAnalysis e interface do usuário
 */

// Estado global da aplicação
const app = {
    plcClient: null,
    aiAnalysis: null,
    charts: {},
    updateInterval: null,
    config: {
        updateFrequency: 1000, // 1 segundo
        maxDataPoints: 50,
        defaultRegisters: [
            { type: 'D', address: 0, count: 10 },
            { type: 'M', address: 0, count: 16 }
        ]
    }
};

/**
 * Inicializa a aplicação
 */
async function initialize() {
    logMessage('info', 'Inicializando aplicação...');

    // Criar instâncias
    app.plcClient = new PLCClient();
    app.aiAnalysis = new AIAnalysis();

    // Configurar event listeners
    setupPLCListeners();
    setupAIListeners();
    setupUIListeners();

    // Inicializar gráficos
    initializeCharts();

    // Inicializar AI
    await app.aiAnalysis.initialize();

    logMessage('success', 'Aplicação inicializada com sucesso');
}

/**
 * Configura listeners do PLC
 */
function setupPLCListeners() {
    app.plcClient.on('connected', () => {
        updateConnectionStatus(true);
        logMessage('success', 'Conectado ao servidor WebSocket');
    });

    app.plcClient.on('disconnected', () => {
        updateConnectionStatus(false);
        logMessage('warning', 'Desconectado do servidor WebSocket');
    });

    app.plcClient.on('plc_connected', (data) => {
        logMessage('success', `Conectado ao PLC ${data.plcIp}:${data.plcPort}`);
        startDataUpdates();
    });

    app.plcClient.on('plc_disconnected', () => {
        logMessage('warning', 'Desconectado do PLC');
        stopDataUpdates();
    });

    app.plcClient.on('data', (data) => {
        updateDashboard(data);
    });

    app.plcClient.on('error', (error) => {
        logMessage('error', `Erro: ${error.message || 'Desconhecido'}`);
    });

    app.plcClient.on('log', (log) => {
        logMessage(log.type, log.message);
    });
}

/**
 * Configura listeners da AI
 */
function setupAIListeners() {
    app.aiAnalysis.on('loaded', () => {
        document.getElementById('aiStatus').textContent = 'Pronto';
        logMessage('success', 'Motor de IA carregado');
    });

    app.aiAnalysis.on('analysis_started', (data) => {
        document.getElementById('aiStatus').textContent = 'Analisando';
        document.getElementById('startAiBtn').disabled = true;
        document.getElementById('stopAiBtn').disabled = false;
        logMessage('info', `Análise ${data.modelType} iniciada`);
    });

    app.aiAnalysis.on('analysis_stopped', () => {
        document.getElementById('aiStatus').textContent = 'Parado';
        document.getElementById('startAiBtn').disabled = false;
        document.getElementById('stopAiBtn').disabled = true;
        logMessage('info', 'Análise parada');
    });

    app.aiAnalysis.on('analysis_result', (result) => {
        displayAIResult(result);
    });

    app.aiAnalysis.on('error', (error) => {
        logMessage('error', `Erro IA: ${error.message || 'Desconhecido'}`);
    });

    app.aiAnalysis.on('log', (log) => {
        logMessage(log.type, log.message);
    });
}

/**
 * Configura listeners da UI
 */
function setupUIListeners() {
    // Botão conectar
    document.getElementById('connectBtn').addEventListener('click', () => {
        const ip = document.getElementById('plcIp').value;
        const port = parseInt(document.getElementById('plcPort').value);

        if (!ip || !port) {
            logMessage('error', 'Por favor, insira IP e porta válidos');
            return;
        }

        app.plcClient.connect(ip, port);
        document.getElementById('connectBtn').disabled = true;
        document.getElementById('disconnectBtn').disabled = false;
    });

    // Botão desconectar
    document.getElementById('disconnectBtn').addEventListener('click', () => {
        app.plcClient.disconnect();
        stopDataUpdates();
        document.getElementById('connectBtn').disabled = false;
        document.getElementById('disconnectBtn').disabled = true;
    });

    // Botão iniciar AI
    document.getElementById('startAiBtn').addEventListener('click', () => {
        const modelType = document.getElementById('aiModel').value;
        app.aiAnalysis.startAnalysis(modelType, app.plcClient);
    });

    // Botão parar AI
    document.getElementById('stopAiBtn').addEventListener('click', () => {
        app.aiAnalysis.stopAnalysis();
    });

    // Botão limpar log
    document.getElementById('clearLogBtn').addEventListener('click', () => {
        const logContainer = document.getElementById('logContainer');
        logContainer.innerHTML = '<p class="log-entry">Log limpo...</p>';
    });
}

/**
 * Inicializa gráficos Chart.js
 */
function initializeCharts() {
    // Gráfico em tempo real
    const realtimeCtx = document.getElementById('realtimeChart').getContext('2d');
    app.charts.realtime = new Chart(realtimeCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'D0',
                data: [],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4
            }, {
                label: 'D1',
                data: [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#f1f5f9' } }
            },
            scales: {
                y: {
                    ticks: { color: '#cbd5e1' },
                    grid: { color: '#475569' }
                },
                x: {
                    ticks: { color: '#cbd5e1' },
                    grid: { color: '#475569' }
                }
            }
        }
    });

    // Gráfico de tendência
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    app.charts.trend = new Chart(trendCtx, {
        type: 'bar',
        data: {
            labels: ['D0', 'D1', 'D2', 'D3', 'D4'],
            datasets: [{
                label: 'Valores Médios',
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    'rgba(37, 99, 235, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(139, 92, 246, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#f1f5f9' } }
            },
            scales: {
                y: {
                    ticks: { color: '#cbd5e1' },
                    grid: { color: '#475569' }
                },
                x: {
                    ticks: { color: '#cbd5e1' },
                    grid: { color: '#475569' }
                }
            }
        }
    });
}

/**
 * Atualiza status da conexão
 */
function updateConnectionStatus(connected) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('connectionStatus');

    if (connected) {
        statusIndicator.classList.add('connected');
        statusText.textContent = 'Conectado';
    } else {
        statusIndicator.classList.remove('connected');
        statusText.textContent = 'Desconectado';
    }
}

/**
 * Inicia atualizações de dados
 */
function startDataUpdates() {
    if (app.updateInterval) return;

    // Iniciar leitura contínua dos registros padrão
    app.plcClient.startContinuousRead(app.config.defaultRegisters);

    // Atualizar estatísticas periodicamente
    app.updateInterval = setInterval(() => {
        updateStatistics();
    }, app.config.updateFrequency);

    logMessage('info', 'Atualizações de dados iniciadas');
}

/**
 * Para atualizações de dados
 */
function stopDataUpdates() {
    if (app.updateInterval) {
        clearInterval(app.updateInterval);
        app.updateInterval = null;
    }

    app.plcClient.stopContinuousRead();
    logMessage('info', 'Atualizações de dados paradas');
}

/**
 * Atualiza dashboard com novos dados
 */
function updateDashboard(data) {
    // Atualizar registros D
    if (data.D) {
        updateRegisterList('dRegisterList', data.D, 'D');
        updateRealtimeChart(data.D);
    }

    // Atualizar bits M
    if (data.M) {
        updateRegisterList('mBitList', data.M, 'M');
    }

    // Incrementar contador de dispositivos
    const count = (data.D ? Object.keys(data.D).length : 0) +
                  (data.M ? Object.keys(data.M).length : 0);
    document.getElementById('deviceCount').textContent = count;
}

/**
 * Atualiza lista de registros
 */
function updateRegisterList(elementId, registers, type) {
    const listElement = document.getElementById(elementId);

    if (!registers || Object.keys(registers).length === 0) {
        listElement.innerHTML = '<p class="placeholder">Nenhum dado disponível</p>';
        return;
    }

    let html = '';
    for (let [address, value] of Object.entries(registers)) {
        html += `
            <div class="register-item">
                <span class="register-name">${type}${address}</span>
                <span class="register-value">${value}</span>
            </div>
        `;
    }

    listElement.innerHTML = html;
}

/**
 * Atualiza gráfico em tempo real
 */
function updateRealtimeChart(data) {
    const chart = app.charts.realtime;
    const timestamp = new Date().toLocaleTimeString();

    // Adicionar timestamp
    chart.data.labels.push(timestamp);
    if (chart.data.labels.length > app.config.maxDataPoints) {
        chart.data.labels.shift();
    }

    // Atualizar datasets (D0 e D1)
    chart.data.datasets[0].data.push(data['0'] || 0);
    chart.data.datasets[1].data.push(data['1'] || 0);

    // Limitar pontos de dados
    chart.data.datasets.forEach(dataset => {
        if (dataset.data.length > app.config.maxDataPoints) {
            dataset.data.shift();
        }
    });

    chart.update('none'); // Update sem animação
}

/**
 * Atualiza estatísticas
 */
function updateStatistics() {
    const buffer = app.plcClient.getDataBuffer();

    // Taxa de atualização
    if (buffer.length >= 2) {
        const last = buffer[buffer.length - 1].timestamp;
        const prev = buffer[buffer.length - 2].timestamp;
        const rate = last - prev;
        document.getElementById('updateRate').textContent = `${rate} ms`;
    }

    // Atualizar gráfico de tendência com médias
    if (buffer.length > 0) {
        const averages = calculateAverages(buffer);
        app.charts.trend.data.datasets[0].data = averages;
        app.charts.trend.update('none');
    }
}

/**
 * Calcula médias dos registros
 */
function calculateAverages(buffer) {
    const sums = [0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0];

    buffer.forEach(item => {
        if (item.data && item.data.D) {
            for (let i = 0; i < 5; i++) {
                if (item.data.D[i] !== undefined) {
                    sums[i] += item.data.D[i];
                    counts[i]++;
                }
            }
        }
    });

    return sums.map((sum, i) => counts[i] > 0 ? sum / counts[i] : 0);
}

/**
 * Exibe resultado da análise de IA
 */
function displayAIResult(result) {
    const outputElement = document.getElementById('aiOutput');

    const timestamp = new Date(result.timestamp).toLocaleTimeString();
    let html = `<div class="ai-result">`;
    html += `<strong>[${timestamp}] ${result.type.toUpperCase()}</strong><br>`;

    switch (result.type) {
        case 'anomaly':
            html += `Status: ${result.result.status}<br>`;
            html += `Anomalias: ${result.result.anomalyCount}<br>`;
            html += `Descrição: ${result.result.description}<br>`;
            if (result.result.anomalies.length > 0) {
                document.getElementById('anomalyCount').textContent = result.result.anomalyCount;
                result.result.anomalies.slice(0, 3).forEach(anomaly => {
                    html += `&nbsp;&nbsp;- Índice ${anomaly.index}: ${anomaly.value} (severidade: ${anomaly.severity})<br>`;
                });
            }
            break;

        case 'prediction':
            html += `Tendência: ${result.result.currentTrend}<br>`;
            html += `R²: ${result.result.r2.toFixed(3)}<br>`;
            html += `Previsões (próximos 3 pontos):<br>`;
            result.result.predictions.slice(0, 3).forEach(pred => {
                html += `&nbsp;&nbsp;+${pred.step}: ${pred.value.toFixed(2)} (${pred.confidence})<br>`;
            });
            break;

        case 'classification':
            html += `Estado: ${result.result.state}<br>`;
            html += `Confiança: ${(result.result.confidence * 100).toFixed(1)}%<br>`;
            html += `Variabilidade: ${result.result.variability.toFixed(3)}<br>`;
            html += `${result.result.description}`;
            break;
    }

    html += `</div>`;

    // Adicionar ao início (mais recente primeiro)
    outputElement.innerHTML = html + outputElement.innerHTML;

    // Limitar número de resultados exibidos
    const results = outputElement.querySelectorAll('.ai-result');
    if (results.length > 10) {
        results[results.length - 1].remove();
    }
}

/**
 * Adiciona mensagem ao log
 */
function logMessage(type, message) {
    const logContainer = document.getElementById('logContainer');
    const timestamp = new Date().toLocaleTimeString();

    const entry = document.createElement('p');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${timestamp}] ${message}`;

    logContainer.appendChild(entry);

    // Auto-scroll para o final
    logContainer.scrollTop = logContainer.scrollHeight;

    // Limitar número de entradas
    const entries = logContainer.querySelectorAll('.log-entry');
    if (entries.length > 100) {
        entries[0].remove();
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    initialize();
});

// Limpar ao fechar
window.addEventListener('beforeunload', () => {
    if (app.plcClient) {
        app.plcClient.disconnect();
    }
    if (app.aiAnalysis) {
        app.aiAnalysis.stopAnalysis();
    }
});
