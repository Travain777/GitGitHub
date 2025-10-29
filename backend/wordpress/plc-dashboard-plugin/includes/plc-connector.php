<?php
/**
 * PLC Connector - Comunicação com PLC Mitsubishi via MC Protocol
 */

if (!defined('ABSPATH')) {
    exit;
}

class PLC_Connector {
    private $ip;
    private $port;
    private $socket;
    private $connected = false;
    private $timeout = 5;

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

            socket_set_option($this->socket, SOL_SOCKET, SO_RCVTIMEO, ['sec' => $this->timeout, 'usec' => 0]);
            socket_set_option($this->socket, SOL_SOCKET, SO_SNDTIMEO, ['sec' => $this->timeout, 'usec' => 0]);

            $result = @socket_connect($this->socket, $this->ip, $this->port);

            if ($result === false) {
                throw new Exception('Falha ao conectar: ' . socket_strerror(socket_last_error($this->socket)));
            }

            $this->connected = true;
            return true;

        } catch (Exception $e) {
            error_log('[PLC Connector] Erro: ' . $e->getMessage());
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
        $frame = pack('C*', 0x50, 0x00, 0x00, 0xFF, 0xFF, 0x03, 0x00);
        $dataLength = strlen($data) + 6;
        $frame .= pack('v', $dataLength);
        $frame .= pack('v', 0x0000);
        $frame .= pack('v', $command);
        $frame .= pack('v', $subcommand);
        $frame .= $data;
        return $frame;
    }

    /**
     * Lê registros D
     */
    public function readDRegister($address, $count = 1) {
        if (!$this->connected) {
            throw new Exception('Não conectado ao PLC');
        }

        $command = 0x0401;
        $subcommand = 0x0000;
        $deviceCode = 0xA8;
        $addressBCD = $this->decimalToBCD($address);

        $data = pack('C', $deviceCode);
        $data .= pack('V', $addressBCD)[0] . pack('V', $addressBCD)[1] . pack('V', $addressBCD)[2];
        $data .= pack('v', $count);

        $frame = $this->createMCFrame($command, $subcommand, $data);
        $response = $this->sendRequest($frame);
        return $this->parseRegisterData($response, $count);
    }

    /**
     * Lê bits M
     */
    public function readMBit($address, $count = 1) {
        if (!$this->connected) {
            throw new Exception('Não conectado ao PLC');
        }

        $command = 0x0401;
        $subcommand = 0x0000;
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

        $command = 0x1401;
        $subcommand = 0x0000;
        $deviceCode = 0xA8;
        $addressBCD = $this->decimalToBCD($address);

        $data = pack('C', $deviceCode);
        $data .= pack('V', $addressBCD)[0] . pack('V', $addressBCD)[1] . pack('V', $addressBCD)[2];
        $data .= pack('v', 1);
        $data .= pack('v', $value);

        $frame = $this->createMCFrame($command, $subcommand, $data);
        $response = $this->sendRequest($frame);
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

        $sent = @socket_write($this->socket, $frame, strlen($frame));
        if ($sent === false) {
            throw new Exception('Erro ao enviar dados');
        }

        $response = @socket_read($this->socket, 4096, PHP_BINARY_READ);
        if ($response === false) {
            throw new Exception('Erro ao receber dados');
        }

        return $response;
    }

    /**
     * Verifica resposta
     */
    private function checkResponse($response) {
        if (strlen($response) < 11) {
            throw new Exception('Resposta inválida');
        }

        $responseCode = unpack('v', substr($response, 9, 2))[1];
        if ($responseCode !== 0) {
            throw new Exception('Erro PLC: 0x' . dechex($responseCode));
        }

        return true;
    }

    /**
     * Parse registros
     */
    private function parseRegisterData($response, $count) {
        $this->checkResponse($response);
        $data = [];
        $offset = 11;

        for ($i = 0; $i < $count; $i++) {
            $value = unpack('v', substr($response, $offset + ($i * 2), 2))[1];
            $data[$i] = $value;
        }

        return $data;
    }

    /**
     * Parse bits
     */
    private function parseBitData($response, $count) {
        $this->checkResponse($response);
        $data = [];
        $offset = 11;

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

    public function __destruct() {
        $this->disconnect();
    }
}
