<?php
defined( 'ABSPATH' ) || exit;

/**
 * Widget de DiagnosticoSEO para Elementor.
 */
class DSEO_SEO_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'dseo_seo_generator';
    }

    public function get_title() {
        return 'SEO AI Diagnostico';
    }

    public function get_icon() {
        return 'eicon-ai';
    }

    public function get_categories() {
        return array( 'diagnosticoseo' );
    }

    protected function register_controls() {
        $this->start_controls_section(
            'section_content',
            array(
                'label' => 'Configuracion',
            )
        );

        $this->add_control(
            'important_notice',
            array(
                'type' => \Elementor\Controls_Manager::RAW_HTML,
                'raw' => '<div style="background:#eff6ff; padding:12px; border-radius:8px; border:1px solid #bfdbfe; color:#1e40af; font-size:12px;">
                            Usa este widget para generar contenido optimizado con GPT-4o directamente en tu diseño.
                          </div>',
            )
        );

        $this->end_controls_section();
    }

    protected function render() {
        $opts    = get_option( 'diagnosticoseo_settings', array() );
        $has_key = ! empty( $opts['api_key'] );
        $post_id = get_the_ID();
        $saved_keyword  = get_post_meta( $post_id, '_dseo_primary_keyword', true );
        $last_generated = get_post_meta( $post_id, '_dseo_generated_content', true );
        ?>
        <div class="dseo-elementor-widget dseo-metabox" 
             id="dseo-metabox" 
             data-last-generated='<?php echo esc_attr( $last_generated ); ?>'>
            <?php if ( ! $has_key ) : ?>
                <div class="dseo-notice dseo-notice-warn">
                    API key no configurada. Ve a Ajustes -> DiagnosticoSEO.
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

                    <button type="button" id="dseo-generate-btn" class="elementor-button elementor-size-md elementor-button-primary" style="width:100%; background: #3200C1; color:white; border:none; border-radius:4px; padding:12px; cursor:pointer; font-weight:800; border: 2px solid #37FFDB; text-transform:uppercase;">
                        Generar Contenido AI
                    </button>

                    <div id="dseo-generate-loading" style="display:none; margin-top:10px; font-size:13px; color:#666;">
                        <span class="elementor-state-icon"><i class="eicon-loading eicon-animation-spin"></i></span>
                        Generando con GPT-4o...
                    </div>

                    <div id="dseo-generate-error" style="display:none; margin-top:10px;" class="dseo-notice dseo-notice-error"></div>

                    <div id="dseo-generate-result" style="display:none; margin-top:20px; border-top:1px solid #eee; padding-top:15px;">
                        <div style="font-weight:800; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                            Listo
                            <button type="button" id="dseo-copy-all-html" class="dseo-btn dseo-btn-ghost" style="padding:4px 8px; font-size:11px;">Copiar HTML</button>
                        </div>
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
