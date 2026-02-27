/* global DSEO, jQuery */
(function ($) {
    'use strict';

    /*
     * Safeguard: si DSEO no está definido (wp_localize_script fallido)
     * abortar silenciosamente para no romper el admin de WP.
     */
    if (typeof DSEO === 'undefined') {
        console.error('[DiagnósticoSEO] Objeto DSEO no encontrado. Revisa la configuración del plugin.');
        return;
    }

    // Flags: evitan requests paralelos por doble-clic
    var isAnalyzing = false;
    var isGenerating = false;

    /* ── Tabs ─────────────────────────────────────────────────────── */
    $(document).on('click', '.dseo-tab', function () {
        var tab = $(this).data('tab');
        $(this).siblings().removeClass('dseo-tab-active');
        $(this).addClass('dseo-tab-active');
        $('.dseo-tab-content').hide();
        $('[data-content="' + tab + '"]').show();
    });

    /* ── Toggle API key visibility ───────────────────────────────── */
    $('#dseo-toggle-key').on('click', function () {
        var inp = $('#dseo_api_key');
        if (inp.attr('type') === 'password') {
            inp.attr('type', 'text');
            $(this).text('🔒 Ocultar');
        } else {
            inp.attr('type', 'password');
            $(this).text('👁 Mostrar');
        }
    });

    /* ── Test connection ─────────────────────────────────────────── */
    $('#dseo-test-btn').on('click', function () {
        var $btn = $(this);
        var $res = $('#dseo-test-result');

        $btn.prop('disabled', true).text('Probando…');
        $res.hide();

        $.ajax({
            url: DSEO.ajax_url,
            method: 'POST',
            timeout: 30000,
            data: {
                action: 'dseo_test_connection',
                nonce: DSEO.nonce,
            },
        }).done(function (resp) {
            if (resp.ok) {
                $res.html('<div class="dseo-notice dseo-notice-success">✅ Conexión exitosa — Plan: <strong>' + resp.plan + '</strong></div>');
            } else {
                $res.html('<div class="dseo-notice dseo-notice-error">❌ ' + (resp.error || 'Error desconocido') + '</div>');
            }
            $res.show();
        }).fail(function (xhr, status) {
            var msg = status === 'timeout' ? 'Timeout. Verifica tu URL base.' : 'Error de conexión.';
            $res.html('<div class="dseo-notice dseo-notice-error">❌ ' + msg + '</div>').show();
        }).always(function () {
            $btn.prop('disabled', false).text('🔌 Probar conexión');
        });
    });

    /* ── Analyze ─────────────────────────────────────────────────── */
    $('#dseo-analyze-btn').on('click', function () {
        if (isAnalyzing) { return; } // Prevenir doble-clic

        var url = $('#dseo-analyze-url').val().trim();
        if (!url) { alert('Ingresa una URL válida.'); return; }

        isAnalyzing = true;
        $('#dseo-analyze-result, #dseo-analyze-error').hide();
        $('#dseo-analyze-loading').show();
        $(this).prop('disabled', true).text('Analizando…');

        $.ajax({
            url: DSEO.ajax_url,
            method: 'POST',
            timeout: DSEO.timeout || 90000, // 90 s
            data: {
                action: 'dseo_analyze',
                nonce: DSEO.nonce,
                url: url,
            },
        }).done(function (resp) {
            if (!resp.success) {
                $('#dseo-analyze-error').text('Error: ' + (resp.data || 'Error desconocido')).show();
                return;
            }
            renderAnalysis(resp.data);
            $('#dseo-analyze-result').show();
        }).fail(function (xhr, status) {
            var msg = status === 'timeout'
                ? 'Timeout (90 seg): el análisis tardó demasiado. Intenta de nuevo.'
                : 'Error de conexión (' + status + '). Intenta de nuevo.';
            $('#dseo-analyze-error').text(msg).show();
        }).always(function () {
            isAnalyzing = false;
            $('#dseo-analyze-loading').hide();
            $('#dseo-analyze-btn').prop('disabled', false).text('🔍 Analizar');
        });
    });

    function renderAnalysis(data) {
        var score = data.score || 0;
        var color = score >= 70 ? '#10b981' : (score >= 40 ? '#f59e0b' : '#ef4444');

        // Score circle SVG
        var r = 50;
        var circ = 2 * Math.PI * r;
        var dash = (score / 100) * circ;
        var gap = circ - dash;

        $('#dseo-score-num').text(score).css('color', color);
        $('#dseo-score-ring')
            .attr('stroke-dasharray', dash + ' ' + gap)
            .attr('stroke', color);

        $('#dseo-score-business').text(data.businessType || '');
        if (data.meta) {
            $('#dseo-score-plan').text('Plan: ' + data.meta.plan + ' · ' + data.meta.requestsRemaining + ' req restantes');
        }

        // Section scores + issues
        var sections = data.sections || {};
        var sectHTML = '';
        var sectionLabels = { technical: '⚙️ Técnico', onpage: '📝 On-Page', content: '📄 Contenido' };

        Object.keys(sectionLabels).forEach(function (key) {
            var sec = sections[key] || {};
            var s = sec.score || 0;
            var col = s >= 70 ? '#10b981' : (s >= 40 ? '#f59e0b' : '#ef4444');

            sectHTML += '<div class="dseo-section-row">';
            sectHTML += '<span>' + sectionLabels[key] + '</span>';
            sectHTML += '<div class="dseo-bar"><div class="dseo-bar-fill" style="width:' + s + '%;background:' + col + '"></div></div>';
            sectHTML += '<span class="dseo-section-score" style="color:' + col + '">' + s + '</span>';
            sectHTML += '</div>';

            if (sec.issues && sec.issues.length) {
                sec.issues.forEach(function (issue) {
                    var ic = issue.priority === 'critical' ? '#ef4444' : (issue.priority === 'high' ? '#f59e0b' : '#6b7280');
                    sectHTML += '<div class="dseo-issue" style="border-left:3px solid ' + ic + '">';
                    sectHTML += '<strong>' + escHtml(issue.title || '') + '</strong> ';
                    sectHTML += '<span>' + escHtml(issue.description || '') + '</span>';
                    sectHTML += '</div>';
                });
            }
        });
        $('#dseo-sections').html(sectHTML);

        // Quick wins
        var qw = data.quickWins || [];
        if (qw.length) {
            var qwHTML = '';
            qw.slice(0, 3).forEach(function (w) {
                qwHTML += '<div class="dseo-qw"><strong>⚡ ' + escHtml(w.title) + '</strong>';
                if (w.steps) {
                    qwHTML += '<ul>';
                    w.steps.forEach(function (s) { qwHTML += '<li>' + escHtml(s) + '</li>'; });
                    qwHTML += '</ul>';
                }
                qwHTML += '</div>';
            });
            $('#dseo-quick-wins').html(qwHTML);
            $('#dseo-quick-wins-wrap').show();
        }

        // Competitors
        var comp = data.competitors || [];
        if (comp.length) {
            var compHTML = '';
            comp.slice(0, 4).forEach(function (c) {
                compHTML += '<div class="dseo-competitor">';
                compHTML += '<strong>' + escHtml(c.name || '') + '</strong> ';
                compHTML += '<a href="' + escHtml(c.url || '#') + '" target="_blank" rel="noopener">' + escHtml(c.url || '') + '</a>';
                if (c.opportunity) {
                    compHTML += '<p class="dseo-comp-opp">💡 ' + escHtml(c.opportunity) + '</p>';
                }
                compHTML += '</div>';
            });
            $('#dseo-competitors').html(compHTML);
            $('#dseo-competitors-wrap').show();
        }
    }

    /* ── Generate content ────────────────────────────────────────── */
    $('#dseo-generate-btn').on('click', function () {
        if (isGenerating) { return; } // Prevenir doble-clic / requests paralelos

        var keyword = $('#dseo-keyword').val().trim();
        var country = $('#dseo-country').val();
        /*
         * Leer URL del metabox data-attribute como fallback por si DSEO.post_url
         * no se resolvió correctamente (post nuevo sin permalink todavía).
         */
        var url = DSEO.post_url || $('#dseo-metabox').data('post-url') || '';

        if (!keyword) { alert('Ingresa una keyword principal.'); return; }
        if (!url) { alert('Guarda el post primero para que tenga una URL.'); return; }

        // Sincronizar campo oculto para que WP lo guarde en submit del form
        $('#dseo-keyword-hidden').val(keyword);

        isGenerating = true;
        $('#dseo-generate-result, #dseo-generate-error').hide();
        $('#dseo-generate-loading').show();
        $(this).prop('disabled', true).text('⏳ Generando… (20-40 seg)');

        $.ajax({
            url: DSEO.ajax_url,
            method: 'POST',
            timeout: DSEO.timeout || 90000, // 90 segundos — GPT-4o necesita tiempo
            data: {
                action: 'dseo_generate',
                nonce: DSEO.nonce,
                url: url,
                keyword: keyword,
                country: country,
                post_id: DSEO.post_id || $('#dseo-metabox').data('post-id') || 0,
            },
        }).done(function (resp) {
            if (!resp.success) {
                var errMsg = resp.data || 'Error desconocido';
                // Añadir contexto útil si el error es de plan
                if (errMsg.indexOf('Pro') !== -1 || errMsg.indexOf('Agency') !== -1 || errMsg.indexOf('plan') !== -1) {
                    errMsg += ' → Actualiza en diagnosticoseo.vercel.app/dashboard';
                }
                $('#dseo-generate-error').text('Error: ' + errMsg).show();
                return;
            }
            renderGenerated(resp.data);
            $('#dseo-generate-result').show();
            // Scroll suave al resultado
            $('html, body').animate({ scrollTop: $('#dseo-generate-result').offset().top - 60 }, 500);
        }).fail(function (xhr, status) {
            var msg = status === 'timeout'
                ? '⏱ Timeout (90 seg): GPT-4o tardó demasiado. Intenta de nuevo.'
                : 'Error de conexión (' + status + '). Revisa tu conexión e intenta de nuevo.';
            $('#dseo-generate-error').text(msg).show();
        }).always(function () {
            isGenerating = false;
            $('#dseo-generate-loading').hide();
            $('#dseo-generate-btn').prop('disabled', false).text('✨ Generar Contenido SEO');
        });
    });

    function renderGenerated(data) {
        $('#gen-title').text(data.titleTag || '');
        $('#gen-meta').text(data.metaDescription || '');
        $('#gen-h1').text(data.h1 || '');
        $('#gen-intro').text(data.intro || '');
        $('#gen-schema').text(data.schemaMarkup || '');

        var sections = data.sections || [];
        var secHTML = '';
        sections.forEach(function (sec) {
            secHTML += '<div class="dseo-gen-section">';
            secHTML += '<div class="dseo-gen-h2">' + escHtml(sec.h2 || '') + '</div>';
            if (sec.intro) { secHTML += '<div class="dseo-gen-para">' + escHtml(sec.intro) + '</div>'; }
            (sec.h3s || []).forEach(function (h) {
                secHTML += '<div class="dseo-gen-h3">' + escHtml(h.h3 || '') + '</div>';
                if (h.content) { secHTML += '<div class="dseo-gen-para">' + escHtml(h.content) + '</div>'; }
            });
            if (sec.imageSuggestion) {
                var img = sec.imageSuggestion;
                secHTML += '<div class="dseo-gen-image-tip">🖼️ <strong>Imagen sugerida:</strong> ' + escHtml(img.description || '') + ' — Alt: <em>' + escHtml(img.altText || '') + '</em></div>';
            }
            if (sec.cta) { secHTML += '<div class="dseo-gen-cta">CTA: ' + escHtml(sec.cta) + '</div>'; }
            secHTML += '</div>';
        });
        $('#gen-sections').html(secHTML);

        if (data.estimatedWordCount) {
            $('#gen-stats').html('📊 <strong>' + data.estimatedWordCount + '</strong> palabras estimadas · Generado con <em>' + (data.model || 'gpt-4o') + '</em>');
        }
    }

    /* ── Insert into Gutenberg / Classic Editor ──────────────────── */
    $(document).on('click', '#dseo-insert-all', function () {
        var h1 = $('#gen-h1').text().trim();
        var intro = $('#gen-intro').text().trim();
        var secs = [];

        $('.dseo-gen-section').each(function () {
            var h2 = $(this).find('.dseo-gen-h2').text().trim();
            var par = [];
            $(this).find('.dseo-gen-para').each(function () { par.push($(this).text().trim()); });
            secs.push({ h2: h2, par: par });
        });

        // Gutenberg (Block Editor)
        if (typeof wp !== 'undefined' && wp.blocks && wp.data) {
            var createBlock = wp.blocks.createBlock;
            var dispatch = wp.data.dispatch;
            var blocks = [];

            if (h1) { blocks.push(createBlock('core/heading', { level: 1, content: h1 })); }
            if (intro) { blocks.push(createBlock('core/paragraph', { content: intro })); }

            secs.forEach(function (s) {
                if (s.h2) { blocks.push(createBlock('core/heading', { level: 2, content: s.h2 })); }
                s.par.forEach(function (p) {
                    if (p) { blocks.push(createBlock('core/paragraph', { content: p })); }
                });
            });

            dispatch('core/block-editor').insertBlocks(blocks);
            alert('✅ Contenido insertado en el editor de bloques.');
            return;
        }

        // Classic Editor (TinyMCE)
        if (typeof tinyMCE !== 'undefined' && tinyMCE.activeEditor && !tinyMCE.activeEditor.isHidden()) {
            var html = '';
            if (h1) { html += '<h1>' + h1 + '</h1>'; }
            if (intro) { html += '<p>' + intro + '</p>'; }
            secs.forEach(function (s) {
                if (s.h2) { html += '<h2>' + s.h2 + '</h2>'; }
                s.par.forEach(function (p) { if (p) { html += '<p>' + p + '</p>'; } });
            });
            tinyMCE.activeEditor.setContent(html);
            alert('✅ Contenido insertado en el editor clásico.');
            return;
        }

        alert('⚠️ Copia el contenido manualmente desde los bloques de arriba.');
    });

    /* ── Copy buttons ────────────────────────────────────────────── */
    $(document).on('click', '.dseo-copy-btn', function () {
        var target = $(this).data('target');
        var $el = $('#' + target);
        var text = $el.text();
        var $btn = $(this);

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function () {
                $btn.text('✅ Copiado').prop('disabled', true);
                setTimeout(function () {
                    $btn.text('📋 Copiar').prop('disabled', false);
                }, 2000);
            });
        } else {
            // Fallback para HTTP o navegadores sin clipboard API
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            $btn.text('✅ Copiado');
            setTimeout(function () { $btn.text('📋 Copiar'); }, 2000);
        }
    });

    /* ── Helpers ─────────────────────────────────────────────────── */
    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

})(jQuery);
