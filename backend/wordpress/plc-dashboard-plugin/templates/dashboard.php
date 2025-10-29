<?php
/**
 * Template do Dashboard PLC
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="plc-dashboard-wrapper">
    <!-- Header -->
    <div class="plc-dashboard-header">
        <h2><?php _e('PLC Mitsubishi Q06UDVCPU - Dashboard', 'plc-dashboard'); ?></h2>
        <div class="connection-status">
            <span class="status-indicator" id="plc-status-indicator"></span>
            <span id="plc-connection-status"><?php _e('Desconectado', 'plc-dashboard'); ?></span>
        </div>
    </div>

    <!-- Controles -->
    <div class="plc-control-panel">
        <div class="control-group">
            <label for="plc-ip-input"><?php _e('IP do PLC:', 'plc-dashboard'); ?></label>
            <input type="text" id="plc-ip-input" placeholder="192.168.0.1"
                   value="<?php echo esc_attr(get_option('plc_dashboard_settings')['plc_ip']); ?>">

            <label for="plc-port-input"><?php _e('Porta:', 'plc-dashboard'); ?></label>
            <input type="number" id="plc-port-input" placeholder="5000"
                   value="<?php echo esc_attr(get_option('plc_dashboard_settings')['plc_port']); ?>">

            <button id="plc-connect-btn" class="button button-primary">
                <?php _e('Conectar', 'plc-dashboard'); ?>
            </button>
            <button id="plc-disconnect-btn" class="button button-secondary" disabled>
                <?php _e('Desconectar', 'plc-dashboard'); ?>
            </button>
        </div>
    </div>

    <!-- Estatísticas -->
    <div class="plc-stats-grid">
        <div class="stat-card">
            <h3><?php _e('Dispositivos Lidos', 'plc-dashboard'); ?></h3>
            <p class="stat-value" id="plc-device-count">0</p>
        </div>
        <div class="stat-card">
            <h3><?php _e('Taxa de Atualização', 'plc-dashboard'); ?></h3>
            <p class="stat-value" id="plc-update-rate">0 ms</p>
        </div>
        <div class="stat-card">
            <h3><?php _e('Anomalias', 'plc-dashboard'); ?></h3>
            <p class="stat-value" id="plc-anomaly-count">0</p>
        </div>
        <div class="stat-card">
            <h3><?php _e('Status IA', 'plc-dashboard'); ?></h3>
            <p class="stat-value" id="plc-ai-status"><?php _e('Inativo', 'plc-dashboard'); ?></p>
        </div>
    </div>

    <!-- Gráficos -->
    <div class="plc-charts-grid">
        <div class="chart-container">
            <h3><?php _e('Dados em Tempo Real', 'plc-dashboard'); ?></h3>
            <canvas id="plc-realtime-chart"></canvas>
        </div>
        <div class="chart-container">
            <h3><?php _e('Análise de Tendência', 'plc-dashboard'); ?></h3>
            <canvas id="plc-trend-chart"></canvas>
        </div>
    </div>

    <!-- Dados do PLC -->
    <div class="plc-data-section">
        <div class="data-panel">
            <h3><?php _e('Registros D', 'plc-dashboard'); ?></h3>
            <div class="register-list" id="plc-d-register-list">
                <p class="placeholder"><?php _e('Conecte ao PLC para ver os dados...', 'plc-dashboard'); ?></p>
            </div>
        </div>
        <div class="data-panel">
            <h3><?php _e('Bits M', 'plc-dashboard'); ?></h3>
            <div class="register-list" id="plc-m-bit-list">
                <p class="placeholder"><?php _e('Conecte ao PLC para ver os dados...', 'plc-dashboard'); ?></p>
            </div>
        </div>
    </div>

    <!-- Análise IA -->
    <?php if (get_option('plc_dashboard_settings')['enable_ai']): ?>
    <div class="plc-ai-section">
        <h3><?php _e('Análise Inteligente (Transformers.js)', 'plc-dashboard'); ?></h3>
        <div class="ai-controls">
            <button id="plc-ai-start-btn" class="button">
                <?php _e('Iniciar Análise IA', 'plc-dashboard'); ?>
            </button>
            <button id="plc-ai-stop-btn" class="button" disabled>
                <?php _e('Parar Análise', 'plc-dashboard'); ?>
            </button>
            <select id="plc-ai-model">
                <option value="anomaly"><?php _e('Detecção de Anomalias', 'plc-dashboard'); ?></option>
                <option value="prediction"><?php _e('Previsão de Tendências', 'plc-dashboard'); ?></option>
                <option value="classification"><?php _e('Classificação de Estados', 'plc-dashboard'); ?></option>
            </select>
        </div>
        <div class="ai-output" id="plc-ai-output">
            <p class="placeholder"><?php _e('Inicie a análise IA para ver os resultados...', 'plc-dashboard'); ?></p>
        </div>
    </div>
    <?php endif; ?>

    <!-- Log -->
    <div class="plc-log-section">
        <h3><?php _e('Log de Eventos', 'plc-dashboard'); ?></h3>
        <div class="log-container" id="plc-log-container">
            <p class="log-entry"><?php _e('Sistema inicializado...', 'plc-dashboard'); ?></p>
        </div>
        <button id="plc-clear-log-btn" class="button button-small">
            <?php _e('Limpar Log', 'plc-dashboard'); ?>
        </button>
    </div>
</div>
