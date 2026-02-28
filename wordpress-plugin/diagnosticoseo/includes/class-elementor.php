<?php
defined( 'ABSPATH' ) || exit;

/**
 * Clase para la integracion con Elementor.
 */
class DSEO_Elementor {

    public static function init() {
        add_action( 'elementor/widgets/register', array( 'DSEO_Elementor', 'register_widgets' ) );
        add_action( 'elementor/elements/categories_registered', array( 'DSEO_Elementor', 'add_widget_category' ) );
        add_action( 'elementor/editor/after_enqueue_scripts', array( 'DSEO_Elementor', 'enqueue_editor_scripts' ) );
    }

    public static function add_widget_category( $elements_manager ) {
        $elements_manager->add_category(
            'diagnosticoseo',
            array(
                'title' => 'DiagnosticoSEO',
                'icon'  => 'eicon-search',
            )
        );
    }

    public static function register_widgets( $widgets_manager ) {
        if ( ! class_exists( '\Elementor\Widget_Base' ) ) {
            return;
        }

        $widget_path = DSEO_PLUGIN_DIR . 'includes/elementor/widgets/class-widget-seo.php';
        if ( file_exists( $widget_path ) ) {
            require_once $widget_path;
            if ( class_exists( '\DSEO_SEO_Widget' ) ) {
                $widgets_manager->register( new \DSEO_SEO_Widget() );
            }
        }
    }

    public static function enqueue_editor_scripts() {
        $opts = get_option( 'diagnosticoseo_settings', array() );
        $base_url = ! empty( $opts['base_url'] ) ? $opts['base_url'] : 'https://diagnostico-seo.vercel.app';

        wp_enqueue_script(
            'dseo-admin-js',
            DSEO_PLUGIN_URL . 'admin/js/admin.js',
            array( 'jquery' ),
            DSEO_VERSION,
            true
        );

        wp_localize_script( 'dseo-admin-js', 'DSEO', array(
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'dseo_nonce' ),
            'post_id'  => get_the_ID(),
            'post_url' => get_permalink( get_the_ID() ),
            'timeout'  => 90000,
            'base_url' => $base_url
        ) );
    }
}
