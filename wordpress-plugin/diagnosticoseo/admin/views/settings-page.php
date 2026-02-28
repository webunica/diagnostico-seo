<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap dseo-settings-wrap">
    <div class="dseo-settings-header">
        <h1><span class="dseo-icon">ðŸ”</span> DiagnÃ³sticoSEO</h1>
        <p class="dseo-tagline">Integra anÃ¡lisis SEO y generaciÃ³n de contenido con GPT-4o directamente en WordPress.</p>
    </div>

    <?php settings_errors(); ?>

    <?php
    $opts    = get_option( DSEO_OPTION_KEY, [] );
    $api_key = $opts['api_key']  ?? '';
    $base    = $opts['base_url'] ?? 'https://diagnostico-seo.vercel.app';
    ?>

    <div class="dseo-settings-grid">

        <!-- ConfiguraciÃ³n -->
        <div class="dseo-card">
            <div class="dseo-card-header">âš™ï¸ ConfiguraciÃ³n de API</div>
            <form method="post" action="options.php">
                <?php settings_fields( 'diagnosticoseo_group' ); ?>

                <div class="dseo-field">
                    <label for="dseo_api_key">API Key</label>
                    <div class="dseo-input-row">
                        <input type="password" id="dseo_api_key"
                               name="<?php echo esc_attr( DSEO_OPTION_KEY ); ?>[api_key]"
                               value="<?php echo esc_attr( $api_key ); ?>"
                               placeholder="sk_live_â€¦"
                               autocomplete="off" />
                        <button type="button" id="dseo-toggle-key" class="dseo-btn dseo-btn-ghost">
                            ðŸ‘ Mostrar
                        </button>
                    </div>
                    <p class="dseo-hint">
                        ObtÃ©n tu API key en <a href="https://diagnostico-seo.vercel.app/dashboard" target="_blank">diagnostico-seo.vercel.app/dashboard</a>
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
                        ðŸ”Œ Probar conexiÃ³n
                    </button>
                </div>
                <div id="dseo-test-result" style="display:none;margin-top:10px;"></div>
            </form>
        </div>

        <!-- Planes -->
        <div class="dseo-card">
            <div class="dseo-card-header">ðŸ“¦ Planes disponibles</div>
            <table class="dseo-plans-table">
                <thead>
                    <tr><th>Plan</th><th>Requests/mes</th><th>Precio</th><th>Endpoints</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span class="dseo-badge dseo-badge-starter">Starter</span></td>
                        <td>10</td>
                        <td><strong>Gratis</strong></td>
                        <td>AnÃ¡lisis SEO</td>
                    </tr>
                    <tr>
                        <td><span class="dseo-badge dseo-badge-pro">Pro</span></td>
                        <td>100</td>
                        <td>$29 USD/mes</td>
                        <td>AnÃ¡lisis + Generar contenido</td>
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
                Obtener / Gestionar mi API Key â†’
            </a>
        </div>

        <!-- CÃ³mo funciona -->
        <div class="dseo-card dseo-card-full">
            <div class="dseo-card-header">ðŸ’¡ CÃ³mo usar el plugin</div>
            <div class="dseo-steps">
                <div class="dseo-step">
                    <div class="dseo-step-num">1</div>
                    <div>
                        <strong>ObtÃ©n tu API key</strong>
                        <p>Ve a <a href="https://diagnostico-seo.vercel.app/dashboard" target="_blank">diagnostico-seo.vercel.app/dashboard</a>, ingresa tu email y genera una key gratuita.</p>
                    </div>
                </div>
                <div class="dseo-step">
                    <div class="dseo-step-num">2</div>
                    <div>
                        <strong>Configura el plugin</strong>
                        <p>Pega la API key aquÃ­ arriba y guarda. Usa "Probar conexiÃ³n" para verificar.</p>
                    </div>
                </div>
                <div class="dseo-step">
                    <div class="dseo-step-num">3</div>
                    <div>
                        <strong>Edita cualquier post o pÃ¡gina</strong>
                        <p>VerÃ¡s el panel <strong>DiagnÃ³sticoSEO</strong> debajo del editor. Analiza la URL o genera contenido optimizado con un clic.</p>
                    </div>
                </div>
                <div class="dseo-step">
                    <div class="dseo-step-num">4</div>
                    <div>
                        <strong>Aplica el contenido</strong>
                        <p>El plugin genera H1, H2, H3, pÃ¡rrafos, alt text de imÃ¡genes y schema markup listos para copiar o insertar automÃ¡ticamente.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

