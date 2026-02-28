<?php
defined( 'ABSPATH' ) || exit;

/**
 * Integración con Elementor.
 */
class DSEO_Elementor {

    public static function init(): void {
        // Esperamos a que Elementor esté cargado para enganchar nuestros registros
        add_action( 'elementor/init', [ __CLASS__, 'on_elementor_init' ] );
    }

    public static function on_elementor_init(): void {
        add_action( 'elementor/widgets/register', [ __CLASS__, 'register_widgets' ] );
        add_action( 'elementor/elements/categories_registered', [ __CLASS__, 'add_widget_category' ] );
        add_action( 'elementor/editor/after_enqueue_scripts', [ __CLASS__, 'enqueue_editor_scripts' ] );
    }

    /**
     * Registra una categoría propia en el panel de Elementor.
     */
    public static function add_widget_category( $elements_manager ): void {
        $elements_manager->add_category(
            'diagnosticoseo',
            [
                'title' => esc_html__( 'DiagnósticoSEO', 'diagnosticoseo' ),
                'icon'  => 'fa fa-search',
            ]
        );
    }

    /**
     * Registra el widget personalizado.
     */
    public static function register_widgets( $widgets_manager ): void {
        require_once DSEO_PLUGIN_DIR . 'includes/elementor/widgets/class-widget-seo.php';
        $widgets_manager->register( new \DSEO_SEO_Widget() );
    }

    /**
     * Carga los scripts necesarios en el editor de Elementor.
     */
    public static function enqueue_editor_scripts(): void {
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
            'nonce'    => wp_create_nonce( 'dseo_ajax_nonce' ),
            'post_id'  => get_the_ID(),
            'post_url' => get_permalink( get_the_ID() ),
            'timeout'  => 90000,
            'base_url' => $base_url
        ] );
    }
}
