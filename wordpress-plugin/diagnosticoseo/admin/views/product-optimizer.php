<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wrap dseo-settings-wrap">
    <div class="dseo-settings-header">
        <h1>🛒 Optimizador de Productos</h1>
        <p class="dseo-tagline">Genera nombres, descripciones y especificaciones técnicas optimizadas para SEO en tus productos de WooCommerce o E-commerce.</p>
    </div>

    <?php
    $opts = get_option( DSEO_OPTION_KEY, array() );
    $has_key = ! empty( $opts['api_key'] );
    ?>

    <?php if ( ! $has_key ) : ?>
        <div class="notice notice-warning inline">
            <p>Debes configurar tu <strong>API Key</strong> en la <a href="<?php echo admin_url('admin.php?page=diagnosticoseo'); ?>">página de ajustes</a> para usar esta herramienta.</p>
        </div>
    <?php endif; ?>

    <div class="dseo-settings-grid">
        
        <!-- Formulario del Optimizador -->
        <div class="dseo-card">
            <div class="dseo-card-header">🚀 Generar Ficha Optimizada</div>
            <div class="dseo-field">
                <label for="dseo-product-name">Nombre del Producto / Modelo</label>
                <input type="text" id="dseo-product-name" placeholder="ej: Smartwatch Samsung Galaxy Watch 6" />
                <p class="dseo-hint">Ingresa el nombre base del producto que deseas optimizar.</p>
            </div>

            <div class="dseo-field">
                <label for="dseo-product-keywords">Keywords (separadas por coma)</label>
                <input type="text" id="dseo-product-keywords" placeholder="ej: smartwatch, reloj inteligente, samsung watch" />
                <p class="dseo-hint">Keywords estratégicas para incluir en el contenido.</p>
            </div>

            <div class="dseo-field">
                <label for="dseo-product-country">País / Mercado</label>
                <select id="dseo-product-country">
                    <option value="Chile">Chile</option>
                    <option value="México">México</option>
                    <option value="España">España</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Colombia">Colombia</option>
                </select>
            </div>

            <button type="button" id="dseo-btn-generate-product-standalone" class="dseo-btn dseo-btn-primary dseo-btn-full" <?php disabled( ! $has_key ); ?>>
                ✨ Generar Ficha con IA
            </button>
            <div id="dseo-product-loader" class="dseo-loader-wrap" style="display:none;margin-top:15px;text-align:center;">
                <span class="spinner is-active" style="float:none;"></span>
                <p>Generando contenido optimizado...</p>
            </div>
            <div id="dseo-product-error" style="display:none;margin-top:10px;color:red;font-weight:700;"></div>
        </div>

        <!-- Resultados -->
        <div class="dseo-card" id="dseo-product-results-card" style="display:none;">
            <div class="dseo-card-header">📊 Contenido Generado</div>
            
            <div class="dseo-result-section">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <label style="font-weight:800;font-size:0.75rem;text-transform:uppercase;">Nombre de Producto SEO</label>
                    <button type="button" class="dseo-copy-btn dseo-btn-ghost" data-target="dseo-res-name">Copiar</button>
                </div>
                <div id="dseo-res-name" class="dseo-copyable-box" style="font-size:1.1rem;font-weight:900;"></div>
            </div>

            <div class="dseo-result-section" style="margin-top:20px;">
                <label style="font-weight:800;font-size:0.75rem;text-transform:uppercase;margin-bottom:8px;display:block;">Descripción Corta / Extracto</label>
                <div id="dseo-res-short" class="dseo-copyable-box" style="font-style:italic;"></div>
                <button type="button" class="dseo-copy-btn dseo-btn-ghost" data-target="dseo-res-short" style="margin-top:8px;">Copiar Extracto</button>
            </div>

            <div class="dseo-result-section" style="margin-top:20px;">
                <label style="font-weight:800;font-size:0.75rem;text-transform:uppercase;margin-bottom:8px;display:block;">Descripción Larga / Detalles</label>
                <div id="dseo-res-long" class="dseo-copyable-box dseo-scrollable-box" style="white-space:pre-wrap;"></div>
                <button type="button" class="dseo-copy-btn dseo-btn-ghost" data-target="dseo-res-long" style="margin-top:8px;">Copiar Descripción</button>
            </div>

            <div class="dseo-result-section" style="margin-top:20px;">
                <label style="font-weight:800;font-size:0.75rem;text-transform:uppercase;margin-bottom:8px;display:block;">Ficha Técnica</label>
                <div id="dseo-res-specs" class="dseo-copyable-box"></div>
                <button type="button" class="dseo-copy-btn dseo-btn-ghost" data-target="dseo-res-specs" style="margin-top:8px;">Copiar Especificaciones</button>
            </div>
        </div>

    </div>
</div>
