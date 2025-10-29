/**
 * Configuração do Frontend
 * Edite este arquivo para ajustar configurações do sistema
 */

const CONFIG = {
    // Backend Configuration
    backend: {
        // Para Node.js WebSocket
        type: 'websocket', // 'websocket' ou 'http'
        url: 'ws://localhost:3000',

        // Para PHP HTTP (comente o acima e descomente abaixo)
        // type: 'http',
        // url: 'https://seu-dominio.com/api/api.php',
    },

    // PLC Configuration
    plc: {
        defaultIp: '192.168.0.1',
        defaultPort: 5000,
        connectionTimeout: 10000, // ms
    },

    // Data Update Configuration
    data: {
        updateFrequency: 1000, // ms
        maxDataPoints: 50, // Número de pontos no gráfico
        maxBufferSize: 1000, // Tamanho máximo do buffer de dados
    },

    // Default Registers to Read
    registers: {
        D: [
            { address: 0, count: 10, description: 'Registros D0-D9' },
            // Adicione mais conforme necessário
            // { address: 100, count: 5, description: 'Processo 1' },
        ],
        M: [
            { address: 0, count: 16, description: 'Bits M0-M15' },
            // Adicione mais conforme necessário
            // { address: 100, count: 8, description: 'Status Sensores' },
        ]
    },

    // AI Analysis Configuration
    ai: {
        enabled: true,
        analysisFrequency: 5000, // ms
        dataWindow: 100, // Número de pontos para análise
        models: {
            anomaly: {
                name: 'Detecção de Anomalias',
                enabled: true,
                threshold: 2.0, // Desvios padrão
            },
            prediction: {
                name: 'Previsão de Tendências',
                enabled: true,
                steps: 10, // Número de previsões
            },
            classification: {
                name: 'Classificação de Estados',
                enabled: true,
                states: ['Normal', 'Alerta', 'Crítico', 'Estável', 'Instável']
            }
        }
    },

    // Chart Configuration
    charts: {
        realtime: {
            type: 'line',
            tension: 0.4,
            colors: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
        },
        trend: {
            type: 'bar',
            colors: [
                'rgba(37, 99, 235, 0.7)',
                'rgba(16, 185, 129, 0.7)',
                'rgba(245, 158, 11, 0.7)',
                'rgba(239, 68, 68, 0.7)',
                'rgba(139, 92, 246, 0.7)'
            ]
        }
    },

    // UI Configuration
    ui: {
        darkMode: true,
        logMaxEntries: 100,
        showTimestamps: true,
        autoScroll: true,
    },

    // Debug
    debug: {
        enabled: false, // Ativar logs detalhados no console
        showRawData: false, // Mostrar dados brutos no console
    }
};

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
