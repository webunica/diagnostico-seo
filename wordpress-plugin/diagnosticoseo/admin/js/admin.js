/* global DSEO, jQuery */
(function ($) {
    'use strict';

    /* ── Tabs ─────────────────────────────────────────────────────── */
    $(document).on('click', '.dseo-tab', function () {
        const tab = $(this).data('tab');
        $(this).siblings().removeClass('dseo-tab-active');
        $(this).addClass('dseo-tab-active');
        $('.dseo-tab-content').hide();
        $('[data-content="' + tab + '"]').show();
    });

    /* ── Toggle API key visibility ───────────────────────────────── */
    $('#dseo-toggle-key').on('click', function () {
        const inp = $('#dseo_api_key');
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
        const $btn = $(this);
        const $res = $('#dseo-test-result');

        $btn.prop('disabled', true).text('Probando…');
        $res.hide();

        $.post(DSEO.ajax_url, {
            action: 'dseo_test_connection',
            nonce: DSEO.nonce,
        }).done(function (resp) {
            if (resp.ok) {
                $res.html('<div class="dseo-notice dseo-notice-success">✅ Conexión exitosa — Plan: <strong>' + resp.plan + '</strong></div>');
            } else {
                $res.html('<div class="dseo-notice dseo-notice-error">❌ ' + (resp.error || 'Error desconocido') + '</div>');
            }
            $res.show();
        }).fail(function () {
            $res.html('<div class="dseo-notice dseo-notice-error">❌ Error de conexión.</div>').show();
        }).always(function () {
            $btn.prop('disabled', false).text('🔌 Probar conexión');
        });
    });

    /* ── Analyze ─────────────────────────────────────────────────── */
    $('#dseo-analyze-btn').on('click', function () {
        const url = $('#dseo-analyze-url').val().trim();
        if (!url) { alert('Ingresa una URL.'); return; }

        $('#dseo-analyze-result, #dseo-analyze-error').hide();
        $('#dseo-analyze-loading').show();
        $(this).prop('disabled', true);

        $.post(DSEO.ajax_url, {
            action: 'dseo_analyze',
            nonce: DSEO.nonce,
            url: url,
        }).done(function (resp) {
            if (!resp.success) {
                $('#dseo-analyze-error').text('Error: ' + resp.data).show();
                return;
            }
            renderAnalysis(resp.data);
            $('#dseo-analyze-result').show();
        }).fail(function () {
            $('#dseo-analyze-error').text('Error de conexión. Intenta de nuevo.').show();
        }).always(function () {
            $('#dseo-analyze-loading').hide();
            $('#dseo-analyze-btn').prop('disabled', false);
        });
    });

    function renderAnalysis(data) {
        const score = data.score || 0;
        const color = score >= 70 ? '#10b981' : (score >= 40 ? '#f59e0b' : '#ef4444');

        // Score circle
        const r = 50, circ = 2 * Math.PI * r;
        const pct = score / 100;
        const dash = pct * circ;
        const gap = circ - dash;

        $('#dseo-score-num').text(score).css('color', color);
        $('#dseo-score-ring')
            .attr('stroke-dasharray', dash + ' ' + gap)
            .attr('stroke', color);

        $('#dseo-score-business').text(data.businessType || '');
        if (data.meta) {
            $('#dseo-score-plan').text('Plan: ' + data.meta.plan + ' · ' + data.meta.requestsRemaining + ' req restantes');
        }

        // Section scores
        const sections = data.sections || {};
        let sectHTML = '';
        const sectionLabels = { technical: '⚙️ Técnico', onpage: '📝 On-Page', content: '📄 Contenido' };
        Object.keys(sectionLabels).forEach(function (key) {
            const sec = sections[key] || {};
            const s = sec.score || 0;
            const col = s >= 70 ? '#10b981' : (s >= 40 ? '#f59e0b' : '#ef4444');
            sectHTML += '<div class="dseo-section-row">';
            sectHTML += '<span>' + sectionLabels[key] + '</span>';
            sectHTML += '<div class="dseo-bar"><div class="dseo-bar-fill" style="width:' + s + '%;background:' + col + '"></div></div>';
            sectHTML += '<span class="dseo-section-score" style="color:' + col + '">' + s + '</span>';
            sectHTML += '</div>';

            // Issues
            if (sec.issues && sec.issues.length) {
                sec.issues.forEach(function (issue) {
                    const ic = issue.priority === 'critical' ? '#ef4444' : (issue.priority === 'high' ? '#f59e0b' : '#6b7280');
                    sectHTML += '<div class="dseo-issue" style="border-left:3px solid ' + ic + '">';
                    sectHTML += '<strong>' + escHtml(issue.title || '') + '</strong> ';
                    sectHTML += '<span>' + escHtml(issue.description || '') + '</span>';
                    sectHTML += '</div>';
                });
            }
        });
        $('#dseo-sections').html(sectHTML);

        // Quick wins
        const qw = data.quickWins || [];
        if (qw.length) {
            let qwHTML = '';
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
        const comp = data.competitors || [];
        if (comp.length) {
            let compHTML = '';
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
        const url = DSEO.post_url;
        const keyword = $('#dseo-keyword').val().trim();
        const country = $('#dseo-country').val();

        if (!keyword) { alert('Ingresa una keyword principal.'); return; }

        // Sync hidden field
        $('#dseo-keyword-hidden').val(keyword);

        $('#dseo-generate-result, #dseo-generate-error').hide();
        $('#dseo-generate-loading').show();
        $(this).prop('disabled', true);

        $.post(DSEO.ajax_url, {
            action: 'dseo_generate',
            nonce: DSEO.nonce,
            url: url,
            keyword: keyword,
            country: country,
            post_id: DSEO.post_id,
        }).done(function (resp) {
            if (!resp.success) {
                $('#dseo-generate-error').text('Error: ' + resp.data).show();
                return;
            }
            renderGenerated(resp.data);
            $('#dseo-generate-result').show();
        }).fail(function () {
            $('#dseo-generate-error').text('Error de conexión. Intenta de nuevo.').show();
        }).always(function () {
            $('#dseo-generate-loading').hide();
            $('#dseo-generate-btn').prop('disabled', false);
        });
    });

    function renderGenerated(data) {
        $('#gen-title').text(data.titleTag || '');
        $('#gen-meta').text(data.metaDescription || '');
        $('#gen-h1').text(data.h1 || '');
        $('#gen-intro').text(data.intro || '');
        $('#gen-schema').text(data.schemaMarkup || '');

        const sections = data.sections || [];
        let secHTML = '';
        sections.forEach(function (sec) {
            secHTML += '<div class="dseo-gen-section">';
            secHTML += '<div class="dseo-gen-h2">' + escHtml(sec.h2 || '') + '</div>';
            if (sec.intro) secHTML += '<div class="dseo-gen-para">' + escHtml(sec.intro) + '</div>';
            (sec.h3s || []).forEach(function (h) {
                secHTML += '<div class="dseo-gen-h3">' + escHtml(h.h3 || '') + '</div>';
                if (h.content) secHTML += '<div class="dseo-gen-para">' + escHtml(h.content) + '</div>';
            });
            if (sec.imageSuggestion) {
                const img = sec.imageSuggestion;
                secHTML += '<div class="dseo-gen-image-tip">🖼️ <strong>Imagen sugerida:</strong> ' + escHtml(img.description || '') + ' — Alt: <em>' + escHtml(img.altText || '') + '</em></div>';
            }
            if (sec.cta) secHTML += '<div class="dseo-gen-cta">CTA: ' + escHtml(sec.cta) + '</div>';
            secHTML += '</div>';
        });
        $('#gen-sections').html(secHTML);

        if (data.estimatedWordCount) {
            $('#gen-stats').html('📊 <strong>' + data.estimatedWordCount + '</strong> palabras estimadas · Generado con <em>' + (data.model || 'gpt-4o') + '</em>');
        }
    }

    /* ── Insert all into Gutenberg / Classic Editor ──────────────── */
    $('#dseo-insert-all').on('click', function () {
        const h1 = $('#gen-h1').text().trim();
        const intro = $('#gen-intro').text().trim();
        const secs = [];

        $('.dseo-gen-section').each(function () {
            const h2 = $(this).find('.dseo-gen-h2').text().trim();
            const par = [];
            $(this).find('.dseo-gen-para').each(function () { par.push($(this).text().trim()); });
            secs.push({ h2, par });
        });

        // Gutenberg
        if (typeof wp !== 'undefined' && wp.blocks && wp.data) {
            const { createBlock } = wp.blocks;
            const { dispatch } = wp.data;
            const blocks = [];

            if (h1) blocks.push(createBlock('core/heading', { level: 1, content: h1 }));
            if (intro) blocks.push(createBlock('core/paragraph', { content: intro }));

            secs.forEach(function (s) {
                if (s.h2) blocks.push(createBlock('core/heading', { level: 2, content: s.h2 }));
                s.par.forEach(function (p) {
                    if (p) blocks.push(createBlock('core/paragraph', { content: p }));
                });
            });

            dispatch('core/block-editor').insertBlocks(blocks);
            alert('✅ Contenido insertado en el editor de bloques.');
            return;
        }

        // Classic Editor TinyMCE
        if (typeof tinyMCE !== 'undefined' && tinyMCE.activeEditor && !tinyMCE.activeEditor.isHidden()) {
            let html = '';
            if (h1) html += '<h1>' + h1 + '</h1>';
            if (intro) html += '<p>' + intro + '</p>';
            secs.forEach(function (s) {
                if (s.h2) html += '<h2>' + s.h2 + '</h2>';
                s.par.forEach(function (p) { if (p) html += '<p>' + p + '</p>'; });
            });
            tinyMCE.activeEditor.setContent(html);
            alert('✅ Contenido insertado en el editor clásico.');
            return;
        }

        alert('⚠️ Copia el contenido manualmente desde los bloques arriba.');
    });

    /* ── Copy buttons ────────────────────────────────────────────── */
    $(document).on('click', '.dseo-copy-btn', function () {
        const target = $(this).data('target');
        const $el = $('#' + target);
        const text = $el.is('pre') ? $el.text() : $el.text();
        const $btn = $(this);

        navigator.clipboard.writeText(text).then(function () {
            $btn.text('✅ Copiado').prop('disabled', true);
            setTimeout(function () {
                $btn.text('📋 Copiar').prop('disabled', false);
            }, 2000);
        });
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
