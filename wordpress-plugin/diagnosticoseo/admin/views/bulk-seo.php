<?php
defined( 'ABSPATH' ) || exit;

// Asegurarse de que sÃ³lo admins puedan ver esto
if ( ! current_user_can( 'manage_options' ) ) {
    return;
}

// Obtener posts que NO tienen metadata SEO generada, o que su status es published y queremos optimizarlos.
$args = array(
    'post_type'      => array( 'post', 'page' ),
    'post_status'    => 'publish',
    'posts_per_page' => 50,
    'meta_query'     => array(
        array(
            'key'     => '_dseo_generated_content',
            'compare' => 'NOT EXISTS',
        ),
    ),
);
$query = new WP_Query( $args );
$posts = $query->posts;
?>
<div class="wrap dseo-wrap">
    <div class="dseo-header">
        <div class="dseo-header-logo">
            <span class="dashicons dashicons-chart-line"></span>
            <h1>SEO DiagnÃ³stico - GeneraciÃ³n Masiva</h1>
        </div>
        <p>Genera tÃ­tulos, descripciones, schemas y mÃ¡s para mÃºltiples entradas con un solo clic usando IA.</p>
    </div>

    <div class="dseo-body">
        <div class="dseo-card">
            <h2>Entradas sin Optimizar (<?= count($posts) ?> encontradas)</h2>
            <p>Selecciona los posts que deseas optimizar en lote. Se usarÃ¡ el tÃ­tulo del post como Palabra Clave Principal para guiar la IA.</p>

            <div class="dseo-field" style="max-width:300px; margin-bottom:20px;">
                <label for="dseo-bulk-country">PaÃ­s objetivo (Idioma):</label>
                <select id="dseo-bulk-country" class="dseo-input">
                    <option value="Chile">Chile (EspaÃ±ol)</option>
                    <option value="Mexico">MÃ©xico (EspaÃ±ol)</option>
                    <option value="Spain">EspaÃ±a (EspaÃ±ol)</option>
                    <option value="US">Estados Unidos (InglÃ©s)</option>
                </select>
            </div>

            <?php if ( empty( $posts ) ) : ?>
                <div class="dseo-notice dseo-notice-success">
                    âœ… Â¡Genial! Todas tus pÃ¡ginas y posts publicados parecen tener metadata generada con SEO DiagnÃ³stico.
                </div>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <td id="cb" class="manage-column column-cb check-column">
                                <label class="screen-reader-text" for="cb-select-all-1">Select All</label>
                                <input id="cb-select-all-1" type="checkbox" checked>
                            </td>
                            <th scope="col" class="manage-column">TÃ­tulo</th>
                            <th scope="col" class="manage-column">Tipo</th>
                            <th scope="col" class="manage-column column-date">Estado</th>
                        </tr>
                    </thead>
                    <tbody id="dseo-bulk-list">
                        <?php foreach ( $posts as $p ) : ?>
                            <tr id="dseo-bulk-row-<?= $p->ID ?>">
                                <th scope="row" class="check-column">
                                    <input type="checkbox" class="dseo-bulk-item" value="<?= $p->ID ?>" checked>
                                </th>
                                <td>
                                    <strong><a href="<?= get_edit_post_link($p->ID) ?>" target="_blank"><?= esc_html( $p->post_title ) ?></a></strong>
                                    <br><small><?= esc_html( get_permalink($p->ID) ) ?></small>
                                </td>
                                <td><?= esc_html( $p->post_type ) ?></td>
                                <td class="dseo-bulk-status"><span style="color:#6b7280;">Pendiente</span></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

                <div style="margin-top:20px;">
                    <button id="dseo-bulk-start-btn" class="dseo-btn dseo-btn-primary">
                        âš¡ Iniciar GeneraciÃ³n Masiva
                    </button>
                    <span id="dseo-bulk-progress" style="display:none; margin-left:15px; font-weight:bold; color:var(--dseo-primary);">Procesando...</span>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
