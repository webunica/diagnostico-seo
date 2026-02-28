<?php
/**
 * Plugin Name:       DiagnósticoSEO
 * Plugin URI:        https://diagnosticoseo.com
 * Description:       Analiza y genera contenido SEO optimizado directamente desde el editor de WordPress. Powered by GPT-4o.
 * Version:           1.1.0
 * Author:            DiagnósticoSEO
 * Author URI:        https://diagnosticoseo.com
 * License:           GPL v2 or later
 * Text Domain:       diagnosticoseo
 * Requires at least: 6.0
 * Requires PHP:      8.0
 */

defined( 'ABSPATH' ) || exit;

define( 'DSEO_VERSION',   '1.1.0' );
define( 'DSEO_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'DSEO_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'DSEO_OPTION_KEY', 'diagnosticoseo_settings' );

/* ── Autoload classes ─────────────────────────────────────────────── */
require_once DSEO_PLUGIN_DIR . 'includes/class-api.php';
require_once DSEO_PLUGIN_DIR . 'includes/class-admin.php';
require_once DSEO_PLUGIN_DIR . 'includes/class-metabox.php';
require_once DSEO_PLUGIN_DIR . 'includes/class-elementor.php';

/* ── Boot ─────────────────────────────────────────────────────────── */
add_action( 'plugins_loaded', function() {
    DSEO_Admin::init();
    DSEO_Metabox::init();
    DSEO_Elementor::init();
} );

/* ── Activation hook ──────────────────────────────────────────────── */
register_activation_hook( __FILE__, function() {
    if ( ! get_option( DSEO_OPTION_KEY ) ) {
        update_option( DSEO_OPTION_KEY, [
            'api_key'  => '',
            'base_url' => 'https://diagnostico-seo.vercel.app',
        ] );
    }
} );
