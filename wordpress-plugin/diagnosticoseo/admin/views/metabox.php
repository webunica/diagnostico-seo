<?php
/**
 * Vista del Meta Box en el editor de posts/páginas.
 *
 * Variables disponibles (inyectadas desde DSEO_Metabox::render):
 * @var WP_Post $post
 * @var string  $post_url
 * @var string  $saved_keyword
 * @var string  $saved_score
 * @var string  $analysis_date
 * @var string  $last_analysis  (JSON)
 */
defined( 'ABSPATH' ) || exit;

$opts    = get_option( DSEO_OPTION_KEY, [] );
$has_key = ! empty( $opts['api_key'] );
// NOTA: no llamar wp_localize_script aquí — ya se hizo en admin_enqueue_scripts
// El objeto DSEO ya contiene ajax_url, nonce, post_url y post_id correctos.
?>

<div class="dseo-metabox" id="dseo-metabox" data-post-url="<?php echo esc_url( $post_url ); ?>" data-post-id="<?php echo esc_attr( $post->ID ); ?>">

    <?php if ( ! $has_key ) : ?>
    <div class="dseo-notice dseo-notice-warn">
        ⚠️ API key no configurada.
        <a href="<?php echo esc_url( admin_url( 'options-general.php?page=diagnosticoseo' ) ); ?>">Configura el plugin →</a>
    </div>
    <?php endif; ?>

    <!-- Tabs -->
    <div class="dseo-tabs">
        <button class="dseo-tab dseo-tab-active" data-tab="analyze">🔍 Analizar SEO</button>
        <button class="dseo-tab" data-tab="generate">✨ Generar Contenido</button>
        <?php if ( $saved_score ) : ?>
        <button class="dseo-tab" data-tab="results">📊 Último Resultado</button>
        <?php endif; ?>
    </div>

    <!-- Tab: Analyze -->
    <div class="dseo-tab-content" data-content="analyze">
        <div class="dseo-row">
            <div class="dseo-field-group">
                <label>URL a analizar</label>
                <input type="url" id="dseo-analyze-url" value="<?php echo esc_url( $post_url ); ?>" placeholder="https://…" />
            </div>
            <button type="button" id="dseo-analyze-btn" class="dseo-btn dseo-btn-primary" <?php disabled( ! $has_key ); ?>>
                🔍 Analizar
            </button>
        </div>

        <div id="dseo-analyze-result" style="display:none;">
            <!-- Score -->
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

            <!-- Sections scores -->
            <div class="dseo-sections" id="dseo-sections"></div>

            <!-- Quick wins -->
            <div id="dseo-quick-wins-wrap" style="display:none;">
                <div class="dseo-section-title">⚡ Quick Wins</div>
                <div id="dseo-quick-wins"></div>
            </div>

            <!-- Competitors -->
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
            ✨ Genera H1, H2, H3, párrafos, imágenes y schema markup optimizados. <strong>Requiere plan Pro / Agency.</strong>
        </div>

        <div class="dseo-row">
            <div class="dseo-field-group" style="flex:2">
                <label>Keyword principal</label>
                <input type="text" id="dseo-keyword" value="<?php echo esc_attr( $saved_keyword ); ?>"
                       placeholder="ej: taller mecánico santiago" />
                <input type="hidden" name="dseo_primary_keyword" id="dseo-keyword-hidden"
                       value="<?php echo esc_attr( $saved_keyword ); ?>" />
            </div>
            <div class="dseo-field-group">
                <label>País</label>
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

        <button type="button" id="dseo-generate-btn" class="dseo-btn dseo-btn-success" <?php disabled( ! $has_key ); ?>>
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
            </div>

            <!-- Title + Meta -->
            <div class="dseo-generated-block">
                <div class="dseo-gen-label">Title Tag</div>
                <div class="dseo-gen-content" id="gen-title"></div>
                <button class="dseo-copy-btn" data-target="gen-title">📋 Copiar</button>
            </div>
            <div class="dseo-generated-block">
                <div class="dseo-gen-label">Meta Description</div>
                <div class="dseo-gen-content" id="gen-meta"></div>
                <button class="dseo-copy-btn" data-target="gen-meta">📋 Copiar</button>
            </div>
            <div class="dseo-generated-block">
                <div class="dseo-gen-label">H1</div>
                <div class="dseo-gen-content" id="gen-h1"></div>
                <button class="dseo-copy-btn" data-target="gen-h1">📋 Copiar</button>
            </div>
            <div class="dseo-generated-block">
                <div class="dseo-gen-label">Intro</div>
                <div class="dseo-gen-content" id="gen-intro"></div>
                <button class="dseo-copy-btn" data-target="gen-intro">📋 Copiar</button>
            </div>

            <!-- H2 Sections -->
            <div class="dseo-gen-label" style="margin-top:16px">Secciones H2 → H3</div>
            <div id="gen-sections"></div>

            <!-- Schema -->
            <div class="dseo-generated-block">
                <div class="dseo-gen-label">Schema Markup (JSON-LD)</div>
                <pre class="dseo-gen-code" id="gen-schema"></pre>
                <button class="dseo-copy-btn" data-target="gen-schema">📋 Copiar JSON-LD</button>
            </div>

            <!-- Word count -->
            <div class="dseo-gen-stats" id="gen-stats"></div>
        </div>
    </div>

    <!-- Tab: Last Result -->
    <?php if ( $saved_score ) : ?>
    <div class="dseo-tab-content" data-content="results" style="display:none;">
        <div class="dseo-notice dseo-notice-info">
            📅 Último análisis: <strong><?php echo esc_html( $analysis_date ); ?></strong>
        </div>
        <div class="dseo-saved-score">
            <div class="dseo-saved-score-num" style="color:<?php echo intval($saved_score) >= 70 ? '#10b981' : ( intval($saved_score) >= 40 ? '#f59e0b' : '#ef4444' ); ?>">
                <?php echo esc_html( $saved_score ); ?>/100
            </div>
            <div>Score guardado del último análisis</div>
        </div>
    </div>
    <?php endif; ?>

</div>
