<?php
defined( 'ABSPATH' ) || exit;

/**
 * Cliente HTTP para la API de DiagnosticoSEO.
 */
class DSEO_API {

    private $api_key;
    private $base_url;

    public function __construct() {
        $opts           = get_option( DSEO_OPTION_KEY, array() );
        $this->api_key  = isset($opts['api_key']) ? $opts['api_key'] : '';
        $this->base_url = rtrim( isset($opts['base_url']) ? $opts['base_url'] : 'https://diagnostico-seo.vercel.app', '/' );
    }

    /* -- Helpers ---------------------------------------------------- */

    private function has_key() {
        return ! empty( $this->api_key );
    }

    private function request( $endpoint, $body ) {
        if ( ! $this->has_key() ) {
            return array( 'error' => 'API key no configurada. Ve a Ajustes -> DiagnosticoSEO.' );
        }

        $response = wp_remote_post(
            $this->base_url . $endpoint,
            array(
                'timeout' => 90,
                'headers' => array(
                    'Content-Type' => 'application/json',
                    'X-API-Key'    => $this->api_key,
                ),
                'body'    => wp_json_encode( $body ),
            )
        );

        if ( is_wp_error( $response ) ) {
            return array( 'error' => $response->get_error_message() );
        }

        $code = wp_remote_retrieve_response_code( $response );
        $data = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code !== 200 ) {
            return array(
                'error'  => isset($data['error']) ? $data['error'] : "Error HTTP {$code}",
                'status' => $code,
            );
        }

        return $data ? $data : array();
    }

    /* -- Public methods --------------------------------------------- */

    /**
     * Analiza una URL.
     */
    public function analyze( $url ) {
        return $this->request( '/api/v1/analyze', array( 'url' => $url ) );
    }

    /**
     * Genera contenido SEO completo para una URL.
     */
    public function generate_content( $url, $primary_keyword = '', $country = 'Chile' ) {
        return $this->request( '/api/v1/generate-content', array(
            'url'            => $url,
            'primaryKeyword' => $primary_keyword,
            'country'        => $country,
        ) );
    }

    /**
     * Genera una ficha de producto optimizada.
     */
    public function generate_product( $product_name, $keywords, $country = 'Chile' ) {
        return $this->request( '/api/v1/generate-product', array(
            'productName' => $product_name,
            'keywords'    => $keywords,
            'country'     => $country,
        ) );
    }

    /**
     * Verifica que la API key funciona.
     */
    public function ping() {
        $result = $this->request( '/api/v1/analyze', array( 'url' => 'https://example.com' ) );
        if ( isset( $result['error'] ) && strpos( $result['error'], 'API key' ) !== false ) {
            return array( 'ok' => false, 'error' => $result['error'] );
        }
        $plan = 'unknown';
        if (isset($result['meta']['plan'])) {
            $plan = $result['meta']['plan'];
        }
        return array( 'ok' => true, 'plan' => $plan );
    }
}
