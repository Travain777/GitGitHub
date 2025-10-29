<?php
/**
 * Shortcodes do Plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

class PLC_Dashboard_Shortcodes {

    /**
     * Registrar shortcodes
     */
    public static function register() {
        add_shortcode('plc_dashboard', array(__CLASS__, 'dashboard_shortcode'));
        add_shortcode('plc_status', array(__CLASS__, 'status_shortcode'));
        add_shortcode('plc_chart', array(__CLASS__, 'chart_shortcode'));
    }

    /**
     * Shortcode do dashboard completo
     * Uso: [plc_dashboard]
     */
    public static function dashboard_shortcode($atts) {
        $atts = shortcode_atts(array(
            'width' => '100%',
            'height' => 'auto'
        ), $atts);

        ob_start();
        include PLC_DASHBOARD_PLUGIN_DIR . 'templates/dashboard.php';
        return ob_get_clean();
    }

    /**
     * Shortcode de status
     * Uso: [plc_status]
     */
    public static function status_shortcode($atts) {
        $atts = shortcode_atts(array(
            'show_ip' => 'true',
            'show_port' => 'true'
        ), $atts);

        $options = get_option('plc_dashboard_settings');

        ob_start();
        ?>
        <div class="plc-status-widget">
            <h3><?php _e('Status do PLC', 'plc-dashboard'); ?></h3>
            <div class="status-indicator" id="plc-status-indicator">
                <span class="indicator-dot"></span>
                <span class="indicator-text"><?php _e('Desconectado', 'plc-dashboard'); ?></span>
            </div>
            <?php if ($atts['show_ip'] === 'true'): ?>
                <p><strong><?php _e('IP:', 'plc-dashboard'); ?></strong> <?php echo esc_html($options['plc_ip']); ?></p>
            <?php endif; ?>
            <?php if ($atts['show_port'] === 'true'): ?>
                <p><strong><?php _e('Porta:', 'plc-dashboard'); ?></strong> <?php echo esc_html($options['plc_port']); ?></p>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Shortcode de gráfico
     * Uso: [plc_chart type="line" device="D" address="0" count="5"]
     */
    public static function chart_shortcode($atts) {
        $atts = shortcode_atts(array(
            'type' => 'line',
            'device' => 'D',
            'address' => '0',
            'count' => '5',
            'height' => '300'
        ), $atts);

        $chart_id = 'plc-chart-' . uniqid();

        ob_start();
        ?>
        <div class="plc-chart-container" style="height: <?php echo esc_attr($atts['height']); ?>px;">
            <canvas id="<?php echo esc_attr($chart_id); ?>"></canvas>
        </div>
        <script>
        jQuery(document).ready(function($) {
            var ctx = document.getElementById('<?php echo esc_js($chart_id); ?>').getContext('2d');
            var chart = new Chart(ctx, {
                type: '<?php echo esc_js($atts['type']); ?>',
                data: {
                    labels: [],
                    datasets: [{
                        label: '<?php echo esc_js($atts['device'] . $atts['address']); ?>',
                        data: [],
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });

            // Atualizar dados periodicamente
            setInterval(function() {
                // Implementar leitura via API
            }, 1000);
        });
        </script>
        <?php
        return ob_get_clean();
    }
}
