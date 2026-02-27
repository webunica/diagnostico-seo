<?php
defined( 'ABSPATH' ) || exit;

/**
 * Cliente HTTP para la API de DiagnósticoSEO.
 */
class DSEO_API {

    private string $api_key;
    private string $base_url;

    public function __construct() {
        $opts           = get_option( DSEO_OPTION_KEY, [] );
        $this->api_key  = $opts['api_key']  ?? '';
        $this->base_url = rtrim( $opts['base_url'] ?? 'https://diagnosticoseo.vercel.app', '/' );
    }

    /* ── Helpers ──────────────────────────────────────────────────── */

    private function has_key(): bool {
        return ! empty( $this->api_key );
    }

    private function request( string $endpoint, array $body ): array {
        if ( ! $this->has_key() ) {
            return [ 'error' => 'API key no configurada. Ve a Ajustes → DiagnósticoSEO.' ];
        }

        $response = wp_remote_post(
            $this->base_url . $endpoint,
            [
                'timeout' => 90,
                'headers' => [
                    'Content-Type' => 'application/json',
                    'X-API-Key'    => $this->api_key,
                ],
                'body'    => wp_json_encode( $body ),
            ]
        );

        if ( is_wp_error( $response ) ) {
            return [ 'error' => $response->get_error_message() ];
        }

        $code = wp_remote_retrieve_response_code( $response );
        $data = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code !== 200 ) {
            return [
                'error'  => $data['error'] ?? "Error HTTP {$code}",
                'status' => $code,
            ];
        }

        return $data ?? [];
    }

    /* ── Public methods ───────────────────────────────────────────── */

    /**
     * Analiza una URL.
     */
    public function analyze( string $url ): array {
        return $this->request( '/api/v1/analyze', [ 'url' => $url ] );
    }

    /**
     * Genera contenido SEO completo para una URL.
     */
    public function generate_content( string $url, string $primary_keyword = '', string $country = 'Chile' ): array {
        return $this->request( '/api/v1/generate-content', [
            'url'            => $url,
            'primaryKeyword' => $primary_keyword,
            'country'        => $country,
        ] );
    }

    /**
     * Verifica que la API key funciona.
     */
    public function ping(): array {
        $result = $this->request( '/api/v1/analyze', [ 'url' => 'https://example.com' ] );
        if ( isset( $result['error'] ) && str_contains( $result['error'], 'API key' ) ) {
            return [ 'ok' => false, 'error' => $result['error'] ];
        }
        return [ 'ok' => true, 'plan' => $result['meta']['plan'] ?? 'unknown' ];
    }
}
