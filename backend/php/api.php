<?php
/**
 * API PHP para comunicação com PLC Mitsubishi Q06UDVCPU
 * Alternativa para uso em servidores Hostinger/WordPress
 *
 * USO: Este arquivo pode ser colocado em um servidor PHP comum ou WordPress
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Carregar biblioteca de conexão PLC
require_once 'plc-bridge.php';

// Configuração
define('PLC_IP', '192.168.0.1'); // IP padrão do PLC
define('PLC_PORT', 5000); // Porta padrão MC Protocol

// Tratar requisições OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Função principal de roteamento
 */
function handleRequest() {
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    try {
        switch ($action) {
            case 'connect':
                return handleConnect();

            case 'read':
                return handleRead();

            case 'write':
                return handleWrite();

            case 'status':
                return handleStatus();

            case 'health':
                return handleHealth();

            default:
                throw new Exception('Ação inválida');
        }
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

/**
 * Testa conexão com o PLC
 */
function handleConnect() {
    $data = json_decode(file_get_contents('php://input'), true);
    $ip = $data['plcIp'] ?? PLC_IP;
    $port = $data['plcPort'] ?? PLC_PORT;

    $plc = new PLCBridge($ip, $port);

    if ($plc->connect()) {
        $plc->disconnect();
        return [
            'success' => true,
            'message' => "Conectado ao PLC $ip:$port",
            'plcIp' => $ip,
            'plcPort' => $port
        ];
    } else {
        throw new Exception('Falha ao conectar ao PLC');
    }
}

/**
 * Lê dados do PLC
 */
function handleRead() {
    $data = json_decode(file_get_contents('php://input'), true);

    $ip = $data['plcIp'] ?? PLC_IP;
    $port = $data['plcPort'] ?? PLC_PORT;
    $type = $data['type'] ?? 'D';
    $address = $data['address'] ?? 0;
    $count = $data['count'] ?? 1;

    $plc = new PLCBridge($ip, $port);

    if (!$plc->connect()) {
        throw new Exception('Falha ao conectar ao PLC');
    }

    if ($type === 'D') {
        $result = $plc->readDRegister($address, $count);
    } elseif ($type === 'M') {
        $result = $plc->readMBit($address, $count);
    } else {
        throw new Exception('Tipo de dispositivo inválido');
    }

    $plc->disconnect();

    return [
        'success' => true,
        'type' => $type,
        'address' => $address,
        'count' => $count,
        'data' => $result
    ];
}

/**
 * Escreve dados no PLC
 */
function handleWrite() {
    $data = json_decode(file_get_contents('php://input'), true);

    $ip = $data['plcIp'] ?? PLC_IP;
    $port = $data['plcPort'] ?? PLC_PORT;
    $type = $data['type'] ?? 'D';
    $address = $data['address'] ?? 0;
    $value = $data['value'] ?? 0;

    $plc = new PLCBridge($ip, $port);

    if (!$plc->connect()) {
        throw new Exception('Falha ao conectar ao PLC');
    }

    if ($type === 'D') {
        $result = $plc->writeDRegister($address, $value);
    } elseif ($type === 'M') {
        $result = $plc->writeMBit($address, $value);
    } else {
        throw new Exception('Tipo de dispositivo inválido');
    }

    $plc->disconnect();

    return [
        'success' => $result,
        'type' => $type,
        'address' => $address,
        'value' => $value
    ];
}

/**
 * Retorna status do sistema
 */
function handleStatus() {
    return [
        'success' => true,
        'server' => 'PHP API',
        'version' => '1.0.0',
        'php_version' => phpversion(),
        'timestamp' => time()
    ];
}

/**
 * Health check
 */
function handleHealth() {
    return [
        'status' => 'ok',
        'timestamp' => time()
    ];
}

// Executar e retornar resposta
$response = handleRequest();
echo json_encode($response, JSON_PRETTY_PRINT);
?>
