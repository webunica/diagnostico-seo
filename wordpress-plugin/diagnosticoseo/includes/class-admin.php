<?php
defined( 'ABSPATH' ) || exit;

/**
 * Panel de administración + ajustes + AJAX handlers.
 */
class DSEO_Admin {

    public static function init(): void {
        add_action( 'admin_menu',               [ __CLASS__, 'add_menu' ] );
        add_action( 'admin_init',               [ __CLASS__, 'register_settings' ] );
        add_action( 'admin_enqueue_scripts',    [ __CLASS__, 'enqueue' ] );
        add_action( 'wp_dashboard_setup',       [ __CLASS__, 'dashboard_widget' ] );

        // AJAX handlers (logged-in users)
        add_action( 'wp_ajax_dseo_analyze',          [ __CLASS__, 'ajax_analyze' ] );
        add_action( 'wp_ajax_dseo_generate',         [ __CLASS__, 'ajax_generate' ] );
        add_action( 'wp_ajax_dseo_test_connection',  [ __CLASS__, 'ajax_test_connection' ] );
    }

    /* ── Menu ─────────────────────────────────────────────────────── */

    public static function add_menu(): void {
        add_options_page(
            'DiagnósticoSEO',
            '🔍 DiagnósticoSEO',
            'manage_options',
            'diagnosticoseo',
            [ __CLASS__, 'settings_page' ]
        );
    }

    /* ── Settings ─────────────────────────────────────────────────── */

    public static function register_settings(): void {
        register_setting(
            'diagnosticoseo_group',
            DSEO_OPTION_KEY,
            [
                'sanitize_callback' => [ __CLASS__, 'sanitize_settings' ],
                'default'           => [ 'api_key' => '', 'base_url' => 'https://diagnosticoseo.vercel.app' ],
            ]
        );
    }

    public static function sanitize_settings( array $input ): array {
        return [
            'api_key'  => sanitize_text_field( $input['api_key'] ?? '' ),
            'base_url' => esc_url_raw( rtrim( $input['base_url'] ?? 'https://diagnosticoseo.vercel.app', '/' ) ),
        ];
    }

    /* ── Enqueue ──────────────────────────────────────────────────── */

    public static function enqueue( string $hook ): void {
        // Load on settings page and all post edit screens
        $allowed = [ 'settings_page_diagnosticoseo', 'post.php', 'post-new.php', 'index.php' ];
        if ( ! in_array( $hook, $allowed, true ) ) return;

        wp_enqueue_style(
            'dseo-admin',
            DSEO_PLUGIN_URL . 'admin/css/admin.css',
            [],
            DSEO_VERSION
        );

        wp_enqueue_script(
            'dseo-admin',
            DSEO_PLUGIN_URL . 'admin/js/admin.js',
            [ 'jquery' ],
            DSEO_VERSION,
            true  // Load in footer AFTER the DOM is ready
        );

        // Resolve post URL/ID here (not inside render callback which is too late)
        $post_id  = isset( $_GET['post'] ) ? intval( $_GET['post'] ) : 0;
        $post_url = '';
        if ( $post_id ) {
            $post_url = get_permalink( $post_id ) ?: '';
        }
        if ( ! $post_url ) {
            $post_url = trailingslashit( get_site_url() );
        }

        wp_localize_script( 'dseo-admin', 'DSEO', [
            'ajax_url' => admin_url( 'admin-ajax.php' ),
            'nonce'    => wp_create_nonce( 'dseo_nonce' ),
            'post_url' => $post_url,
            'post_id'  => $post_id,
            'timeout'  => 90000, // 90 s in ms for jQuery AJAX
        ] );
    }

    /* ── Settings page view ───────────────────────────────────────── */

    public static function settings_page(): void {
        require_once DSEO_PLUGIN_DIR . 'admin/views/settings-page.php';
    }

    /* ── Dashboard widget ─────────────────────────────────────────── */

    public static function dashboard_widget(): void {
        wp_add_dashboard_widget(
            'dseo_dashboard_widget',
            '🔍 DiagnósticoSEO — Acceso Rápido',
            [ __CLASS__, 'dashboard_widget_html' ]
        );
    }

    public static function dashboard_widget_html(): void {
        $opts    = get_option( DSEO_OPTION_KEY, [] );
        $has_key = ! empty( $opts['api_key'] );
        $site    = get_site_url();
        require_once DSEO_PLUGIN_DIR . 'admin/views/dashboard-widget.php';
    }

    /* ── AJAX: analyze ────────────────────────────────────────────── */

    public static function ajax_analyze(): void {
        check_ajax_referer( 'dseo_nonce', 'nonce' );
        if ( ! current_user_can( 'edit_posts' ) ) wp_send_json_error( 'Sin permisos', 403 );

        $url = esc_url_raw( sanitize_text_field( $_POST['url'] ?? '' ) );
        if ( ! $url ) wp_send_json_error( 'URL requerida' );

        $api    = new DSEO_API();
        $result = $api->analyze( $url );

        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }

        wp_send_json_success( $result );
    }

    /* ── AJAX: generate ───────────────────────────────────────────── */

    public static function ajax_generate(): void {
        // GPT-4o puede tardar 30-60 seg — extender PHP timeout
        if ( function_exists( 'set_time_limit' ) ) {
            set_time_limit( 120 );
        }

        check_ajax_referer( 'dseo_nonce', 'nonce' );
        if ( ! current_user_can( 'edit_posts' ) ) wp_send_json_error( 'Sin permisos', 403 );

        $url     = esc_url_raw( sanitize_text_field( $_POST['url']     ?? '' ) );
        $keyword = sanitize_text_field( $_POST['keyword'] ?? '' );
        $country = sanitize_text_field( $_POST['country'] ?? 'Chile' );

        if ( ! $url ) wp_send_json_error( 'URL requerida' );

        $api    = new DSEO_API();
        $result = $api->generate_content( $url, $keyword, $country );

        if ( isset( $result['error'] ) ) {
            wp_send_json_error( $result['error'] );
        }

        // Guardar resultado en post meta si se envió post_id
        $post_id = intval( $_POST['post_id'] ?? 0 );
        if ( $post_id && current_user_can( 'edit_post', $post_id ) ) {
            update_post_meta( $post_id, '_dseo_last_analysis',   wp_json_encode( $result ) );
            update_post_meta( $post_id, '_dseo_analysis_date',   current_time( 'mysql' ) );
            update_post_meta( $post_id, '_dseo_primary_keyword', $keyword );
        }

        wp_send_json_success( $result );
    }

    /* ── AJAX: test connection ────────────────────────────────────── */

    public static function ajax_test_connection(): void {
        check_ajax_referer( 'dseo_nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) wp_send_json_error( 'Sin permisos', 403 );

        $api    = new DSEO_API();
        $result = $api->ping();
        wp_send_json( $result );
    }
}
