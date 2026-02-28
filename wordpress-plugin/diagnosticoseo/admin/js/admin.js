/* global DSEO, jQuery */
(function ($) {
    'use strict';

    /*
     * Safeguard: si DSEO no estÃ¡ definido (wp_localize_script fallido)
     * abortar silenciosamente para no romper el admin de WP.
     */
    if (typeof DSEO === 'undefined') {
        console.error('[DiagnÃ³sticoSEO] Objeto DSEO no encontrado. Revisa la configuraciÃ³n del plugin.');
        return;
    }

    // Flags: evitan requests paralelos por doble-clic
    var isAnalyzing = false;
    var isGenerating = false;

    /* ── Restore State ───────────────────────────────────────────── */
    function restoreState() {
        var $box = $('#dseo-metabox');
        var lastGen = $box.data('last-generated');
        if (lastGen) {
            try {
                // Si es un string (desde el data-attribute), parsear
                var data = typeof lastGen === 'string' ? JSON.parse(lastGen) : lastGen;
                if (data && data.titleTag) {
                    renderGenerated(data);
                    $('#dseo-generate-result').show();
                    // Switch a la pestaña de generar sugerida si hay contenido
                    $('[data-tab="generate"]').trigger('click');
                }
            } catch (e) {
                console.error('[DiagnósticoSEO] Error al restaurar contenido generado:', e);
            }
        }
    }

    $(function () {
        restoreState();
    });

    /* â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    $(document).on('click', '.dseo-tab', function () {
        var tab = $(this).data('tab');
        $(this).siblings().removeClass('dseo-tab-active');
        $(this).addClass('dseo-tab-active');
        $('.dseo-tab-content').hide();
        $('[data-content="' + tab + '"]').show();
    });

    /* â”€â”€ Toggle API key visibility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    $('#dseo-toggle-key').on('click', function () {
        var inp = $('#dseo_api_key');
        if (inp.attr('type') === 'password') {
            inp.attr('type', 'text');
            $(this).text('ðŸ”’ Ocultar');
        } else {
            inp.attr('type', 'password');
            $(this).text('ðŸ‘ Mostrar');
        }
    });

    /* â”€â”€ Test connection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    $('#dseo-test-btn').on('click', function () {
        var $btn = $(this);
        var $res = $('#dseo-test-result');

        $btn.prop('disabled', true).text('Probandoâ€¦');
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
                $res.html('<div class="dseo-notice dseo-notice-success">âœ… ConexiÃ³n exitosa â€” Plan: <strong>' + resp.plan + '</strong></div>');
            } else {
                $res.html('<div class="dseo-notice dseo-notice-error">âŒ ' + (resp.error || 'Error desconocido') + '</div>');
            }
            $res.show();
        }).fail(function (xhr, status) {
            var msg = status === 'timeout' ? 'Timeout. Verifica tu URL base.' : 'Error de conexiÃ³n.';
            $res.html('<div class="dseo-notice dseo-notice-error">âŒ ' + msg + '</div>').show();
        }).always(function () {
            $btn.prop('disabled', false).text('ðŸ”Œ Probar conexiÃ³n');
        });
    });

    /* â”€â”€ Analyze â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    $('#dseo-analyze-btn').on('click', function () {
        if (isAnalyzing) { return; } // Prevenir doble-clic

        var url = $('#dseo-analyze-url').val().trim();
        if (!url) { alert('Ingresa una URL vÃ¡lida.'); return; }

        isAnalyzing = true;
        $('#dseo-analyze-result, #dseo-analyze-error').hide();
        $('#dseo-analyze-loading').show();
        $(this).prop('disabled', true).text('Analizandoâ€¦');

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
                ? 'Timeout (90 seg): el anÃ¡lisis tardÃ³ demasiado. Intenta de nuevo.'
                : 'Error de conexiÃ³n (' + status + '). Intenta de nuevo.';
            $('#dseo-analyze-error').text(msg).show();
        }).always(function () {
            isAnalyzing = false;
            $('#dseo-analyze-loading').hide();
            $('#dseo-analyze-btn').prop('disabled', false).text('ðŸ” Analizar');
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
            $('#dseo-score-plan').text('Plan: ' + data.meta.plan + ' Â· ' + data.meta.requestsRemaining + ' req restantes');
        }

        // Section scores + issues
        var sections = data.sections || {};
        var sectHTML = '';
        var sectionLabels = { technical: 'âš™ï¸ TÃ©cnico', onpage: 'ðŸ“ On-Page', content: 'ðŸ“„ Contenido' };

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
                qwHTML += '<div class="dseo-qw"><strong>âš¡ ' + escHtml(w.title) + '</strong>';
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
                    compHTML += '<p class="dseo-comp-opp">ðŸ’¡ ' + escHtml(c.opportunity) + '</p>';
                }
                compHTML += '</div>';
            });
            $('#dseo-competitors').html(compHTML);
            $('#dseo-competitors-wrap').show();
        }
    }

    /* â”€â”€ Generate content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    $('#dseo-generate-btn').on('click', function () {
        if (isGenerating) { return; } // Prevenir doble-clic / requests paralelos

        var keyword = $('#dseo-keyword').val().trim();
        var country = $('#dseo-country').val();
        /*
         * Leer URL del metabox data-attribute como fallback por si DSEO.post_url
         * no se resolviÃ³ correctamente (post nuevo sin permalink todavÃ­a).
         */
        var url = DSEO.post_url || $('#dseo-metabox').data('post-url') || '';

        if (!keyword) { alert('Ingresa una keyword principal.'); return; }
        if (!url) { alert('Guarda el post primero para que tenga una URL.'); return; }

        // Sincronizar campo oculto para que WP lo guarde en submit del form
        $('#dseo-keyword-hidden').val(keyword);

        isGenerating = true;
        $('#dseo-generate-result, #dseo-generate-error').hide();
        $('#dseo-generate-loading').show();
        $(this).prop('disabled', true).text('â³ Generandoâ€¦ (20-40 seg)');

        $.ajax({
            url: DSEO.ajax_url,
            method: 'POST',
            timeout: DSEO.timeout || 90000, // 90 segundos â€” GPT-4o necesita tiempo
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
                // AÃ±adir contexto Ãºtil si el error es de plan
                if (errMsg.indexOf('Pro') !== -1 || errMsg.indexOf('Agency') !== -1 || errMsg.indexOf('plan') !== -1) {
                    errMsg += ' â†’ Actualiza en diagnostico-seo.vercel.app/dashboard';
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
                ? 'â± Timeout (90 seg): GPT-4o tardÃ³ demasiado. Intenta de nuevo.'
                : 'Error de conexiÃ³n (' + status + '). Revisa tu conexiÃ³n e intenta de nuevo.';
            $('#dseo-generate-error').text(msg).show();
        }).always(function () {
            isGenerating = false;
            $('#dseo-generate-loading').hide();
            $('#dseo-generate-btn').prop('disabled', false).text('âœ¨ Generar Contenido SEO');
        });
    });

    function renderGenerated(data) {
        $('#gen-title').text(data.titleTag || '');
        $('#gen-meta').text(data.metaDescription || '');
        $('#gen-h1').text(data.h1 || '');
        $('#gen-intro').text(data.intro || '');
        $('#gen-schema').text(data.schemaMarkup || '');
        // Add Apply button if not present
        if (!$('#gen-schema-apply').length) {
            $('<button type="button" id="gen-schema-apply" class="dseo-btn dseo-btn-ghost" style="margin-left:10px; padding: 4px 10px; vertical-align: middle;">📥 Aplicar a Editor</button>').insertAfter('#dseo-generate-result .dseo-copy-btn[data-target="gen-schema"]');
        }

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
                secHTML += '<div class="dseo-gen-image-tip">ðŸ–¼ï¸ <strong>Imagen sugerida:</strong> ' + escHtml(img.description || '') + ' â€” Alt: <em>' + escHtml(img.altText || '') + '</em></div>';
            }
            if (sec.cta) { secHTML += '<div class="dseo-gen-cta">CTA: ' + escHtml(sec.cta) + '</div>'; }
            secHTML += '</div>';
        });
        $('#gen-sections').html(secHTML);

        if (data.estimatedWordCount) {
            $('#gen-stats').html('ðŸ“Š <strong>' + data.estimatedWordCount + '</strong> palabras estimadas Â· Generado con <em>' + (data.model || 'gpt-4o') + '</em>');
        }
    }

    /* â”€â”€ Insert into Gutenberg / Classic Editor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
        if (typeof wp !== 'undefined' && wp.blocks && wp.data && wp.data.dispatch('core/block-editor')) {
            try {
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
                alert('✅ Contenido insertado satisfactoriamente.');
                return;
            } catch (e) {
                console.error('[DiagnósticoSEO] Fallo al insertar bloques:', e);
            }
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
            tinyMCE.activeEditor.execCommand('mceInsertContent', false, html);
            alert('✅ Contenido insertado en el editor clásico.');
            return;
        }

        alert('⚠️ Nota: No detectamos un editor compatible (Gutenberg/Classic) activo. Si usas Elementor o Divi, por favor usa el botón "Copiar todo (HTML)" y pega el resultado manualmente.');
    });

    /* â”€â”€ Copy buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    $(document).on('click', '.dseo-copy-btn', function () {
        var target = $(this).data('target');
        var $el = $('#' + target);
        var text = $el.text();
        var $btn = $(this);

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function () {
                $btn.text('âœ… Copiado').prop('disabled', true);
                setTimeout(function () {
                    $btn.text('ðŸ“‹ Copiar').prop('disabled', false);
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
            $btn.text('âœ… Copiado');
            setTimeout(function () { $btn.text('ðŸ“‹ Copiar'); }, 2000);
        }
    });

    /* ── Apply Schema to Editor ──────────────────────────────────── */
    $(document).on('click', '#gen-schema-apply', function () {
        var code = $('#gen-schema').text().trim();
        if (!code) return;

        $('#dseo-schema-editor').val(code);
        alert('✅ Schema aplicado a la pestaña "Schema Markup". Recuerda guardar el post para activar los cambios.');

        // Switch al tab de schema para mostrar el resultado
        $('.dseo-tab[data-tab="schema"]').trigger('click');
    });

    /* ── Copy all as HTML (For Elementor/Builders) ────────────────── */
    $(document).on('click', '#dseo-copy-all-html', function () {
        var h1 = $('#gen-h1').text().trim();
        var intro = $('#gen-intro').text().trim();
        var html = '';

        if (h1) html += '<h1>' + h1 + '</h1>\n';
        if (intro) html += '<p>' + intro + '</p>\n';

        $('.dseo-gen-section').each(function () {
            var h2 = $(this).find('.dseo-gen-h2').text().trim();
            if (h2) html += '<h2>' + h2 + '</h2>\n';

            $(this).find('.dseo-gen-para').each(function () {
                var p = $(this).text().trim();
                if (p) html += '<p>' + p + '</p>\n';
            });
        });

        // Use standard copy logic
        var $btn = $(this);
        if (navigator.clipboard) {
            navigator.clipboard.writeText(html).then(function () {
                $btn.text('✅ ¡Copiado HTML!').prop('disabled', true);
                setTimeout(function () { $btn.text('🔤 Copiar todo (HTML)').prop('disabled', false); }, 2000);
            });
        } else {
            var ta = document.createElement('textarea');
            ta.value = html;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            $btn.text('✅ ¡Copiado HTML!');
            setTimeout(function () { $btn.text('🔤 Copiar todo (HTML)'); }, 2000);
        }
    });


    /* â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

})(jQuery);

