<?php defined( 'ABSPATH' ) || exit; ?>
<div class="dseo-widget">
    <?php if ( ! $has_key ) : ?>
        <div class="dseo-notice dseo-notice-warn">
            ⚠️ API key no configurada.
            <a href="<?php echo esc_url( admin_url( 'options-general.php?page=diagnosticoseo' ) ); ?>">Configurar →</a>
        </div>
    <?php else : ?>
        <p style="margin:0 0 12px;color:#666;font-size:13px;">
            Analiza tu sitio o genera contenido SEO desde cualquier post o página.
        </p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="<?php echo esc_url( admin_url( 'post-new.php?post_type=page' ) ); ?>"
               class="button button-primary">
                ✨ Nueva página optimizada
            </a>
            <a href="<?php echo esc_url( admin_url( 'options-general.php?page=diagnosticoseo' ) ); ?>"
               class="button">
                ⚙️ Configuración
            </a>
        </div>
        <hr style="margin:14px 0 10px;border-color:#eee;">
        <p style="margin:0;font-size:11px;color:#999;">
            Sitio: <strong><?php echo esc_html( $site ); ?></strong><br>
            Plan detectado en cada análisis. Ver dashboard →
            <a href="https://diagnosticoseo.vercel.app/dashboard" target="_blank">diagnosticoseo.vercel.app</a>
        </p>
    <?php endif; ?>
</div>
