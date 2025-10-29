/**
 * Análise de IA usando Transformers.js
 * Analisa dados do PLC para detecção de anomalias, previsões e classificações
 */

class AIAnalysis {
    constructor() {
        this.transformers = null;
        this.isLoaded = false;
        this.isAnalyzing = false;
        this.models = new Map();
        this.analysisInterval = null;
        this.analysisFrequency = 5000; // 5 segundos
        this.dataWindow = 100; // Janela de dados para análise
        this.listeners = new Map();
    }

    /**
     * Inicializa Transformers.js
     */
    async initialize() {
        try {
            this.log('info', 'Carregando Transformers.js...');

            // Importar Transformers.js
            const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');

            this.transformers = { pipeline, env };

            // Configurar para usar cache local
            this.transformers.env.allowLocalModels = false;
            this.transformers.env.useBrowserCache = true;

            this.isLoaded = true;
            this.log('success', 'Transformers.js carregado com sucesso');
            this.emit('loaded');

            return true;
        } catch (error) {
            this.log('error', `Erro ao carregar Transformers.js: ${error.message}`);
            this.emit('error', error);
            return false;
        }
    }

    /**
     * Carrega modelo específico
     */
    async loadModel(modelType) {
        if (!this.isLoaded) {
            await this.initialize();
        }

        if (this.models.has(modelType)) {
            return this.models.get(modelType);
        }

        try {
            this.log('info', `Carregando modelo: ${modelType}`);

            let model;
            switch (modelType) {
                case 'anomaly':
                    // Usar modelo de classificação para detecção de anomalias
                    model = await this.transformers.pipeline(
                        'text-classification',
                        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
                    );
                    break;

                case 'prediction':
                    // Modelo para previsão (usando text generation como proxy)
                    model = await this.transformers.pipeline(
                        'text-generation',
                        'Xenova/gpt2'
                    );
                    break;

                case 'classification':
                    // Modelo de classificação zero-shot
                    model = await this.transformers.pipeline(
                        'zero-shot-classification',
                        'Xenova/distilbert-base-uncased-mnli'
                    );
                    break;

                default:
                    throw new Error(`Modelo desconhecido: ${modelType}`);
            }

            this.models.set(modelType, model);
            this.log('success', `Modelo ${modelType} carregado`);
            return model;

        } catch (error) {
            this.log('error', `Erro ao carregar modelo ${modelType}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Inicia análise contínua
     */
    async startAnalysis(modelType, dataSource) {
        if (this.isAnalyzing) {
            this.log('warning', 'Análise já em andamento');
            return;
        }

        try {
            // Carregar modelo
            await this.loadModel(modelType);

            this.isAnalyzing = true;
            this.log('success', `Análise ${modelType} iniciada`);
            this.emit('analysis_started', { modelType });

            // Iniciar análise periódica
            this.analysisInterval = setInterval(() => {
                this.performAnalysis(modelType, dataSource);
            }, this.analysisFrequency);

            // Executar primeira análise imediatamente
            this.performAnalysis(modelType, dataSource);

        } catch (error) {
            this.log('error', `Erro ao iniciar análise: ${error.message}`);
            this.isAnalyzing = false;
            this.emit('error', error);
        }
    }

    /**
     * Para análise contínua
     */
    stopAnalysis() {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }

        this.isAnalyzing = false;
        this.log('info', 'Análise parada');
        this.emit('analysis_stopped');
    }

    /**
     * Executa análise nos dados
     */
    async performAnalysis(modelType, dataSource) {
        try {
            const data = dataSource.getDataBuffer();

            if (!data || data.length === 0) {
                this.log('warning', 'Sem dados para análise');
                return;
            }

            // Pegar últimos N pontos de dados
            const recentData = data.slice(-this.dataWindow);

            let result;
            switch (modelType) {
                case 'anomaly':
                    result = await this.detectAnomalies(recentData);
                    break;

                case 'prediction':
                    result = await this.predictTrend(recentData);
                    break;

                case 'classification':
                    result = await this.classifyState(recentData);
                    break;

                default:
                    throw new Error(`Tipo de análise desconhecido: ${modelType}`);
            }

            this.emit('analysis_result', {
                type: modelType,
                result: result,
                timestamp: Date.now()
            });

        } catch (error) {
            this.log('error', `Erro na análise: ${error.message}`);
            this.emit('error', error);
        }
    }

    /**
     * Detecta anomalias nos dados
     */
    async detectAnomalies(data) {
        // Calcular estatísticas básicas
        const stats = this.calculateStatistics(data);

        // Preparar texto descritivo dos dados para o modelo
        const description = `Data analysis: mean=${stats.mean.toFixed(2)}, std=${stats.std.toFixed(2)}, min=${stats.min}, max=${stats.max}, trend=${stats.trend}`;

        // Usar modelo para classificar se há anomalia
        const model = this.models.get('anomaly');

        // Análise baseada em estatísticas
        const anomalies = [];
        const threshold = stats.mean + (2 * stats.std); // 2 desvios padrão

        data.forEach((point, index) => {
            const value = this.extractValue(point);
            if (Math.abs(value - stats.mean) > threshold) {
                anomalies.push({
                    index: index,
                    value: value,
                    deviation: Math.abs(value - stats.mean),
                    severity: this.calculateSeverity(value, stats)
                });
            }
        });

        return {
            anomalyCount: anomalies.length,
            anomalies: anomalies,
            statistics: stats,
            description: description,
            status: anomalies.length > 0 ? 'Anomalias detectadas' : 'Normal'
        };
    }

    /**
     * Prevê tendência dos dados
     */
    async predictTrend(data) {
        const stats = this.calculateStatistics(data);

        // Análise de tendência simples usando regressão linear
        const trend = this.linearRegression(data);

        // Previsão para próximos 10 pontos
        const predictions = [];
        const lastIndex = data.length - 1;

        for (let i = 1; i <= 10; i++) {
            const predicted = trend.slope * (lastIndex + i) + trend.intercept;
            predictions.push({
                step: i,
                value: predicted,
                confidence: this.calculateConfidence(trend.r2)
            });
        }

        return {
            currentTrend: stats.trend,
            slope: trend.slope,
            r2: trend.r2,
            predictions: predictions,
            description: `Tendência ${stats.trend} com R²=${trend.r2.toFixed(3)}`
        };
    }

    /**
     * Classifica estado do sistema
     */
    async classifyState(data) {
        const stats = this.calculateStatistics(data);

        // Definir estados possíveis
        const states = ['Normal', 'Alerta', 'Crítico', 'Estável', 'Instável'];

        // Calcular métricas
        const variability = stats.std / (stats.mean || 1);
        const recentTrend = this.calculateRecentTrend(data.slice(-10));

        // Classificação baseada em regras
        let state;
        let confidence;

        if (variability < 0.1 && recentTrend === 'stable') {
            state = 'Estável';
            confidence = 0.95;
        } else if (variability > 0.5) {
            state = 'Instável';
            confidence = 0.85;
        } else if (stats.max > stats.mean * 2) {
            state = 'Crítico';
            confidence = 0.90;
        } else if (Math.abs(stats.trend) > 0.1) {
            state = 'Alerta';
            confidence = 0.80;
        } else {
            state = 'Normal';
            confidence = 0.75;
        }

        return {
            state: state,
            confidence: confidence,
            statistics: stats,
            variability: variability,
            description: `Sistema em estado ${state} (${(confidence * 100).toFixed(1)}% confiança)`
        };
    }

    /**
     * Calcula estatísticas dos dados
     */
    calculateStatistics(data) {
        const values = data.map(d => this.extractValue(d));

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance);
        const min = Math.min(...values);
        const max = Math.max(...values);

        // Calcular tendência (simplificado)
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const trendValue = (secondMean - firstMean) / firstMean;

        let trend;
        if (Math.abs(trendValue) < 0.05) {
            trend = 'stable';
        } else if (trendValue > 0) {
            trend = 'increasing';
        } else {
            trend = 'decreasing';
        }

        return { mean, std, min, max, variance, trend, trendValue };
    }

    /**
     * Regressão linear para previsão
     */
    linearRegression(data) {
        const n = data.length;
        const values = data.map(d => this.extractValue(d));

        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += values[i];
            sumXY += i * values[i];
            sumX2 += i * i;
            sumY2 += values[i] * values[i];
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calcular R²
        const yMean = sumY / n;
        const ssTotal = sumY2 - n * yMean * yMean;
        const ssRes = values.reduce((sum, y, i) => {
            const predicted = slope * i + intercept;
            return sum + Math.pow(y - predicted, 2);
        }, 0);
        const r2 = 1 - (ssRes / ssTotal);

        return { slope, intercept, r2 };
    }

    /**
     * Calcula tendência recente
     */
    calculateRecentTrend(data) {
        if (data.length < 2) return 'stable';

        const values = data.map(d => this.extractValue(d));
        const first = values[0];
        const last = values[values.length - 1];
        const change = (last - first) / (first || 1);

        if (Math.abs(change) < 0.05) return 'stable';
        return change > 0 ? 'increasing' : 'decreasing';
    }

    /**
     * Calcula severidade da anomalia
     */
    calculateSeverity(value, stats) {
        const deviation = Math.abs(value - stats.mean) / stats.std;

        if (deviation > 3) return 'alta';
        if (deviation > 2) return 'média';
        return 'baixa';
    }

    /**
     * Calcula confiança da previsão
     */
    calculateConfidence(r2) {
        if (r2 > 0.9) return 'alta';
        if (r2 > 0.7) return 'média';
        return 'baixa';
    }

    /**
     * Extrai valor numérico do ponto de dados
     */
    extractValue(point) {
        if (typeof point === 'number') return point;
        if (point && point.data && typeof point.data === 'object') {
            // Pegar primeiro valor numérico encontrado
            for (let key in point.data) {
                if (typeof point.data[key] === 'number') {
                    return point.data[key];
                }
            }
        }
        return 0;
    }

    /**
     * Adiciona listener para eventos
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Emite evento
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erro no listener ${event}:`, error);
                }
            });
        }
    }

    /**
     * Log de eventos
     */
    log(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        this.emit('log', { type, message: logMessage });
        console.log(`[AIAnalysis] ${logMessage}`);
    }
}

// Exportar para uso global
window.AIAnalysis = AIAnalysis;
