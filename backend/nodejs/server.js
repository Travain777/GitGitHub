/**
 * Servidor WebSocket para comunicação com PLC Mitsubishi
 * Conecta frontend ao PLC via MC Protocol
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const PLCConnector = require('./plc-connector');

// Configuração
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Instância do conector PLC
let plcConnector = null;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Rota de health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        plcConnected: plcConnector ? plcConnector.isConnected() : false,
        clients: wss.clients.size
    });
});

// Rota de informações
app.get('/', (req, res) => {
    res.json({
        name: 'PLC Mitsubishi Q06UDVCPU Backend',
        version: '1.0.0',
        endpoints: {
            websocket: `ws://localhost:${PORT}`,
            health: '/health',
            info: '/'
        },
        plcStatus: plcConnector ? plcConnector.isConnected() : false,
        connectedClients: wss.clients.size
    });
});

// WebSocket Connection Handler
wss.on('connection', (ws) => {
    console.log('[WebSocket] Cliente conectado');

    // Enviar mensagem de boas-vindas
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'Conectado ao servidor WebSocket'
    }));

    // Handler de mensagens do cliente
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            await handleClientMessage(ws, data);
        } catch (error) {
            console.error('[WebSocket] Erro ao processar mensagem:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: error.message
            }));
        }
    });

    // Handler de desconexão
    ws.on('close', () => {
        console.log('[WebSocket] Cliente desconectado');

        // Se não há mais clientes, desconectar do PLC
        if (wss.clients.size === 0 && plcConnector) {
            console.log('[PLC] Desconectando (nenhum cliente conectado)');
            plcConnector.disconnect();
            plcConnector = null;
        }
    });

    // Handler de erro
    ws.on('error', (error) => {
        console.error('[WebSocket] Erro:', error);
    });
});

/**
 * Processa mensagens do cliente
 */
async function handleClientMessage(ws, data) {
    const { command } = data;

    switch (command) {
        case 'configure':
            await handleConfigure(ws, data);
            break;

        case 'read':
            await handleRead(ws, data);
            break;

        case 'write':
            await handleWrite(ws, data);
            break;

        case 'start_continuous':
            await handleStartContinuous(ws, data);
            break;

        case 'stop_continuous':
            await handleStopContinuous(ws);
            break;

        case 'status':
            handleStatus(ws);
            break;

        default:
            throw new Error(`Comando desconhecido: ${command}`);
    }
}

/**
 * Configura e conecta ao PLC
 */
async function handleConfigure(ws, data) {
    try {
        const { plcIp, plcPort } = data;

        if (!plcIp) {
            throw new Error('IP do PLC não fornecido');
        }

        console.log(`[PLC] Configurando conexão: ${plcIp}:${plcPort || 5000}`);

        // Criar nova instância do conector
        if (plcConnector) {
            plcConnector.disconnect();
        }

        plcConnector = new PLCConnector();

        // Configurar listeners do PLC
        setupPLCListeners(ws);

        // Conectar ao PLC
        await plcConnector.connect(plcIp, plcPort || 5000);

        ws.send(JSON.stringify({
            type: 'plc_connected',
            plcIp: plcIp,
            plcPort: plcPort || 5000
        }));

    } catch (error) {
        console.error('[PLC] Erro na configuração:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: `Erro ao conectar ao PLC: ${error.message}`
        }));
    }
}

/**
 * Configura listeners do PLC
 */
function setupPLCListeners(ws) {
    plcConnector.on('connected', (info) => {
        console.log(`[PLC] Conectado a ${info.ip}:${info.port}`);
    });

    plcConnector.on('disconnected', () => {
        console.log('[PLC] Desconectado');
        broadcast({
            type: 'plc_disconnected'
        });
    });

    plcConnector.on('error', (error) => {
        console.error('[PLC] Erro:', error);
        broadcast({
            type: 'error',
            message: error.message
        });
    });

    plcConnector.on('data', (data) => {
        broadcast({
            type: 'plc_data',
            data: data
        });
    });
}

/**
 * Lê dados do PLC
 */
async function handleRead(ws, data) {
    try {
        if (!plcConnector || !plcConnector.isConnected()) {
            throw new Error('PLC não conectado');
        }

        const { type, address, count } = data;

        let result;

        if (type === 'D') {
            const response = await plcConnector.readDRegister(address, count || 1);
            result = plcConnector.parseRegisterData(response, count || 1);
        } else if (type === 'M') {
            const response = await plcConnector.readMBit(address, count || 1);
            result = plcConnector.parseBitData(response, count || 1);
        } else {
            throw new Error(`Tipo de dispositivo desconhecido: ${type}`);
        }

        ws.send(JSON.stringify({
            type: 'read_response',
            deviceType: type,
            address: address,
            data: result
        }));

    } catch (error) {
        console.error('[PLC] Erro na leitura:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: `Erro ao ler do PLC: ${error.message}`
        }));
    }
}

/**
 * Escreve dados no PLC
 */
async function handleWrite(ws, data) {
    try {
        if (!plcConnector || !plcConnector.isConnected()) {
            throw new Error('PLC não conectado');
        }

        const { type, address, value } = data;

        if (type === 'D') {
            await plcConnector.writeDRegister(address, value);
        } else if (type === 'M') {
            await plcConnector.writeMBit(address, value);
        } else {
            throw new Error(`Tipo de dispositivo desconhecido: ${type}`);
        }

        ws.send(JSON.stringify({
            type: 'write_response',
            deviceType: type,
            address: address,
            success: true
        }));

        console.log(`[PLC] Escrito ${type}${address} = ${value}`);

    } catch (error) {
        console.error('[PLC] Erro na escrita:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: `Erro ao escrever no PLC: ${error.message}`
        }));
    }
}

/**
 * Inicia leitura contínua
 */
async function handleStartContinuous(ws, data) {
    try {
        if (!plcConnector || !plcConnector.isConnected()) {
            throw new Error('PLC não conectado');
        }

        const { registers } = data;

        if (!registers || !Array.isArray(registers)) {
            throw new Error('Configuração de registros inválida');
        }

        plcConnector.startContinuousRead(registers, 1000);

        ws.send(JSON.stringify({
            type: 'continuous_started',
            registers: registers
        }));

        console.log('[PLC] Leitura contínua iniciada');

    } catch (error) {
        console.error('[PLC] Erro ao iniciar leitura contínua:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: `Erro ao iniciar leitura contínua: ${error.message}`
        }));
    }
}

/**
 * Para leitura contínua
 */
async function handleStopContinuous(ws) {
    try {
        if (!plcConnector) {
            throw new Error('PLC não configurado');
        }

        plcConnector.stopContinuousRead();

        ws.send(JSON.stringify({
            type: 'continuous_stopped'
        }));

        console.log('[PLC] Leitura contínua parada');

    } catch (error) {
        console.error('[PLC] Erro ao parar leitura contínua:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: `Erro ao parar leitura contínua: ${error.message}`
        }));
    }
}

/**
 * Retorna status do sistema
 */
function handleStatus(ws) {
    ws.send(JSON.stringify({
        type: 'status',
        data: {
            plcConnected: plcConnector ? plcConnector.isConnected() : false,
            clients: wss.clients.size,
            uptime: process.uptime()
        }
    }));
}

/**
 * Envia mensagem para todos os clientes conectados
 */
function broadcast(message) {
    const data = JSON.stringify(message);

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// Iniciar servidor
server.listen(PORT, () => {
    console.log('===========================================');
    console.log('  PLC Mitsubishi Q06UDVCPU Backend Server');
    console.log('===========================================');
    console.log(`HTTP Server: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
    console.log('===========================================');
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('[Server] Exceção não capturada:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('[Server] Promise rejection não tratada:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[Server] Encerrando servidor...');

    if (plcConnector) {
        plcConnector.disconnect();
    }

    server.close(() => {
        console.log('[Server] Servidor encerrado');
        process.exit(0);
    });
});
