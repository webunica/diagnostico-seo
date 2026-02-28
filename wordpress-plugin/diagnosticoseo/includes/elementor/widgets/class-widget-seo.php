<?php
defined( 'ABSPATH' ) || exit;

/**
 * Widget de DiagnósticoSEO para Elementor.
 */
class DSEO_SEO_Widget extends \Elementor\Widget_Base {

    public function get_name(): string {
        return 'dseo_seo_generator';
    }

    public function get_title(): string {
        return esc_html__( 'SEO AI Generator', 'diagnosticoseo' );
    }

    public function get_icon(): string {
        return 'eicon-ai';
    }

    public function get_categories(): array {
        return [ 'diagnosticoseo' ];
    }

    protected function register_controls(): void {
        $this->start_controls_section(
            'section_content',
            [
                'label' => esc_html__( 'Configuración', 'diagnosticoseo' ),
            ]
        );

        $this->add_control(
            'important_notice',
            [
                'type' => \Elementor\Controls_Manager::RAW_HTML,
                'raw' => '<div style="background:#eff6ff; padding:12px; border-radius:8px; border:1px solid #bfdbfe; color:#1e40af; font-size:12px;">
                            ✨ Usa este widget para generar contenido optimizado con GPT-4o directamente en tu diseño.
                          </div>',
            ]
        );

        $this->end_controls_section();
    }

    protected function render(): void {
        $opts    = get_option( 'diagnosticoseo_settings', [] );
        $has_key = ! empty( $opts['api_key'] );
        $saved_keyword = get_post_meta( get_the_ID(), '_dseo_primary_keyword', true );
        ?>
        <div class="dseo-elementor-widget dseo-metabox">
            <?php if ( ! $has_key ) : ?>
                <div class="dseo-notice dseo-notice-warn">
                    ⚠️ API key no configurada. Ve a Ajustes → DiagnósticoSEO.
                </div>
            <?php else : ?>
                <div class="dseo-card" style="border:none; box-shadow:none; padding:0;">
                    <div style="margin-bottom:15px;">
                        <label style="font-weight:700; display:block; margin-bottom:5px;">Keyword Principal</label>
                        <input type="text" id="dseo-keyword" class="elementor-control-tag-area" 
                               value="<?php echo esc_attr( $saved_keyword ); ?>" 
                               style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px;"
                               placeholder="ej: diseño web profesional">
                    </div>

                    <button type="button" id="dseo-generate-btn" class="elementor-button elementor-size-md elementor-button-primary" style="width:100%; background-image: linear-gradient(135deg, #8b5cf6, #6d28d9);">
                        ✨ Generar Contenido AI
                    </button>

                    <div id="dseo-generate-loading" style="display:none; margin-top:10px; font-size:13px; color:#666;">
                        <span class="elementor-state-icon"><i class="eicon-loading eicon-animation-spin"></i></span>
                        Generando con GPT-4o...
                    </div>

                    <div id="dseo-generate-error" style="display:none; margin-top:10px;" class="dseo-notice dseo-notice-error"></div>

                    <div id="dseo-generate-result" style="display:none; margin-top:20px; border-top:1px solid #eee; padding-top:15px;">
                        <div style="font-weight:800; margin-bottom:10px;">✅ Listo</div>
                        <div id="gen-h1" style="font-weight:700; color:#333; margin-bottom:5px;"></div>
                        <div id="gen-intro" style="font-size:14px; color:#666; margin-bottom:15px;"></div>
                        
                        <div id="gen-sections"></div>

                        <div style="margin-top:15px; background:#f9fafb; padding:10px; border-radius:5px; font-size:11px;">
                            <div id="gen-stats"></div>
                        </div>
                    </div>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }
}
