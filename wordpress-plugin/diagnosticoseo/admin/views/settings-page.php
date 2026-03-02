<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap dseo-settings-wrap">
    <div class="dseo-settings-header">
        <h1>SEO Diagnostico</h1>
        <p class="dseo-tagline">Integra análisis SEO y generación de contenido con GPT-4o directamente en WordPress.</p>
    </div>

    <?php settings_errors(); ?>

    <?php
    $opts    = get_option( DSEO_OPTION_KEY, array() );
    $api_key = isset($opts['api_key']) ? $opts['api_key'] : '';
    $base    = isset($opts['base_url']) ? $opts['base_url'] : 'https://diagnostico-seo.vercel.app';
    ?>

    <div class="dseo-settings-grid">

        <!-- Configuración -->
        <div class="dseo-card">
            <div class="dseo-card-header">⚙️ Configuración de API</div>
            <form method="post" action="options.php">
                <?php settings_fields( 'diagnosticoseo_group' ); ?>

                <div class="dseo-field">
                    <label for="dseo_api_key">API Key</label>
                    <div class="dseo-input-row">
                        <input type="password" id="dseo_api_key"
                               name="<?php echo esc_attr( DSEO_OPTION_KEY ); ?>[api_key]"
                               value="<?php echo esc_attr( $api_key ); ?>"
                               placeholder="sk_live_…"
                               autocomplete="off" />
                        <button type="button" id="dseo-toggle-key" class="dseo-btn dseo-btn-ghost">
                            👁️ Mostrar
                        </button>
                    </div>
                    <p class="dseo-hint">
                        Obtén tu API key en <a href="https://diagnostico-seo.vercel.app/dashboard" target="_blank">diagnostico-seo.vercel.app/dashboard</a>
                    </p>
                </div>

                <div class="dseo-field">
                    <label for="dseo_base_url">URL base de la API</label>
                    <input type="url" id="dseo_base_url"
                           name="<?php echo esc_attr( DSEO_OPTION_KEY ); ?>[base_url]"
                           value="<?php echo esc_url( $base ); ?>"
                           placeholder="https://diagnostico-seo.vercel.app" />
                    <p class="dseo-hint">No modificar a menos que uses una instancia propia.</p>
                </div>

                <div class="dseo-field-row">
                    <?php submit_button( 'Guardar configuraciÃ³n', 'primary', 'submit', false ); ?>
                    <button type="button" id="dseo-test-btn" class="dseo-btn dseo-btn-secondary">
                        🔌 Probar conexión
                    </button>
                </div>
                <div id="dseo-test-result" style="display:none;margin-top:10px;"></div>
            </form>
        </div>

        <div class="dseo-card">
            <div class="dseo-card-header">📦 Planes disponibles</div>
            <table class="dseo-plans-table">
                <thead>
                    <tr><th>Plan</th><th>Requests/mes</th><th>Precio</th><th>Endpoints</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span class="dseo-badge dseo-badge-starter">Starter</span></td>
                        <td>10</td>
                        <td><strong>Gratis</strong></td>
                        <td>Análisis SEO</td>
                    </tr>
                    <tr>
                        <td><span class="dseo-badge dseo-badge-pro">Pro</span></td>
                        <td>100</td>
                        <td>$29 USD/mes</td>
                        <td>Análisis + Generar contenido</td>
                    </tr>
                    <tr>
                        <td><span class="dseo-badge dseo-badge-agency">Agency</span></td>
                        <td>1.000</td>
                        <td>$99 USD/mes</td>
                        <td>Todo + Soporte dedicado</td>
                    </tr>
                </tbody>
            </table>
            <a href="https://diagnostico-seo.vercel.app/dashboard" target="_blank" class="dseo-btn dseo-btn-primary" style="margin-top:16px;display:inline-block;">
                Obtener / Gestionar mi API Key →
            </a>
        </div>

        <div class="dseo-card dseo-card-full">
            <div class="dseo-card-header">💡 Cómo usar el plugin</div>
            <div class="dseo-steps">
                <div class="dseo-step">
                    <div class="dseo-step-num">1</div>
                    <div>
                        <strong>Obtén tu API key</strong>
                        <p>Ve a <a href="https://diagnostico-seo.vercel.app/dashboard" target="_blank">diagnostico-seo.vercel.app/dashboard</a>, ingresa tu email y genera una key gratuita.</p>
                    </div>
                </div>
                <div class="dseo-step">
                    <div class="dseo-step-num">2</div>
                    <div>
                        <strong>Configura el plugin</strong>
                        <p>Pega la API key aquí arriba y guarda. Usa "Probar conexión" para verificar.</p>
                    </div>
                </div>
                <div class="dseo-step">
                    <div class="dseo-step-num">3</div>
                    <div>
                        <strong>Edita cualquier post o página</strong>
                        <p>Verás el panel <strong>SEO Diagnostico</strong> debajo del editor. Analiza la URL o genera contenido optimizado con un clic.</p>
                    </div>
                </div>
                <div class="dseo-step">
                    <div class="dseo-step-num">4</div>
                    <div>
                        <strong>Aplica el contenido</strong>
                        <p>El plugin genera H1, H2, H3, párrafos, alt text de imágenes y schema markup listos para copiar o insertar automáticamente.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

