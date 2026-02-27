<?php
defined( 'ABSPATH' ) || exit;

/**
 * Meta box en el editor de posts/páginas.
 */
class DSEO_Metabox {

    public static function init(): void {
        add_action( 'add_meta_boxes', [ __CLASS__, 'register' ] );
        add_action( 'save_post',      [ __CLASS__, 'save_meta' ], 10, 2 );
    }

    public static function register(): void {
        $post_types = apply_filters( 'dseo_post_types', [ 'post', 'page' ] );

        foreach ( $post_types as $type ) {
            add_meta_box(
                'dseo_metabox',
                '🔍 DiagnósticoSEO — Análisis y Contenido',
                [ __CLASS__, 'render' ],
                $type,
                'normal',   // Position: normal (below editor)
                'high'      // Priority
            );
        }
    }

    public static function render( WP_Post $post ): void {
        wp_nonce_field( 'dseo_save_meta_' . $post->ID, 'dseo_meta_nonce' );

        $post_url       = get_permalink( $post->ID ) ?: trailingslashit( get_site_url() );
        $last_analysis  = get_post_meta( $post->ID, '_dseo_last_analysis',   true );
        $analysis_date  = get_post_meta( $post->ID, '_dseo_analysis_date',   true );
        $saved_keyword  = get_post_meta( $post->ID, '_dseo_primary_keyword', true );
        $saved_score    = '';

        if ( $last_analysis ) {
            $parsed      = json_decode( $last_analysis, true );
            $saved_score = $parsed['score'] ?? '';
        }

        require_once DSEO_PLUGIN_DIR . 'admin/views/metabox.php';
    }

    public static function save_meta( int $post_id, WP_Post $post ): void {
        if (
            ! isset( $_POST['dseo_meta_nonce'] ) ||
            ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['dseo_meta_nonce'] ) ), 'dseo_save_meta_' . $post_id ) ||
            defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ||
            ! current_user_can( 'edit_post', $post_id )
        ) {
            return;
        }

        if ( isset( $_POST['dseo_primary_keyword'] ) ) {
            update_post_meta( $post_id, '_dseo_primary_keyword', sanitize_text_field( $_POST['dseo_primary_keyword'] ) );
        }
    }
}
