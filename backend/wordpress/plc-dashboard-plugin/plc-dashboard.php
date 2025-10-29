<?php
/**
 * Plugin Name: PLC Mitsubishi Dashboard
 * Plugin URI: https://github.com/Travain777/GitGitHub
 * Description: Dashboard de monitoramento e análise do PLC Mitsubishi Q06UDVCPU com IA
 * Version: 1.0.0
 * Author: Seu Nome
 * Author URI: https://seu-site.com
 * License: GPL v2 or later
 * Text Domain: plc-dashboard
 */

// Evitar acesso direto
if (!defined('ABSPATH')) {
    exit;
}

// Definir constantes
define('PLC_DASHBOARD_VERSION', '1.0.0');
define('PLC_DASHBOARD_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('PLC_DASHBOARD_PLUGIN_URL', plugin_dir_url(__FILE__));

// Incluir arquivos necessários
require_once PLC_DASHBOARD_PLUGIN_DIR . 'includes/plc-connector.php';
require_once PLC_DASHBOARD_PLUGIN_DIR . 'includes/api-endpoints.php';
require_once PLC_DASHBOARD_PLUGIN_DIR . 'includes/shortcodes.php';

/**
 * Classe principal do plugin
 */
class PLC_Dashboard_Plugin {

    private static $instance = null;

    /**
     * Singleton
     */
    public static function get_instance() {
        if (self::$instance == null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Construtor
     */
    private function __construct() {
        // Hooks de ativação/desativação
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        // Hooks de inicialização
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));

        // Inicializar API REST
        add_action('rest_api_init', array('PLC_Dashboard_API', 'register_routes'));

        // Registrar shortcodes
        PLC_Dashboard_Shortcodes::register();
    }

    /**
     * Ativação do plugin
     */
    public function activate() {
        // Criar opções padrão
        $default_options = array(
            'plc_ip' => '192.168.0.1',
            'plc_port' => 5000,
            'update_interval' => 1000,
            'enable_ai' => true
        );

        add_option('plc_dashboard_settings', $default_options);

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Desativação do plugin
     */
    public function deactivate() {
        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Inicialização
     */
    public function init() {
        // Registrar text domain para tradução
        load_plugin_textdomain('plc-dashboard', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }

    /**
     * Adicionar menu no admin
     */
    public function add_admin_menu() {
        add_menu_page(
            __('PLC Dashboard', 'plc-dashboard'),
            __('PLC Dashboard', 'plc-dashboard'),
            'manage_options',
            'plc-dashboard',
            array($this, 'admin_page'),
            'dashicons-chart-line',
            30
        );

        add_submenu_page(
            'plc-dashboard',
            __('Configurações', 'plc-dashboard'),
            __('Configurações', 'plc-dashboard'),
            'manage_options',
            'plc-dashboard-settings',
            array($this, 'settings_page')
        );
    }

    /**
     * Registrar configurações
     */
    public function register_settings() {
        register_setting('plc_dashboard_settings', 'plc_dashboard_settings', array($this, 'sanitize_settings'));

        add_settings_section(
            'plc_dashboard_main_section',
            __('Configurações do PLC', 'plc-dashboard'),
            null,
            'plc-dashboard-settings'
        );

        add_settings_field(
            'plc_ip',
            __('IP do PLC', 'plc-dashboard'),
            array($this, 'plc_ip_callback'),
            'plc-dashboard-settings',
            'plc_dashboard_main_section'
        );

        add_settings_field(
            'plc_port',
            __('Porta do PLC', 'plc-dashboard'),
            array($this, 'plc_port_callback'),
            'plc-dashboard-settings',
            'plc_dashboard_main_section'
        );

        add_settings_field(
            'update_interval',
            __('Intervalo de Atualização (ms)', 'plc-dashboard'),
            array($this, 'update_interval_callback'),
            'plc-dashboard-settings',
            'plc_dashboard_main_section'
        );

        add_settings_field(
            'enable_ai',
            __('Habilitar Análise IA', 'plc-dashboard'),
            array($this, 'enable_ai_callback'),
            'plc-dashboard-settings',
            'plc_dashboard_main_section'
        );
    }

    /**
     * Sanitizar configurações
     */
    public function sanitize_settings($input) {
        $sanitized = array();

        $sanitized['plc_ip'] = sanitize_text_field($input['plc_ip']);
        $sanitized['plc_port'] = intval($input['plc_port']);
        $sanitized['update_interval'] = intval($input['update_interval']);
        $sanitized['enable_ai'] = isset($input['enable_ai']) ? true : false;

        return $sanitized;
    }

    /**
     * Callbacks dos campos
     */
    public function plc_ip_callback() {
        $options = get_option('plc_dashboard_settings');
        printf(
            '<input type="text" id="plc_ip" name="plc_dashboard_settings[plc_ip]" value="%s" class="regular-text" />',
            isset($options['plc_ip']) ? esc_attr($options['plc_ip']) : '192.168.0.1'
        );
    }

    public function plc_port_callback() {
        $options = get_option('plc_dashboard_settings');
        printf(
            '<input type="number" id="plc_port" name="plc_dashboard_settings[plc_port]" value="%s" />',
            isset($options['plc_port']) ? esc_attr($options['plc_port']) : '5000'
        );
    }

    public function update_interval_callback() {
        $options = get_option('plc_dashboard_settings');
        printf(
            '<input type="number" id="update_interval" name="plc_dashboard_settings[update_interval]" value="%s" />',
            isset($options['update_interval']) ? esc_attr($options['update_interval']) : '1000'
        );
    }

    public function enable_ai_callback() {
        $options = get_option('plc_dashboard_settings');
        printf(
            '<input type="checkbox" id="enable_ai" name="plc_dashboard_settings[enable_ai]" value="1" %s />',
            isset($options['enable_ai']) && $options['enable_ai'] ? 'checked' : ''
        );
    }

    /**
     * Página principal do admin
     */
    public function admin_page() {
        include PLC_DASHBOARD_PLUGIN_DIR . 'templates/admin-page.php';
    }

    /**
     * Página de configurações
     */
    public function settings_page() {
        include PLC_DASHBOARD_PLUGIN_DIR . 'templates/settings-page.php';
    }

    /**
     * Enfileirar scripts e estilos
     */
    public function enqueue_scripts() {
        // CSS
        wp_enqueue_style(
            'plc-dashboard-style',
            PLC_DASHBOARD_PLUGIN_URL . 'assets/css/style.css',
            array(),
            PLC_DASHBOARD_VERSION
        );

        // Chart.js
        wp_enqueue_script(
            'chartjs',
            'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
            array(),
            '4.4.0',
            true
        );

        // Transformers.js
        wp_enqueue_script(
            'transformersjs',
            'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1',
            array(),
            '2.17.1',
            true
        );

        // Scripts do plugin
        wp_enqueue_script(
            'plc-dashboard-script',
            PLC_DASHBOARD_PLUGIN_URL . 'assets/js/dashboard.js',
            array('jquery', 'chartjs'),
            PLC_DASHBOARD_VERSION,
            true
        );

        // Passar configurações para o JavaScript
        $options = get_option('plc_dashboard_settings');
        wp_localize_script('plc-dashboard-script', 'plcDashboardConfig', array(
            'apiUrl' => rest_url('plc-dashboard/v1/'),
            'nonce' => wp_create_nonce('wp_rest'),
            'plcIp' => isset($options['plc_ip']) ? $options['plc_ip'] : '192.168.0.1',
            'plcPort' => isset($options['plc_port']) ? $options['plc_port'] : 5000,
            'updateInterval' => isset($options['update_interval']) ? $options['update_interval'] : 1000,
            'enableAI' => isset($options['enable_ai']) ? $options['enable_ai'] : true
        ));
    }
}

// Inicializar plugin
function plc_dashboard_init() {
    return PLC_Dashboard_Plugin::get_instance();
}

// Iniciar
add_action('plugins_loaded', 'plc_dashboard_init');
