<?php
/**
 * Plugin Name:       SEO Diagnostico
 * Plugin URI:        https://diagnosticoseo.com
 * Description:       Analiza y genera contenido SEO optimizado directamente desde el editor de WordPress.
 * Version:           1.1.6
 * Author:            SEO Diagnostico
 * Author URI:        https://diagnosticoseo.com
 * License:           GPL v2 or later
 * Text Domain:       diagnosticoseo
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! defined( 'DSEO_VERSION' ) ) {
    define( 'DSEO_VERSION', '1.1.6' );
}

define( 'DSEO_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'DSEO_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'DSEO_OPTION_KEY', 'diagnosticoseo_settings' );

// Enlace de los archivos principales
require_once DSEO_PLUGIN_DIR . 'includes/class-api.php';
require_once DSEO_PLUGIN_DIR . 'includes/class-admin.php';
require_once DSEO_PLUGIN_DIR . 'includes/class-metabox.php';
require_once DSEO_PLUGIN_DIR . 'includes/class-elementor.php';

// Inicializacion del plugin
function dseo_init_plugin() {
    if ( class_exists( 'DSEO_Admin' ) ) {
        DSEO_Admin::init();
    }
    if ( class_exists( 'DSEO_Metabox' ) ) {
        DSEO_Metabox::init();
    }
    if ( class_exists( 'DSEO_Elementor' ) ) {
        DSEO_Elementor::init();
    }
}
add_action( 'plugins_loaded', 'dseo_init_plugin' );

// Hook de activacion
register_activation_hook( __FILE__, 'dseo_activate_plugin' );
function dseo_activate_plugin() {
    if ( ! get_option( DSEO_OPTION_KEY ) ) {
        update_option( DSEO_OPTION_KEY, array(
            'api_key'  => '',
            'base_url' => 'https://diagnostico-seo.vercel.app',
        ) );
    }
}
