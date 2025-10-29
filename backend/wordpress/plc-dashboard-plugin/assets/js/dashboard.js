/**
 * PLC Dashboard WordPress Plugin - JavaScript
 * Usa API REST do WordPress em vez de WebSocket
 */

(function($) {
    'use strict';

    const PLCDashboard = {
        config: window.plcDashboardConfig || {},
        charts: {},
        updateInterval: null,
        dataBuffer: [],
        maxBufferSize: 1000,
        maxDataPoints: 50,
        connected: false,

        /**
         * Inicializa o dashboard
         */
        init: function() {
            console.log('[PLC Dashboard] Inicializando...');
            this.setupEventListeners();
            this.initializeCharts();
            this.log('info', 'Sistema inicializado');
        },

        /**
         * Configura event listeners
         */
        setupEventListeners: function() {
            $('#plc-connect-btn').on('click', () => this.connect());
            $('#plc-disconnect-btn').on('click', () => this.disconnect());
            $('#plc-ai-start-btn').on('click', () => this.startAI());
            $('#plc-ai-stop-btn').on('click', () => this.stopAI());
            $('#plc-clear-log-btn').on('click', () => this.clearLog());
        },

        /**
         * Conecta ao PLC
         */
        connect: function() {
            const ip = $('#plc-ip-input').val() || this.config.plcIp;
            const port = parseInt($('#plc-port-input').val()) || this.config.plcPort;

            this.log('info', `Conectando ao PLC ${ip}:${port}...`);

            $.ajax({
                url: this.config.apiUrl + 'connect',
                method: 'POST',
                headers: {
                    'X-WP-Nonce': this.config.nonce
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    plcIp: ip,
                    plcPort: port
                }),
                success: (response) => {
                    if (response.success) {
                        this.connected = true;
                        this.updateConnectionStatus(true);
                        this.log('success', response.message);
                        this.startDataUpdates();
                        $('#plc-connect-btn').prop('disabled', true);
                        $('#plc-disconnect-btn').prop('disabled', false);
                    } else {
                        this.log('error', response.error);
                    }
                },
                error: (xhr) => {
                    this.log('error', `Erro: ${xhr.responseText || 'Conexão falhou'}`);
                }
            });
        },

        /**
         * Desconecta do PLC
         */
        disconnect: function() {
            this.connected = false;
            this.updateConnectionStatus(false);
            this.stopDataUpdates();
            this.log('info', 'Desconectado do PLC');
            $('#plc-connect-btn').prop('disabled', false);
            $('#plc-disconnect-btn').prop('disabled', true);
        },

        /**
         * Atualiza status da conexão
         */
        updateConnectionStatus: function(connected) {
            const indicator = $('#plc-status-indicator');
            const status = $('#plc-connection-status');

            if (connected) {
                indicator.addClass('connected');
                status.text('Conectado');
            } else {
                indicator.removeClass('connected');
                status.text('Desconectado');
            }
        },

        /**
         * Inicia atualizações de dados
         */
        startDataUpdates: function() {
            if (this.updateInterval) return;

            const updateFrequency = this.config.updateInterval || 2000;

            this.updateInterval = setInterval(() => {
                if (this.connected) {
                    this.readBatch();
                }
            }, updateFrequency);

            this.log('info', 'Atualizações de dados iniciadas');
        },

        /**
         * Para atualizações de dados
         */
        stopDataUpdates: function() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            this.log('info', 'Atualizações de dados paradas');
        },

        /**
         * Lê múltiplos dispositivos em batch
         */
        readBatch: function() {
            $.ajax({
                url: this.config.apiUrl + 'read/batch',
                method: 'POST',
                headers: {
                    'X-WP-Nonce': this.config.nonce
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    devices: [
                        { type: 'D', address: 0, count: 10 },
                        { type: 'M', address: 0, count: 16 }
                    ]
                }),
                success: (response) => {
                    if (response.success) {
                        this.handlePlcData(response.data);
                    }
                },
                error: () => {
                    // Silencioso - não logar cada erro para não poluir
                }
            });
        },

        /**
         * Processa dados do PLC
         */
        handlePlcData: function(data) {
            // Adicionar ao buffer
            this.dataBuffer.push({
                timestamp: Date.now(),
                data: data
            });

            // Limitar buffer
            if (this.dataBuffer.length > this.maxBufferSize) {
                this.dataBuffer.shift();
            }

            // Atualizar UI
            if (data.D) {
                this.updateRegisterList('plc-d-register-list', data.D, 'D');
                this.updateRealtimeChart(data.D);
            }

            if (data.M) {
                this.updateRegisterList('plc-m-bit-list', data.M, 'M');
            }

            // Atualizar estatísticas
            const deviceCount = (data.D ? Object.keys(data.D).length : 0) +
                              (data.M ? Object.keys(data.M).length : 0);
            $('#plc-device-count').text(deviceCount);

            this.updateStatistics();
        },

        /**
         * Atualiza lista de registros
         */
        updateRegisterList: function(elementId, registers, type) {
            const listElement = $('#' + elementId);

            if (!registers || Object.keys(registers).length === 0) {
                listElement.html('<p class="placeholder">Nenhum dado disponível</p>');
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

            listElement.html(html);
        },

        /**
         * Inicializa gráficos Chart.js
         */
        initializeCharts: function() {
            // Gráfico em tempo real
            const realtimeCtx = document.getElementById('plc-realtime-chart');
            if (realtimeCtx) {
                this.charts.realtime = new Chart(realtimeCtx.getContext('2d'), {
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
                            legend: { display: true }
                        },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });
            }

            // Gráfico de tendência
            const trendCtx = document.getElementById('plc-trend-chart');
            if (trendCtx) {
                this.charts.trend = new Chart(trendCtx.getContext('2d'), {
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
                            legend: { display: false }
                        },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });
            }
        },

        /**
         * Atualiza gráfico em tempo real
         */
        updateRealtimeChart: function(data) {
            if (!this.charts.realtime) return;

            const chart = this.charts.realtime;
            const timestamp = new Date().toLocaleTimeString();

            // Adicionar timestamp
            chart.data.labels.push(timestamp);
            if (chart.data.labels.length > this.maxDataPoints) {
                chart.data.labels.shift();
            }

            // Atualizar datasets
            chart.data.datasets[0].data.push(data['0'] || 0);
            chart.data.datasets[1].data.push(data['1'] || 0);

            // Limitar pontos
            chart.data.datasets.forEach(dataset => {
                if (dataset.data.length > this.maxDataPoints) {
                    dataset.data.shift();
                }
            });

            chart.update('none');
        },

        /**
         * Atualiza estatísticas
         */
        updateStatistics: function() {
            if (this.dataBuffer.length >= 2) {
                const last = this.dataBuffer[this.dataBuffer.length - 1].timestamp;
                const prev = this.dataBuffer[this.dataBuffer.length - 2].timestamp;
                const rate = last - prev;
                $('#plc-update-rate').text(`${rate} ms`);
            }

            // Atualizar gráfico de tendência
            if (this.charts.trend && this.dataBuffer.length > 0) {
                const averages = this.calculateAverages();
                this.charts.trend.data.datasets[0].data = averages;
                this.charts.trend.update('none');
            }
        },

        /**
         * Calcula médias
         */
        calculateAverages: function() {
            const sums = [0, 0, 0, 0, 0];
            const counts = [0, 0, 0, 0, 0];

            this.dataBuffer.forEach(item => {
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
        },

        /**
         * Inicia análise IA
         */
        startAI: function() {
            const model = $('#plc-ai-model').val();
            $('#plc-ai-status').text('Analisando');
            $('#plc-ai-start-btn').prop('disabled', true);
            $('#plc-ai-stop-btn').prop('disabled', false);
            this.log('info', `Análise ${model} iniciada`);

            // Implementação simplificada
            // Para análise IA completa, integrar com Transformers.js
            // (similar ao frontend/js/ai-analysis.js)
        },

        /**
         * Para análise IA
         */
        stopAI: function() {
            $('#plc-ai-status').text('Parado');
            $('#plc-ai-start-btn').prop('disabled', false);
            $('#plc-ai-stop-btn').prop('disabled', true);
            this.log('info', 'Análise parada');
        },

        /**
         * Adiciona mensagem ao log
         */
        log: function(type, message) {
            const logContainer = $('#plc-log-container');
            const timestamp = new Date().toLocaleTimeString();

            const entry = $('<p></p>')
                .addClass(`log-entry ${type}`)
                .text(`[${timestamp}] ${message}`);

            logContainer.append(entry);

            // Auto-scroll
            logContainer[0].scrollTop = logContainer[0].scrollHeight;

            // Limitar entradas
            const entries = logContainer.find('.log-entry');
            if (entries.length > 100) {
                entries.first().remove();
            }
        },

        /**
         * Limpa log
         */
        clearLog: function() {
            $('#plc-log-container').html('<p class="log-entry">Log limpo...</p>');
        }
    };

    // Inicializar quando DOM estiver pronto
    $(document).ready(function() {
        PLCDashboard.init();
    });

    // Expor globalmente
    window.PLCDashboard = PLCDashboard;

})(jQuery);
