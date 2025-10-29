<?php
/**
 * API REST Endpoints para comunicação com o PLC
 */

if (!defined('ABSPATH')) {
    exit;
}

class PLC_Dashboard_API {

    /**
     * Registrar rotas da API
     */
    public static function register_routes() {
        $namespace = 'plc-dashboard/v1';

        // Conectar ao PLC
        register_rest_route($namespace, '/connect', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'connect'),
            'permission_callback' => array(__CLASS__, 'check_permission')
        ));

        // Ler registros D
        register_rest_route($namespace, '/read/d', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'read_d_register'),
            'permission_callback' => array(__CLASS__, 'check_permission')
        ));

        // Ler bits M
        register_rest_route($namespace, '/read/m', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'read_m_bit'),
            'permission_callback' => array(__CLASS__, 'check_permission')
        ));

        // Escrever registro D
        register_rest_route($namespace, '/write/d', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'write_d_register'),
            'permission_callback' => array(__CLASS__, 'check_permission')
        ));

        // Escrever bit M
        register_rest_route($namespace, '/write/m', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'write_m_bit'),
            'permission_callback' => array(__CLASS__, 'check_permission')
        ));

        // Ler múltiplos dispositivos
        register_rest_route($namespace, '/read/batch', array(
            'methods' => 'POST',
            'callback' => array(__CLASS__, 'read_batch'),
            'permission_callback' => array(__CLASS__, 'check_permission')
        ));

        // Status da conexão
        register_rest_route($namespace, '/status', array(
            'methods' => 'GET',
            'callback' => array(__CLASS__, 'get_status'),
            'permission_callback' => '__return_true' // Público
        ));
    }

    /**
     * Verificar permissões
     */
    public static function check_permission() {
        // Permitir qualquer usuário autenticado
        // Para produção, você pode querer verificar capacidades específicas
        return true; // current_user_can('edit_posts');
    }

    /**
     * Conectar ao PLC
     */
    public static function connect($request) {
        $params = $request->get_json_params();
        $ip = isset($params['plcIp']) ? sanitize_text_field($params['plcIp']) : null;
        $port = isset($params['plcPort']) ? intval($params['plcPort']) : 5000;

        if (!$ip) {
            $options = get_option('plc_dashboard_settings');
            $ip = isset($options['plc_ip']) ? $options['plc_ip'] : '192.168.0.1';
            $port = isset($options['plc_port']) ? $options['plc_port'] : 5000;
        }

        try {
            $plc = new PLC_Connector($ip, $port);

            if ($plc->connect()) {
                $plc->disconnect();

                return new WP_REST_Response(array(
                    'success' => true,
                    'message' => "Conectado ao PLC $ip:$port",
                    'plcIp' => $ip,
                    'plcPort' => $port
                ), 200);
            } else {
                throw new Exception('Falha na conexão');
            }

        } catch (Exception $e) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => $e->getMessage()
            ), 500);
        }
    }

    /**
     * Ler registro D
     */
    public static function read_d_register($request) {
        $params = $request->get_json_params();

        $ip = isset($params['plcIp']) ? sanitize_text_field($params['plcIp']) : null;
        $port = isset($params['plcPort']) ? intval($params['plcPort']) : 5000;
        $address = isset($params['address']) ? intval($params['address']) : 0;
        $count = isset($params['count']) ? intval($params['count']) : 1;

        if (!$ip) {
            $options = get_option('plc_dashboard_settings');
            $ip = $options['plc_ip'];
            $port = $options['plc_port'];
        }

        try {
            $plc = new PLC_Connector($ip, $port);

            if (!$plc->connect()) {
                throw new Exception('Falha ao conectar ao PLC');
            }

            $data = $plc->readDRegister($address, $count);
            $plc->disconnect();

            return new WP_REST_Response(array(
                'success' => true,
                'type' => 'D',
                'address' => $address,
                'count' => $count,
                'data' => $data
            ), 200);

        } catch (Exception $e) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => $e->getMessage()
            ), 500);
        }
    }

    /**
     * Ler bit M
     */
    public static function read_m_bit($request) {
        $params = $request->get_json_params();

        $ip = isset($params['plcIp']) ? sanitize_text_field($params['plcIp']) : null;
        $port = isset($params['plcPort']) ? intval($params['plcPort']) : 5000;
        $address = isset($params['address']) ? intval($params['address']) : 0;
        $count = isset($params['count']) ? intval($params['count']) : 1;

        if (!$ip) {
            $options = get_option('plc_dashboard_settings');
            $ip = $options['plc_ip'];
            $port = $options['plc_port'];
        }

        try {
            $plc = new PLC_Connector($ip, $port);

            if (!$plc->connect()) {
                throw new Exception('Falha ao conectar ao PLC');
            }

            $data = $plc->readMBit($address, $count);
            $plc->disconnect();

            return new WP_REST_Response(array(
                'success' => true,
                'type' => 'M',
                'address' => $address,
                'count' => $count,
                'data' => $data
            ), 200);

        } catch (Exception $e) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => $e->getMessage()
            ), 500);
        }
    }

    /**
     * Escrever registro D
     */
    public static function write_d_register($request) {
        $params = $request->get_json_params();

        $ip = isset($params['plcIp']) ? sanitize_text_field($params['plcIp']) : null;
        $port = isset($params['plcPort']) ? intval($params['plcPort']) : 5000;
        $address = isset($params['address']) ? intval($params['address']) : 0;
        $value = isset($params['value']) ? intval($params['value']) : 0;

        if (!$ip) {
            $options = get_option('plc_dashboard_settings');
            $ip = $options['plc_ip'];
            $port = $options['plc_port'];
        }

        try {
            $plc = new PLC_Connector($ip, $port);

            if (!$plc->connect()) {
                throw new Exception('Falha ao conectar ao PLC');
            }

            $plc->writeDRegister($address, $value);
            $plc->disconnect();

            return new WP_REST_Response(array(
                'success' => true,
                'type' => 'D',
                'address' => $address,
                'value' => $value
            ), 200);

        } catch (Exception $e) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => $e->getMessage()
            ), 500);
        }
    }

    /**
     * Escrever bit M
     */
    public static function write_m_bit($request) {
        $params = $request->get_json_params();

        $ip = isset($params['plcIp']) ? sanitize_text_field($params['plcIp']) : null;
        $port = isset($params['plcPort']) ? intval($params['plcPort']) : 5000;
        $address = isset($params['address']) ? intval($params['address']) : 0;
        $value = isset($params['value']) ? boolval($params['value']) : false;

        if (!$ip) {
            $options = get_option('plc_dashboard_settings');
            $ip = $options['plc_ip'];
            $port = $options['plc_port'];
        }

        try {
            $plc = new PLC_Connector($ip, $port);

            if (!$plc->connect()) {
                throw new Exception('Falha ao conectar ao PLC');
            }

            $plc->writeMBit($address, $value);
            $plc->disconnect();

            return new WP_REST_Response(array(
                'success' => true,
                'type' => 'M',
                'address' => $address,
                'value' => $value ? 1 : 0
            ), 200);

        } catch (Exception $e) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => $e->getMessage()
            ), 500);
        }
    }

    /**
     * Ler múltiplos dispositivos
     */
    public static function read_batch($request) {
        $params = $request->get_json_params();

        $ip = isset($params['plcIp']) ? sanitize_text_field($params['plcIp']) : null;
        $port = isset($params['plcPort']) ? intval($params['plcPort']) : 5000;
        $devices = isset($params['devices']) ? $params['devices'] : array();

        if (!$ip) {
            $options = get_option('plc_dashboard_settings');
            $ip = $options['plc_ip'];
            $port = $options['plc_port'];
        }

        try {
            $plc = new PLC_Connector($ip, $port);

            if (!$plc->connect()) {
                throw new Exception('Falha ao conectar ao PLC');
            }

            $result = array();

            foreach ($devices as $device) {
                $type = $device['type'];
                $address = intval($device['address']);
                $count = isset($device['count']) ? intval($device['count']) : 1;

                if ($type === 'D') {
                    $result['D'] = $plc->readDRegister($address, $count);
                } elseif ($type === 'M') {
                    $result['M'] = $plc->readMBit($address, $count);
                }
            }

            $plc->disconnect();

            return new WP_REST_Response(array(
                'success' => true,
                'data' => $result,
                'timestamp' => time()
            ), 200);

        } catch (Exception $e) {
            return new WP_REST_Response(array(
                'success' => false,
                'error' => $e->getMessage()
            ), 500);
        }
    }

    /**
     * Status do sistema
     */
    public static function get_status() {
        $options = get_option('plc_dashboard_settings');

        return new WP_REST_Response(array(
            'success' => true,
            'status' => 'ok',
            'version' => PLC_DASHBOARD_VERSION,
            'settings' => $options,
            'timestamp' => time()
        ), 200);
    }
}
