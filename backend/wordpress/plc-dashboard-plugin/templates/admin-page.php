<?php
/**
 * Template da Página Admin
 */

if (!defined('ABSPATH')) {
    exit;
}

$options = get_option('plc_dashboard_settings');
?>

<div class="wrap">
    <h1><?php _e('PLC Dashboard - Monitoramento', 'plc-dashboard'); ?></h1>

    <div class="plc-admin-dashboard">
        <!-- Status Card -->
        <div class="postbox">
            <h2 class="hndle"><?php _e('Status da Conexão', 'plc-dashboard'); ?></h2>
            <div class="inside">
                <p><strong><?php _e('IP do PLC:', 'plc-dashboard'); ?></strong> <?php echo esc_html($options['plc_ip']); ?></p>
                <p><strong><?php _e('Porta:', 'plc-dashboard'); ?></strong> <?php echo esc_html($options['plc_port']); ?></p>
                <button id="admin-test-connection" class="button button-primary">
                    <?php _e('Testar Conexão', 'plc-dashboard'); ?>
                </button>
                <div id="admin-connection-result" style="margin-top: 10px;"></div>
            </div>
        </div>

        <!-- Preview do Dashboard -->
        <div class="postbox">
            <h2 class="hndle"><?php _e('Preview do Dashboard', 'plc-dashboard'); ?></h2>
            <div class="inside">
                <?php echo do_shortcode('[plc_dashboard]'); ?>
            </div>
        </div>

        <!-- Instruções -->
        <div class="postbox">
            <h2 class="hndle"><?php _e('Como Adicionar em uma Página', 'plc-dashboard'); ?></h2>
            <div class="inside">
                <ol>
                    <li><?php _e('Vá em Páginas > Adicionar Nova', 'plc-dashboard'); ?></li>
                    <li><?php _e('Adicione o shortcode:', 'plc-dashboard'); ?> <code>[plc_dashboard]</code></li>
                    <li><?php _e('Publique a página', 'plc-dashboard'); ?></li>
                </ol>
                <p>
                    <a href="<?php echo admin_url('post-new.php?post_type=page'); ?>" class="button">
                        <?php _e('Criar Nova Página', 'plc-dashboard'); ?>
                    </a>
                </p>
            </div>
        </div>
    </div>
</div>

<script>
jQuery(document).ready(function($) {
    $('#admin-test-connection').on('click', function() {
        var button = $(this);
        var resultDiv = $('#admin-connection-result');

        button.prop('disabled', true).text('<?php _e('Testando...', 'plc-dashboard'); ?>');
        resultDiv.html('<p><?php _e('Conectando ao PLC...', 'plc-dashboard'); ?></p>');

        $.ajax({
            url: '<?php echo rest_url('plc-dashboard/v1/connect'); ?>',
            method: 'POST',
            headers: {
                'X-WP-Nonce': '<?php echo wp_create_nonce('wp_rest'); ?>'
            },
            data: JSON.stringify({
                plcIp: '<?php echo $options['plc_ip']; ?>',
                plcPort: <?php echo $options['plc_port']; ?>
            }),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    resultDiv.html('<p style="color: green;">✅ ' + response.message + '</p>');
                } else {
                    resultDiv.html('<p style="color: red;">❌ Erro: ' + response.error + '</p>');
                }
            },
            error: function(xhr) {
                resultDiv.html('<p style="color: red;">❌ Erro na conexão: ' + xhr.responseText + '</p>');
            },
            complete: function() {
                button.prop('disabled', false).text('<?php _e('Testar Conexão', 'plc-dashboard'); ?>');
            }
        });
    });
});
</script>
</div>
