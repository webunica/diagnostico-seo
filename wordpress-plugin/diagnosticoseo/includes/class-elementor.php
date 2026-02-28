<?php
defined( 'ABSPATH' ) || exit;

/**
 * Integracion con Elementor.
 */
class DSEO_Elementor {

    public static function init() {
        // Solo registrar hooks si Elementor esta activo
        add_action( 'elementor/widgets/register', [ __CLASS__, 'register_widgets' ] );
        add_action( 'elementor/elements/categories_registered', [ __CLASS__, 'add_widget_category' ] );
        add_action( 'elementor/editor/after_enqueue_scripts', [ __CLASS__, 'enqueue_editor_scripts' ] );
    }

    /**
     * Registra una categoria propia en el panel de Elementor.
     */
    public static function add_widget_category( $elements_manager ) {
        $elements_manager->add_category(
            'diagnosticoseo',
            [
                'title' => 'DiagnosticoSEO',
                'icon'  => 'eicon-search',
            ]
        );
    }

    /**
     * Registra el widget personalizado.
     */
    public static function register_widgets( $widgets_manager ) {
        // Verificamos de nuevo que la clase base de Elementor existe antes de cargar el widget
        if ( ! class_exists( '\Elementor\Widget_Base' ) ) {
            return;
        }

        require_once DSEO_PLUGIN_DIR . 'includes/elementor/widgets/class-widget-seo.php';

        if ( class_exists( '\DSEO_SEO_Widget' ) ) {
            $widgets_manager->register( new \DSEO_SEO_Widget() );
        }
    }

    /**
     * Carga los scripts necesarios en el editor de Elementor.
     */
    public static function enqueue_editor_scripts() {
        $opts    = get_option( 'diagnosticoseo_settings', [] );
        $base_url = ! empty( $opts['base_url'] ) ? $opts['base_url'] : 'https://diagnostico-seo.vercel.app';

        wp_enqueue_script(
            'dseo-admin-js',
            DSEO_PLUGIN_URL . 'admin/js/admin.js',
            [ 'jquery' ],
            DSEO_VERSION,
            true
        );

        wp_localize_script( 'dseo-admin-js', 'DSEO', [
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'dseo_nonce' ),
            'post_id'  => get_the_ID(),
            'post_url' => get_permalink( get_the_ID() ),
            'timeout'  => 90000,
            'base_url' => $base_url
        ] );
    }
}
