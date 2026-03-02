<?php
defined( 'ABSPATH' ) || exit;

/**
 * Panel de administracion + ajustes + AJAX handlers.
 */
class DSEO_Admin {

    public static function init() {
        add_action( 'admin_menu',               array( 'DSEO_Admin', 'add_menu' ) );
        add_action( 'admin_init',               array( 'DSEO_Admin', 'register_settings' ) );
        add_action( 'admin_enqueue_scripts',    array( 'DSEO_Admin', 'enqueue' ) );
        add_action( 'wp_dashboard_setup',       array( 'DSEO_Admin', 'dashboard_widget' ) );

        // AJAX handlers (logged-in users)
        add_action( 'wp_ajax_dseo_analyze',          array( 'DSEO_Admin', 'ajax_analyze' ) );
        add_action( 'wp_ajax_dseo_generate',         array( 'DSEO_Admin', 'ajax_generate' ) );
        add_action( 'wp_ajax_dseo_generate_product', array( 'DSEO_Admin', 'ajax_generate_product' ) );
        add_action( 'wp_ajax_dseo_test_connection',  array( 'DSEO_Admin', 'ajax_test_connection' ) );
    }

    public static function add_menu() {
        add_menu_page(
            'SEO Diagnostico',
            'SEO Diagnostico',
            'manage_options',
            'diagnosticoseo',
            array( 'DSEO_Admin', 'settings_page' ),
            'dashicons-chart-line',
            30
        );

        add_submenu_page(
            'diagnosticoseo',
            'Ajustes',
            'Ajustes',
            'manage_options',
            'diagnosticoseo',
            array( 'DSEO_Admin', 'settings_page' )
        );

        add_submenu_page(
            'diagnosticoseo',
            'Optimizador de Productos',
            'Optimizador de Productos',
            'manage_options',
            'dseo-product-optimizer',
            array( 'DSEO_Admin', 'product_optimizer_page' )
        );
    }

    public static function register_settings() {
        register_setting(
            'diagnosticoseo_group',
            DSEO_OPTION_KEY,
            array(
                'sanitize_callback' => array( 'DSEO_Admin', 'sanitize_settings' ),
                'default'           => array( 'api_key' => '', 'base_url' => 'https://diagnostico-seo.vercel.app' ),
            )
        );
    }

    public static function sanitize_settings( $input ) {
        $api_key = isset( $input['api_key'] ) ? $input['api_key'] : '';
        $base_url = isset( $input['base_url'] ) ? $input['base_url'] : 'https://diagnostico-seo.vercel.app';
        return array(
            'api_key'  => sanitize_text_field( $api_key ),
            'base_url' => esc_url_raw( rtrim( $base_url, '/' ) ),
        );
    }

    public static function enqueue( $hook ) {
        $allowed = array( 'settings_page_diagnosticoseo', 'post.php', 'post-new.php', 'index.php' );
        if ( ! in_array( $hook, $allowed, true ) ) return;

        wp_enqueue_style(
            'dseo-admin',
            DSEO_PLUGIN_URL . 'admin/css/admin.css',
            array(),
            DSEO_VERSION
        );

        wp_enqueue_script(
            'dseo-admin',
            DSEO_PLUGIN_URL . 'admin/js/admin.js',
            array( 'jquery' ),
            DSEO_VERSION,
            true
        );

        $post_id  = isset( $_GET['post'] ) ? intval( $_GET['post'] ) : 0;
        $post_url = '';
        if ( $post_id ) {
            $post_url = get_permalink( $post_id );
        }
        if ( ! $post_url ) {
            $post_url = trailingslashit( get_site_url() );
        }

        wp_localize_script( 'dseo-admin', 'DSEO', array(
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'dseo_nonce' ),
            'post_url' => $post_url,
            'post_id'  => $post_id,
            'timeout'  => 90000,
        ) );
    }

    public static function settings_page() {
        require_once DSEO_PLUGIN_DIR . 'admin/views/settings-page.php';
    }

    public static function product_optimizer_page() {
        require_once DSEO_PLUGIN_DIR . 'admin/views/product-optimizer.php';
    }

    public static function dashboard_widget() {
        wp_add_dashboard_widget(
            'dseo_dashboard_widget',
            'SEO Diagnostico - Acceso Rápido',
            array( 'DSEO_Admin', 'dashboard_widget_html' )
        );
    }

    public static function dashboard_widget_html() {
        $opts    = get_option( DSEO_OPTION_KEY, array() );
        $has_key = ! empty( $opts['api_key'] );
        $site    = get_site_url();
        require_once DSEO_PLUGIN_DIR . 'admin/views/dashboard-widget.php';
    }

    public static function ajax_analyze() {
        check_ajax_referer( 'dseo_nonce', 'nonce' );
        if ( ! current_user_can( 'edit_posts' ) ) wp_send_json_error( 'Sin permisos', 403 );

        $url = isset( $_POST['url'] ) ? esc_url_raw( sanitize_text_field( $_POST['url'] ) ) : '';
        if ( ! $url ) wp_send_json_error( 'URL requerida' );

        $api    = new DSEO_API();
        $result = $api->analyze( $url );

        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }

        wp_send_json_success( $result );
    }

    public static function ajax_generate() {
        if ( function_exists( 'set_time_limit' ) ) {
            set_time_limit( 120 );
        }

        check_ajax_referer( 'dseo_nonce', 'nonce' );
        if ( ! current_user_can( 'edit_posts' ) ) wp_send_json_error( 'Sin permisos', 403 );

        $url     = isset( $_POST['url'] ) ? esc_url_raw( sanitize_text_field( $_POST['url'] ) ) : '';
        $keyword = isset( $_POST['keyword'] ) ? sanitize_text_field( $_POST['keyword'] ) : '';
        $country = isset( $_POST['country'] ) ? sanitize_text_field( $_POST['country'] ) : 'Chile';

        if ( ! $url ) wp_send_json_error( 'URL requerida' );

        $api    = new DSEO_API();
        $result = $api->generate_content( $url, $keyword, $country );

        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }

        $post_id = isset( $_POST['post_id'] ) ? intval( $_POST['post_id'] ) : 0;
        if ( $post_id && current_user_can( 'edit_post', $post_id ) ) {
            update_post_meta( $post_id, '_dseo_generated_content', wp_json_encode( $result ) );
            update_post_meta( $post_id, '_dseo_primary_keyword',   $keyword );
        }

        wp_send_json_success( $result );
    }

    public static function ajax_generate_product() {
        if ( function_exists( 'set_time_limit' ) ) {
            set_time_limit( 120 );
        }

        check_ajax_referer( 'dseo_nonce', 'nonce' );
        if ( ! current_user_can( 'edit_posts' ) ) wp_send_json_error( 'Sin permisos', 403 );

        $product_name = isset( $_POST['productName'] ) ? sanitize_text_field( $_POST['productName'] ) : '';
        $keywords     = isset( $_POST['keywords'] ) ? sanitize_text_field( $_POST['keywords'] ) : '';
        $country      = isset( $_POST['country'] ) ? sanitize_text_field( $_POST['country'] ) : 'Chile';

        if ( ! $product_name ) wp_send_json_error( 'Nombre de producto requerido' );

        $api    = new DSEO_API();
        $result = $api->generate_product( $product_name, $keywords, $country );

        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }

        $post_id = isset( $_POST['post_id'] ) ? intval( $_POST['post_id'] ) : 0;
        if ( $post_id && current_user_can( 'edit_post', $post_id ) ) {
            update_post_meta( $post_id, '_dseo_generated_product', wp_json_encode( $result ) );
        }

        wp_send_json_success( $result );
    }

    public static function ajax_test_connection() {
        check_ajax_referer( 'dseo_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error( 'Sin permisos', 403 );

        $api    = new DSEO_API();
        $result = $api->ping();
        wp_send_json( $result );
    }
}
