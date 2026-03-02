<?php
/**
 * Vista del Meta Box en el editor de posts/páginas.
 *
 * IMPORTANTE: Todos los <button> deben tener type="button"
 * porque están dentro del form de WordPress. Sin eso, el
 * navegador los trata como type="submit" y recarga la página.
 *
 * @var WP_Post $post
 * @var string  $post_url
 * @var string  $saved_keyword
 * @var string  $saved_score
 * @var string  $analysis_date
 * @var string  $last_analysis  (JSON)
 */
defined( 'ABSPATH' ) || exit;

$opts    = get_option( DSEO_OPTION_KEY, array() );
$has_key = ! empty( $opts['api_key'] );
// wp_localize_script ya se ejecutó en admin_enqueue_scripts con post_url y post_id correctos.
?>

<div class="dseo-metabox" id="dseo-metabox"
     data-post-url="<?php echo esc_url( $post_url ); ?>"
     data-post-id="<?php echo esc_attr( $post->ID ); ?>"
     data-last-generated='<?php echo esc_attr( $last_generated ); ?>'
     data-last-product='<?php echo esc_attr( $last_product ); ?>'>

    <?php if ( ! $has_key ) : ?>
    <div class="dseo-notice dseo-notice-warn">
        ⚠️ API key no configurada.
        <a href="<?php echo esc_url( admin_url( 'options-general.php?page=diagnosticoseo' ) ); ?>">Configura el plugin →</a>
    </div>
    <?php endif; ?>

    <!-- Tabs: type="button" es OBLIGATORIO dentro de un <form> -->
    <div class="dseo-tabs">
        <button type="button" class="dseo-tab dseo-tab-active" data-tab="analyze">🔍 Analizar SEO</button>
        <button type="button" class="dseo-tab" data-tab="generate">✨ Generar Contenido</button>
        <button type="button" class="dseo-tab" data-tab="product">🛒 Ficha de Producto</button>
        <button type="button" class="dseo-tab" data-tab="schema">🗂️ Schema Markup</button>
        <?php if ( $saved_score ) : ?>
        <button type="button" class="dseo-tab" data-tab="results">📊 Último Resultado</button>
        <?php endif; ?>
    </div>

    <!-- Tab: Analyze -->
    <div class="dseo-tab-content" data-content="analyze">
        <div class="dseo-row">
            <div class="dseo-field-group">
                <label for="dseo-analyze-url">URL a analizar</label>
                <input type="url" id="dseo-analyze-url"
                       value="<?php echo esc_url( $post_url ); ?>"
                       placeholder="https://…" />
            </div>
            <button type="button" id="dseo-analyze-btn"
                    class="dseo-btn dseo-btn-primary"
                    <?php disabled( ! $has_key ); ?>>
                🔍 Analizar
            </button>
        </div>

        <div id="dseo-analyze-result" style="display:none;">
            <!-- Score circular -->
            <div class="dseo-score-wrap">
                <div class="dseo-score-circle">
                    <svg viewBox="0 0 120 120" class="dseo-score-svg">
                        <circle cx="60" cy="60" r="50" class="dseo-score-bg" />
                        <circle cx="60" cy="60" r="50" class="dseo-score-fill" id="dseo-score-ring" />
                    </svg>
                    <div class="dseo-score-number" id="dseo-score-num">—</div>
                </div>
                <div class="dseo-score-meta">
                    <div class="dseo-score-label">Score SEO</div>
                    <div id="dseo-score-business" class="dseo-score-sub"></div>
                    <div id="dseo-score-plan" class="dseo-score-plan"></div>
                </div>
            </div>

            <!-- Secciones técnico / on-page / contenido -->
            <div class="dseo-sections" id="dseo-sections"></div>

            <!-- Quick wins -->
            <div id="dseo-quick-wins-wrap" style="display:none;">
                <div class="dseo-section-title">⚡ Quick Wins</div>
                <div id="dseo-quick-wins"></div>
            </div>

            <!-- Competidores -->
            <div id="dseo-competitors-wrap" style="display:none;">
                <div class="dseo-section-title">🏆 Competidores detectados</div>
                <div id="dseo-competitors"></div>
            </div>
        </div>

        <div id="dseo-analyze-loading" style="display:none;" class="dseo-loading">
            <div class="dseo-spinner"></div>
            <span>Analizando con GPT-4o…</span>
        </div>
        <div id="dseo-analyze-error" style="display:none;" class="dseo-notice dseo-notice-error"></div>
    </div>

    <!-- Tab: Generate -->
    <div class="dseo-tab-content" data-content="generate" style="display:none;">
        <div class="dseo-alert dseo-alert-info">
            ✨ Genera H1, H2, H3, párrafos, imágenes y schema markup optimizados.
            <strong>Requiere plan Pro / Agency.</strong>
        </div>

        <div class="dseo-row">
            <div class="dseo-field-group" style="flex:2">
                <label for="dseo-keyword">Keyword principal</label>
                <input type="text" id="dseo-keyword"
                       value="<?php echo esc_attr( $saved_keyword ); ?>"
                       placeholder="ej: taller mecánico santiago" />
                <!-- Hidden para que WP guarde la keyword al hacer Save -->
                <input type="hidden" name="dseo_primary_keyword" id="dseo-keyword-hidden"
                       value="<?php echo esc_attr( $saved_keyword ); ?>" />
            </div>
            <div class="dseo-field-group">
                <label for="dseo-country">País</label>
                <select id="dseo-country">
                    <option value="Chile">Chile</option>
                    <option value="Argentina">Argentina</option>
                    <option value="México">México</option>
                    <option value="Colombia">Colombia</option>
                    <option value="España">España</option>
                    <option value="Peru">Perú</option>
                </select>
            </div>
        </div>

        <button type="button" id="dseo-generate-btn"
                class="dseo-btn dseo-btn-success"
                <?php disabled( ! $has_key ); ?>>
            ✨ Generar Contenido SEO
        </button>

        <div id="dseo-generate-loading" style="display:none;" class="dseo-loading">
            <div class="dseo-spinner dseo-spinner-purple"></div>
            <span>GPT-4o generando contenido… (puede tardar 20-40 seg)</span>
        </div>
        <div id="dseo-generate-error" style="display:none;" class="dseo-notice dseo-notice-error"></div>

        <div id="dseo-generate-result" style="display:none;">
            <div class="dseo-result-header">
                <div class="dseo-result-title">✅ Contenido generado</div>
                <button type="button" id="dseo-insert-all" class="dseo-btn dseo-btn-primary">
                    📋 Insertar en el Editor
                </button>
                <button type="button" id="dseo-copy-all-html" class="dseo-btn dseo-btn-ghost">
                    🔤 Copiar todo (HTML)
                </button>
            </div>

            <!-- Title + Meta -->
            <div class="dseo-generated-block">
                <div class="dseo-gen-label">Title Tag</div>
                <div class="dseo-gen-content" id="gen-title"></div>
                <button type="button" class="dseo-copy-btn" data-target="gen-title">📋 Copiar</button>
            </div>
            <div class="dseo-generated-block">
                <div class="dseo-gen-label">Meta Description</div>
                <div class="dseo-gen-content" id="gen-meta"></div>
                <button type="button" class="dseo-copy-btn" data-target="gen-meta">📋 Copiar</button>
            </div>
            <div class="dseo-generated-block">
                <div class="dseo-gen-label">H1</div>
                <div class="dseo-gen-content" id="gen-h1"></div>
                <button type="button" class="dseo-copy-btn" data-target="gen-h1">📋 Copiar</button>
            </div>
            <div class="dseo-generated-block">
                <div class="dseo-gen-label">Intro</div>
                <div class="dseo-gen-content" id="gen-intro"></div>
                <button type="button" class="dseo-copy-btn" data-target="gen-intro">📋 Copiar</button>
            </div>

            <!-- Secciones H2 → H3 -->
            <div class="dseo-gen-label" style="margin-top:16px">Secciones H2 → H3</div>
            <div id="gen-sections"></div>

            <!-- Schema Markup -->
            <div class="dseo-generated-block">
                <div class="dseo-gen-label">Schema Markup (JSON-LD)</div>
                <pre class="dseo-gen-code" id="gen-schema"></pre>
                <button type="button" class="dseo-copy-btn" data-target="gen-schema">📋 Copiar JSON-LD</button>
            </div>

            <!-- Stats -->
            <div class="dseo-gen-stats" id="gen-stats"></div>
        </div>
    </div>

    <!-- Tab: Product -->
    <div class="dseo-tab-content" data-content="product" style="display:none;">
        <div class="dseo-alert dseo-alert-info">
            🛒 Optimiza tu ficha de producto para Google Shopping y SEO.
        </div>
        <div class="dseo-field-group" style="margin-bottom:12px;">
            <label for="dseo-product-name">Nombre del Producto</label>
            <input type="text" id="dseo-product-name" placeholder="ej: Zapatilla Nike Air Max 270" />
        </div>
        <div class="dseo-field-group">
            <label for="dseo-product-keywords">Palabras de búsqueda (separadas por coma)</label>
            <input type="text" id="dseo-product-keywords" placeholder="ej: zapatillas running, nike air max, calzado deportivo" />
        </div>
        <button type="button" id="dseo-product-btn" class="dseo-btn dseo-btn-success" style="margin-top:12px;" <?php disabled( ! $has_key ); ?>>
            🚀 Generar Ficha Optimizada
        </button>

        <div id="dseo-product-loading" style="display:none;" class="dseo-loading">
            <div class="dseo-spinner dseo-spinner-orange"></div>
            <span>Optimizando producto…</span>
        </div>
        <div id="dseo-product-error" style="display:none;" class="dseo-notice dseo-notice-error"></div>

        <div id="dseo-product-result" style="display:none; margin-top:20px;">
            <div class="dseo-generated-block">
                <div class="dseo-gen-label">Nombre Optimizado</div>
                <div class="dseo-gen-content" id="product-name-res"></div>
                <button type="button" class="dseo-copy-btn" data-target="product-name-res">📋 Copiar</button>
            </div>
            <div class="dseo-generated-block">
                <div class="dseo-gen-label">Descripción Corta</div>
                <div class="dseo-gen-content" id="product-short-res"></div>
                <button type="button" class="dseo-copy-btn" data-target="product-short-res">📋 Copiar</button>
            </div>
            <div class="dseo-generated-block">
                <div class="dseo-gen-label">Descripción Larga</div>
                <div class="dseo-gen-content" id="product-long-res"></div>
                <button type="button" class="dseo-copy-btn" data-target="product-long-res">📋 Copiar</button>
            </div>
            <div id="product-features-res"></div>
        </div>
    </div>

    <!-- Tab: Schema -->
    <div class="dseo-tab-content" data-content="schema" style="display:none;">
        <div class="dseo-alert dseo-alert-success">
            🗂️ Pega aquí el código JSON-LD de Schema Markup. El plugin lo inyectará automáticamente en el <code>&lt;head&gt;</code> de esta página.
        </div>
        <div class="dseo-field-group">
            <label for="dseo-schema-editor">Código JSON-LD</label>
            <textarea name="dseo_schema" id="dseo-schema-editor" rows="10" 
                      class="dseo-textarea-code" 
                      placeholder='{ "@context": "https://schema.org", ... }'><?php echo esc_textarea( $saved_schema ); ?></textarea>
        </div>
        <p class="dseo-hint">
            Puedes generar este código en la pestaña "Generar Contenido" y pegarlo aquí, o pegarlo manualmente desde otra fuente.
        </p>
    </div>

    <!-- Tab: Último Resultado guardado -->
    <?php if ( $saved_score ) : ?>
    <div class="dseo-tab-content" data-content="results" style="display:none;">
        <div class="dseo-notice dseo-notice-info">
            📅 Último análisis: <strong><?php echo esc_html( $analysis_date ); ?></strong>
        </div>
        <div class="dseo-saved-score">
            <div class="dseo-saved-score-num" style="color:<?php echo intval( $saved_score ) >= 70 ? '#10b981' : ( intval( $saved_score ) >= 40 ? '#f59e0b' : '#ef4444' ); ?>">
                <?php echo esc_html( $saved_score ); ?>/100
            </div>
            <div>Score guardado del último análisis</div>
        </div>
    </div>
    <?php endif; ?>

</div>
