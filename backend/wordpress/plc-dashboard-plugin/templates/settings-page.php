<?php
/**
 * Template da Página de Configurações
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1><?php _e('Configurações do PLC Dashboard', 'plc-dashboard'); ?></h1>

    <form method="post" action="options.php">
        <?php
        settings_fields('plc_dashboard_settings');
        do_settings_sections('plc-dashboard-settings');
        submit_button();
        ?>
    </form>

    <hr>

    <h2><?php _e('Informações do Sistema', 'plc-dashboard'); ?></h2>
    <table class="widefat">
        <tr>
            <td><strong><?php _e('Versão do Plugin:', 'plc-dashboard'); ?></strong></td>
            <td><?php echo PLC_DASHBOARD_VERSION; ?></td>
        </tr>
        <tr>
            <td><strong><?php _e('PHP Version:', 'plc-dashboard'); ?></strong></td>
            <td><?php echo phpversion(); ?></td>
        </tr>
        <tr>
            <td><strong><?php _e('WordPress Version:', 'plc-dashboard'); ?></strong></td>
            <td><?php echo get_bloginfo('version'); ?></td>
        </tr>
        <tr>
            <td><strong><?php _e('Sockets Habilitados:', 'plc-dashboard'); ?></strong></td>
            <td><?php echo function_exists('socket_create') ? '✅ Sim' : '❌ Não'; ?></td>
        </tr>
    </table>

    <hr>

    <h2><?php _e('Como Usar', 'plc-dashboard'); ?></h2>
    <h3><?php _e('Shortcode para Páginas/Posts:', 'plc-dashboard'); ?></h3>
    <p><?php _e('Adicione o seguinte shortcode em qualquer página ou post:', 'plc-dashboard'); ?></p>
    <pre>[plc_dashboard]</pre>

    <h3><?php _e('API REST Endpoints:', 'plc-dashboard'); ?></h3>
    <ul>
        <li><code>POST /wp-json/plc-dashboard/v1/connect</code> - <?php _e('Conectar ao PLC', 'plc-dashboard'); ?></li>
        <li><code>POST /wp-json/plc-dashboard/v1/read/d</code> - <?php _e('Ler registros D', 'plc-dashboard'); ?></li>
        <li><code>POST /wp-json/plc-dashboard/v1/read/m</code> - <?php _e('Ler bits M', 'plc-dashboard'); ?></li>
        <li><code>POST /wp-json/plc-dashboard/v1/write/d</code> - <?php _e('Escrever registro D', 'plc-dashboard'); ?></li>
        <li><code>POST /wp-json/plc-dashboard/v1/write/m</code> - <?php _e('Escrever bit M', 'plc-dashboard'); ?></li>
        <li><code>GET /wp-json/plc-dashboard/v1/status</code> - <?php _e('Status do sistema', 'plc-dashboard'); ?></li>
    </ul>
</div>
