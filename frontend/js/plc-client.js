/**
 * Cliente PLC - Gerencia comunicação com o PLC Mitsubishi Q06UDVCPU
 * Via WebSocket para o backend
 */

class PLCClient {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.plcIp = '192.168.0.1';
        this.plcPort = 5000;
        this.backendUrl = 'ws://localhost:3000'; // Backend Node.js
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.dataBuffer = [];
        this.maxBufferSize = 1000;
        this.listeners = new Map();
    }

    /**
     * Conecta ao backend WebSocket
     */
    connect(plcIp, plcPort) {
        this.plcIp = plcIp;
        this.plcPort = plcPort;

        try {
            this.log('info', `Conectando ao backend WebSocket: ${this.backendUrl}`);

            this.ws = new WebSocket(this.backendUrl);

            this.ws.onopen = () => {
                this.connected = true;
                this.reconnectAttempts = 0;
                this.log('success', 'Conectado ao backend WebSocket');

                // Enviar configuração do PLC
                this.sendCommand('configure', {
                    plcIp: this.plcIp,
                    plcPort: this.plcPort
                });

                this.emit('connected');
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onerror = (error) => {
                this.log('error', `Erro WebSocket: ${error.message || 'Desconhecido'}`);
                this.emit('error', error);
            };

            this.ws.onclose = () => {
                this.connected = false;
                this.log('warning', 'Conexão WebSocket fechada');
                this.emit('disconnected');
                this.attemptReconnect();
            };

        } catch (error) {
            this.log('error', `Erro ao conectar: ${error.message}`);
            this.emit('error', error);
        }
    }

    /**
     * Desconecta do backend
     */
    disconnect() {
        if (this.ws) {
            this.reconnectAttempts = this.maxReconnectAttempts; // Prevenir reconexão automática
            this.ws.close();
            this.ws = null;
            this.connected = false;
            this.log('info', 'Desconectado do backend');
        }
    }

    /**
     * Tenta reconectar automaticamente
     */
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.log('warning', `Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

            setTimeout(() => {
                this.connect(this.plcIp, this.plcPort);
            }, this.reconnectDelay);
        } else {
            this.log('error', 'Número máximo de tentativas de reconexão atingido');
        }
    }

    /**
     * Processa mensagens recebidas do backend
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'plc_data':
                    this.handlePlcData(message.data);
                    break;

                case 'plc_connected':
                    this.log('success', `Conectado ao PLC ${message.plcIp}:${message.plcPort}`);
                    this.emit('plc_connected', message);
                    break;

                case 'plc_disconnected':
                    this.log('warning', 'Desconectado do PLC');
                    this.emit('plc_disconnected');
                    break;

                case 'error':
                    this.log('error', `Erro do PLC: ${message.message}`);
                    this.emit('error', message);
                    break;

                case 'status':
                    this.emit('status', message.data);
                    break;

                default:
                    console.log('Mensagem desconhecida:', message);
            }
        } catch (error) {
            this.log('error', `Erro ao processar mensagem: ${error.message}`);
        }
    }

    /**
     * Processa dados do PLC
     */
    handlePlcData(data) {
        // Adicionar ao buffer
        this.dataBuffer.push({
            timestamp: Date.now(),
            data: data
        });

        // Limitar tamanho do buffer
        if (this.dataBuffer.length > this.maxBufferSize) {
            this.dataBuffer.shift();
        }

        // Emitir evento para listeners
        this.emit('data', data);
    }

    /**
     * Envia comando para o backend
     */
    sendCommand(command, data = {}) {
        if (!this.connected || !this.ws) {
            this.log('error', 'Não conectado ao backend');
            return false;
        }

        try {
            const message = JSON.stringify({
                command: command,
                ...data
            });

            this.ws.send(message);
            return true;
        } catch (error) {
            this.log('error', `Erro ao enviar comando: ${error.message}`);
            return false;
        }
    }

    /**
     * Lê um registro D do PLC
     */
    readDRegister(address, count = 1) {
        return this.sendCommand('read', {
            type: 'D',
            address: address,
            count: count
        });
    }

    /**
     * Lê um bit M do PLC
     */
    readMBit(address, count = 1) {
        return this.sendCommand('read', {
            type: 'M',
            address: address,
            count: count
        });
    }

    /**
     * Escreve em um registro D do PLC
     */
    writeDRegister(address, value) {
        return this.sendCommand('write', {
            type: 'D',
            address: address,
            value: value
        });
    }

    /**
     * Escreve em um bit M do PLC
     */
    writeMBit(address, value) {
        return this.sendCommand('write', {
            type: 'M',
            address: address,
            value: value ? 1 : 0
        });
    }

    /**
     * Inicia leitura contínua
     */
    startContinuousRead(registers) {
        return this.sendCommand('start_continuous', {
            registers: registers
        });
    }

    /**
     * Para leitura contínua
     */
    stopContinuousRead() {
        return this.sendCommand('stop_continuous');
    }

    /**
     * Obtém buffer de dados
     */
    getDataBuffer() {
        return this.dataBuffer;
    }

    /**
     * Limpa buffer de dados
     */
    clearDataBuffer() {
        this.dataBuffer = [];
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
     * Remove listener
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emite evento para listeners
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

        // Emitir para sistema de log
        this.emit('log', { type, message: logMessage });

        // Console log
        console.log(`[PLCClient] ${logMessage}`);
    }

    /**
     * Verifica se está conectado
     */
    isConnected() {
        return this.connected;
    }

    /**
     * Obtém status da conexão
     */
    getStatus() {
        return {
            connected: this.connected,
            plcIp: this.plcIp,
            plcPort: this.plcPort,
            backendUrl: this.backendUrl,
            bufferSize: this.dataBuffer.length
        };
    }
}

// Exportar para uso global
window.PLCClient = PLCClient;
