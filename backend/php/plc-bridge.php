<?php
/**
 * PLCBridge - Classe PHP para comunicação com PLC Mitsubishi
 * Implementa MC Protocol (MELSEC Communication Protocol) via sockets TCP/IP
 */

class PLCBridge {
    private $ip;
    private $port;
    private $socket;
    private $connected = false;
    private $timeout = 5;

    /**
     * Construtor
     */
    public function __construct($ip, $port = 5000) {
        $this->ip = $ip;
        $this->port = $port;
    }

    /**
     * Conecta ao PLC
     */
    public function connect() {
        try {
            $this->socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);

            if ($this->socket === false) {
                throw new Exception('Falha ao criar socket: ' . socket_strerror(socket_last_error()));
            }

            // Configurar timeout
            socket_set_option($this->socket, SOL_SOCKET, SO_RCVTIMEO, [
                'sec' => $this->timeout,
                'usec' => 0
            ]);

            socket_set_option($this->socket, SOL_SOCKET, SO_SNDTIMEO, [
                'sec' => $this->timeout,
                'usec' => 0
            ]);

            // Conectar
            $result = @socket_connect($this->socket, $this->ip, $this->port);

            if ($result === false) {
                throw new Exception('Falha ao conectar: ' . socket_strerror(socket_last_error($this->socket)));
            }

            $this->connected = true;
            return true;

        } catch (Exception $e) {
            error_log('[PLCBridge] Erro na conexão: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Desconecta do PLC
     */
    public function disconnect() {
        if ($this->socket) {
            @socket_close($this->socket);
            $this->socket = null;
            $this->connected = false;
        }
    }

    /**
     * Cria frame MC Protocol (3E Frame)
     */
    private function createMCFrame($command, $subcommand, $data = '') {
        // MC Protocol 3E Frame Format
        $frame = pack('C*',
            0x50, 0x00,  // Subheader
            0x00,        // Network number
            0xFF,        // PC number
            0xFF, 0x03,  // Destination module I/O
            0x00         // Destination module station
        );

        // Data length (6 bytes + data)
        $dataLength = strlen($data) + 6;
        $frame .= pack('v', $dataLength);

        // Monitoring timer
        $frame .= pack('v', 0x0000);

        // Command
        $frame .= pack('v', $command);

        // Subcommand
        $frame .= pack('v', $subcommand);

        // Data
        $frame .= $data;

        return $frame;
    }

    /**
     * Lê registros D (Data Registers)
     */
    public function readDRegister($address, $count = 1) {
        if (!$this->connected) {
            throw new Exception('Não conectado ao PLC');
        }

        // Comando Batch Read (0x0401)
        $command = 0x0401;
        $subcommand = 0x0000;

        // Device code para D Register (0xA8)
        $deviceCode = 0xA8;

        // Converter endereço para BCD
        $addressBCD = $this->decimalToBCD($address);

        // Montar dados do comando
        $data = pack('C', $deviceCode);
        $data .= pack('V', $addressBCD)[0] . pack('V', $addressBCD)[1] . pack('V', $addressBCD)[2];
        $data .= pack('v', $count);

        $frame = $this->createMCFrame($command, $subcommand, $data);

        // Enviar e receber
        $response = $this->sendRequest($frame);

        // Parse resposta
        return $this->parseRegisterData($response, $count);
    }

    /**
     * Lê bits M (Memory Bits)
     */
    public function readMBit($address, $count = 1) {
        if (!$this->connected) {
            throw new Exception('Não conectado ao PLC');
        }

        $command = 0x0401;
        $subcommand = 0x0000;

        // Device code para M Bit (0x90)
        $deviceCode = 0x90;

        $addressBCD = $this->decimalToBCD($address);

        $data = pack('C', $deviceCode);
        $data .= pack('V', $addressBCD)[0] . pack('V', $addressBCD)[1] . pack('V', $addressBCD)[2];
        $data .= pack('v', $count);

        $frame = $this->createMCFrame($command, $subcommand, $data);

        $response = $this->sendRequest($frame);

        return $this->parseBitData($response, $count);
    }

    /**
     * Escreve em registro D
     */
    public function writeDRegister($address, $value) {
        if (!$this->connected) {
            throw new Exception('Não conectado ao PLC');
        }

        // Comando Batch Write (0x1401)
        $command = 0x1401;
        $subcommand = 0x0000;

        $deviceCode = 0xA8;
        $addressBCD = $this->decimalToBCD($address);

        $data = pack('C', $deviceCode);
        $data .= pack('V', $addressBCD)[0] . pack('V', $addressBCD)[1] . pack('V', $addressBCD)[2];
        $data .= pack('v', 1); // Count = 1
        $data .= pack('v', $value);

        $frame = $this->createMCFrame($command, $subcommand, $data);

        $response = $this->sendRequest($frame);

        // Verificar sucesso
        return $this->checkResponse($response);
    }

    /**
     * Escreve em bit M
     */
    public function writeMBit($address, $value) {
        if (!$this->connected) {
            throw new Exception('Não conectado ao PLC');
        }

        $command = 0x1401;
        $subcommand = 0x0000;

        $deviceCode = 0x90;
        $addressBCD = $this->decimalToBCD($address);

        $data = pack('C', $deviceCode);
        $data .= pack('V', $addressBCD)[0] . pack('V', $addressBCD)[1] . pack('V', $addressBCD)[2];
        $data .= pack('v', 1);
        $data .= pack('v', $value ? 1 : 0);

        $frame = $this->createMCFrame($command, $subcommand, $data);

        $response = $this->sendRequest($frame);

        return $this->checkResponse($response);
    }

    /**
     * Envia requisição e recebe resposta
     */
    private function sendRequest($frame) {
        if (!$this->connected) {
            throw new Exception('Não conectado ao PLC');
        }

        // Enviar frame
        $sent = @socket_write($this->socket, $frame, strlen($frame));

        if ($sent === false) {
            throw new Exception('Erro ao enviar dados: ' . socket_strerror(socket_last_error($this->socket)));
        }

        // Receber resposta (máximo 4096 bytes)
        $response = @socket_read($this->socket, 4096, PHP_BINARY_READ);

        if ($response === false) {
            throw new Exception('Erro ao receber dados: ' . socket_strerror(socket_last_error($this->socket)));
        }

        return $response;
    }

    /**
     * Verifica resposta do PLC
     */
    private function checkResponse($response) {
        if (strlen($response) < 11) {
            throw new Exception('Resposta inválida do PLC');
        }

        // Código de resposta está no offset 9 (2 bytes)
        $responseCode = unpack('v', substr($response, 9, 2))[1];

        if ($responseCode !== 0) {
            throw new Exception('Erro do PLC: 0x' . dechex($responseCode));
        }

        return true;
    }

    /**
     * Parse dados de registro
     */
    private function parseRegisterData($response, $count) {
        $this->checkResponse($response);

        $data = [];
        $offset = 11; // Pular cabeçalho

        for ($i = 0; $i < $count; $i++) {
            $value = unpack('v', substr($response, $offset + ($i * 2), 2))[1];
            $data[$i] = $value;
        }

        return $data;
    }

    /**
     * Parse dados de bit
     */
    private function parseBitData($response, $count) {
        $this->checkResponse($response);

        $data = [];
        $offset = 11; // Pular cabeçalho

        for ($i = 0; $i < $count; $i++) {
            $byteIndex = floor($i / 8);
            $bitIndex = $i % 8;

            $byte = ord($response[$offset + $byteIndex]);
            $bitValue = ($byte >> $bitIndex) & 1;

            $data[$i] = $bitValue;
        }

        return $data;
    }

    /**
     * Converte decimal para BCD
     */
    private function decimalToBCD($decimal) {
        $bcd = 0;
        $shift = 0;

        while ($decimal > 0) {
            $bcd |= ($decimal % 10) << $shift;
            $decimal = floor($decimal / 10);
            $shift += 4;
        }

        return $bcd;
    }

    /**
     * Verifica se está conectado
     */
    public function isConnected() {
        return $this->connected;
    }

    /**
     * Define timeout
     */
    public function setTimeout($timeout) {
        $this->timeout = $timeout;
    }

    /**
     * Destrutor
     */
    public function __destruct() {
        $this->disconnect();
    }
}
?>
