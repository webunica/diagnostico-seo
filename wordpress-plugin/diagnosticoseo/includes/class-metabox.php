<?php
defined( 'ABSPATH' ) || exit;

/**
 * Meta box en el editor de posts/paginas.
 */
class DSEO_Metabox {

    public static function init() {
        add_action( 'add_meta_boxes', array( 'DSEO_Metabox', 'register' ) );
        add_action( 'save_post',      array( 'DSEO_Metabox', 'save_meta' ), 10, 2 );
        add_action( 'wp_head',        array( 'DSEO_Metabox', 'output_schema_frontend' ) );
    }

    public static function register() {
        $post_types = apply_filters( 'dseo_post_types', array( 'post', 'page' ) );

        foreach ( $post_types as $type ) {
            add_meta_box(
                'dseo_metabox',
                'DiagnosticoSEO - Analisis y Contenido',
                array( 'DSEO_Metabox', 'render' ),
                $type,
                'normal',
                'high'
            );
        }
    }

    public static function render( $post ) {
        wp_nonce_field( 'dseo_save_meta_' . $post->ID, 'dseo_meta_nonce' );

        $post_url       = get_permalink( $post->ID ) ? get_permalink( $post->ID ) : trailingslashit( get_site_url() );
        $last_analysis  = get_post_meta( $post->ID, '_dseo_last_analysis',   true );
        $analysis_date  = get_post_meta( $post->ID, '_dseo_analysis_date',   true );
        $saved_keyword  = get_post_meta( $post->ID, '_dseo_primary_keyword', true );
        $saved_schema   = get_post_meta( $post->ID, '_dseo_schema',          true );
        $last_generated = get_post_meta( $post->ID, '_dseo_generated_content', true );
        $saved_score    = '';

        if ( $last_analysis ) {
            $parsed      = json_decode( $last_analysis, true );
            $saved_score = isset( $parsed['score'] ) ? $parsed['score'] : '';
        }

        require_once DSEO_PLUGIN_DIR . 'admin/views/metabox.php';
    }

    public static function save_meta( $post_id, $post ) {
        if (
            ! isset( $_POST['dseo_meta_nonce'] ) ||
            ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['dseo_meta_nonce'] ) ), 'dseo_save_meta_' . $post_id ) ||
            (defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE) ||
            ! current_user_can( 'edit_post', $post_id )
        ) {
            return;
        }

        if ( isset( $_POST['dseo_primary_keyword'] ) ) {
            update_post_meta( $post_id, '_dseo_primary_keyword', sanitize_text_field( $_POST['dseo_primary_keyword'] ) );
        }

        if ( isset( $_POST['dseo_schema'] ) ) {
            $schema = wp_unslash( $_POST['dseo_schema'] );
            update_post_meta( $post_id, '_dseo_schema', $schema );
        }
    }

    /**
     * Imprime el Schema Markup en el <head> del frontend.
     */
    public static function output_schema_frontend() {
        if ( ! is_singular() ) {
            return;
        }

        $post_id = get_the_ID();
        $schema  = get_post_meta( $post_id, '_dseo_schema', true );

        if ( empty( $schema ) ) {
            return;
        }

        echo "\n<!-- DiagnosticoSEO Schema Markup -->\n";
        echo '<script type="application/ld+json">' .  $schema . "</script>\n";
        echo "<!-- /DiagnosticoSEO Schema Markup -->\n\n";
    }
}
