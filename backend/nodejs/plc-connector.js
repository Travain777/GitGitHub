/**
 * PLC Connector - Comunicação com PLC Mitsubishi Q06UDVCPU
 * Implementa MC Protocol (MELSEC Communication Protocol) via TCP/IP
 */

const net = require('net');
const EventEmitter = require('events');

class PLCConnector extends EventEmitter {
    constructor() {
        super();
        this.socket = null;
        this.connected = false;
        this.plcIp = null;
        this.plcPort = 5000; // Porta padrão MC Protocol
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.requestId = 0;
        this.pendingRequests = new Map();
        this.readInterval = null;
        this.continuousReadConfig = null;
    }

    /**
     * Conecta ao PLC
     */
    connect(ip, port = 5000) {
        return new Promise((resolve, reject) => {
            this.plcIp = ip;
            this.plcPort = port;

            console.log(`[PLC] Conectando a ${ip}:${port}...`);

            this.socket = new net.Socket();

            // Timeout de conexão
            this.socket.setTimeout(10000);

            this.socket.connect(port, ip, () => {
                this.connected = true;
                this.reconnectAttempts = 0;
                console.log(`[PLC] Conectado a ${ip}:${port}`);
                this.emit('connected', { ip, port });
                resolve();
            });

            this.socket.on('data', (data) => {
                this.handleResponse(data);
            });

            this.socket.on('error', (error) => {
                console.error('[PLC] Erro:', error.message);
                this.emit('error', error);
                reject(error);
            });

            this.socket.on('timeout', () => {
                console.error('[PLC] Timeout de conexão');
                this.socket.destroy();
                reject(new Error('Connection timeout'));
            });

            this.socket.on('close', () => {
                this.connected = false;
                console.log('[PLC] Conexão fechada');
                this.emit('disconnected');
                this.attemptReconnect();
            });
        });
    }

    /**
     * Desconecta do PLC
     */
    disconnect() {
        this.stopContinuousRead();

        if (this.socket) {
            this.reconnectAttempts = this.maxReconnectAttempts; // Prevenir reconexão
            this.socket.destroy();
            this.socket = null;
            this.connected = false;
            console.log('[PLC] Desconectado');
        }
    }

    /**
     * Tenta reconectar
     */
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[PLC] Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

            setTimeout(() => {
                this.connect(this.plcIp, this.plcPort).catch(error => {
                    console.error('[PLC] Erro na reconexão:', error.message);
                });
            }, this.reconnectDelay);
        } else {
            console.error('[PLC] Número máximo de tentativas de reconexão atingido');
        }
    }

    /**
     * Cria frame MC Protocol (3E Frame)
     */
    createMCFrame(command, subcommand, data = Buffer.alloc(0)) {
        // MC Protocol 3E Frame Format
        const subheader = Buffer.from([0x50, 0x00]); // Subheader (padrão)
        const networkNo = Buffer.from([0x00]); // Network number
        const pcNo = Buffer.from([0xFF]); // PC number
        const destModuleIo = Buffer.from([0xFF, 0x03]); // Destination module I/O number
        const destModuleStation = Buffer.from([0x00]); // Destination module station number

        const dataLength = Buffer.alloc(2);
        dataLength.writeUInt16LE(data.length + 6); // 6 = command(2) + subcommand(2) + data

        const cmdBuffer = Buffer.alloc(2);
        cmdBuffer.writeUInt16LE(command);

        const subcmdBuffer = Buffer.alloc(2);
        subcmdBuffer.writeUInt16LE(subcommand);

        // Montar frame
        return Buffer.concat([
            subheader,
            networkNo,
            pcNo,
            destModuleIo,
            destModuleStation,
            dataLength,
            Buffer.from([0x00, 0x00]), // Monitoring timer (padrão)
            cmdBuffer,
            subcmdBuffer,
            data
        ]);
    }

    /**
     * Lê registros D (Data Registers)
     */
    async readDRegister(address, count = 1) {
        if (!this.connected) {
            throw new Error('Não conectado ao PLC');
        }

        // Comando: Batch Read (0x0401)
        const command = 0x0401;
        const subcommand = 0x0000;

        // Dados do comando
        const data = Buffer.alloc(12);

        // Device code para D Register (0xA8)
        data.writeUInt8(0xA8, 0);

        // Address (3 bytes, little endian em BCD)
        const addressBCD = this.decimalToBCD(address);
        data.writeUIntLE(addressBCD, 1, 3);

        // Device points (quantidade)
        data.writeUInt16LE(count, 4);

        const frame = this.createMCFrame(command, subcommand, data);

        return this.sendRequest(frame);
    }

    /**
     * Lê bits M (Memory Bits)
     */
    async readMBit(address, count = 1) {
        if (!this.connected) {
            throw new Error('Não conectado ao PLC');
        }

        const command = 0x0401;
        const subcommand = 0x0000;

        const data = Buffer.alloc(12);

        // Device code para M Bit (0x90)
        data.writeUInt8(0x90, 0);

        const addressBCD = this.decimalToBCD(address);
        data.writeUIntLE(addressBCD, 1, 3);

        data.writeUInt16LE(count, 4);

        const frame = this.createMCFrame(command, subcommand, data);

        return this.sendRequest(frame);
    }

    /**
     * Escreve em registro D
     */
    async writeDRegister(address, value) {
        if (!this.connected) {
            throw new Error('Não conectado ao PLC');
        }

        // Comando: Batch Write (0x1401)
        const command = 0x1401;
        const subcommand = 0x0000;

        const data = Buffer.alloc(14);

        // Device code
        data.writeUInt8(0xA8, 0);

        // Address
        const addressBCD = this.decimalToBCD(address);
        data.writeUIntLE(addressBCD, 1, 3);

        // Device points
        data.writeUInt16LE(1, 4);

        // Value
        data.writeUInt16LE(value, 6);

        const frame = this.createMCFrame(command, subcommand, data);

        return this.sendRequest(frame);
    }

    /**
     * Escreve em bit M
     */
    async writeMBit(address, value) {
        if (!this.connected) {
            throw new Error('Não conectado ao PLC');
        }

        const command = 0x1401;
        const subcommand = 0x0000;

        const data = Buffer.alloc(14);

        // Device code
        data.writeUInt8(0x90, 0);

        // Address
        const addressBCD = this.decimalToBCD(address);
        data.writeUIntLE(addressBCD, 1, 3);

        // Device points
        data.writeUInt16LE(1, 4);

        // Value (0 ou 1)
        data.writeUInt16LE(value ? 1 : 0, 6);

        const frame = this.createMCFrame(command, subcommand, data);

        return this.sendRequest(frame);
    }

    /**
     * Envia requisição e aguarda resposta
     */
    sendRequest(frame) {
        return new Promise((resolve, reject) => {
            const requestId = this.requestId++;

            // Timeout de 5 segundos
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error('Request timeout'));
            }, 5000);

            this.pendingRequests.set(requestId, { resolve, reject, timeout });

            this.socket.write(frame, (error) => {
                if (error) {
                    clearTimeout(timeout);
                    this.pendingRequests.delete(requestId);
                    reject(error);
                }
            });
        });
    }

    /**
     * Processa resposta do PLC
     */
    handleResponse(data) {
        try {
            // Verificar código de resposta
            const responseCode = data.readUInt16LE(9);

            if (responseCode !== 0) {
                console.error(`[PLC] Erro na resposta: ${responseCode.toString(16)}`);
                this.rejectAllPending(new Error(`PLC Error: ${responseCode.toString(16)}`));
                return;
            }

            // Extrair dados da resposta (pula os 11 bytes de cabeçalho)
            const responseData = data.slice(11);

            // Resolver requisição pendente (simplificado - pega a primeira)
            const [requestId, pending] = this.pendingRequests.entries().next().value || [];

            if (pending) {
                clearTimeout(pending.timeout);
                this.pendingRequests.delete(requestId);
                pending.resolve(responseData);
            }

        } catch (error) {
            console.error('[PLC] Erro ao processar resposta:', error);
            this.rejectAllPending(error);
        }
    }

    /**
     * Rejeita todas as requisições pendentes
     */
    rejectAllPending(error) {
        this.pendingRequests.forEach(pending => {
            clearTimeout(pending.timeout);
            pending.reject(error);
        });
        this.pendingRequests.clear();
    }

    /**
     * Converte decimal para BCD
     */
    decimalToBCD(decimal) {
        let bcd = 0;
        let shift = 0;

        while (decimal > 0) {
            bcd |= (decimal % 10) << shift;
            decimal = Math.floor(decimal / 10);
            shift += 4;
        }

        return bcd;
    }

    /**
     * Inicia leitura contínua
     */
    startContinuousRead(registers, interval = 1000) {
        this.stopContinuousRead();

        this.continuousReadConfig = registers;

        console.log('[PLC] Iniciando leitura contínua...');

        this.readInterval = setInterval(async () => {
            try {
                const data = {};

                for (const reg of registers) {
                    if (reg.type === 'D') {
                        const response = await this.readDRegister(reg.address, reg.count);
                        data.D = this.parseRegisterData(response, reg.count);
                    } else if (reg.type === 'M') {
                        const response = await this.readMBit(reg.address, reg.count);
                        data.M = this.parseBitData(response, reg.count);
                    }
                }

                this.emit('data', data);

            } catch (error) {
                console.error('[PLC] Erro na leitura contínua:', error.message);
            }
        }, interval);
    }

    /**
     * Para leitura contínua
     */
    stopContinuousRead() {
        if (this.readInterval) {
            clearInterval(this.readInterval);
            this.readInterval = null;
            console.log('[PLC] Leitura contínua parada');
        }
    }

    /**
     * Parse dados de registro
     */
    parseRegisterData(buffer, count) {
        const data = {};

        for (let i = 0; i < count; i++) {
            data[i] = buffer.readUInt16LE(i * 2);
        }

        return data;
    }

    /**
     * Parse dados de bit
     */
    parseBitData(buffer, count) {
        const data = {};

        for (let i = 0; i < count; i++) {
            const byteIndex = Math.floor(i / 8);
            const bitIndex = i % 8;
            data[i] = (buffer[byteIndex] >> bitIndex) & 1;
        }

        return data;
    }

    /**
     * Verifica se está conectado
     */
    isConnected() {
        return this.connected;
    }
}

module.exports = PLCConnector;
