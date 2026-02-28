=== DiagnÃ³sticoSEO ===
Contributors:      diagnosticoseo
Tags:              seo, content, gpt, ai, analysis
Requires at least: 6.0
Tested up to:      6.7
Requires PHP:      8.0
Stable tag:        1.0.3
License:           GPLv2 or later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Analiza y genera contenido SEO optimizado directamente desde el editor de WordPress. Powered by GPT-4o.

== Description ==

**DiagnÃ³sticoSEO** conecta tu WordPress con nuestra API para:

* **Analizar cualquier URL** y obtener un score SEO 0-100 con issues categorizados (TÃ©cnico, On-Page, Contenido).
* **Detectar competidores** y oportunidades de keyword.
* **Generar contenido completo** con H1, H2, H3, pÃ¡rrafos, sugerencias de imÃ¡genes y schema markup usando GPT-4o.
* **Insertar el contenido** directamente en el editor de bloques (Gutenberg) o el editor clÃ¡sico.

= Planes =

* **Starter (Gratis):** 10 anÃ¡lisis/mes â€” acceso a todas las funciones de anÃ¡lisis.
* **Pro ($29 USD/mes):** 100 anÃ¡lisis/mes + generaciÃ³n de contenido con GPT-4o.
* **Agency ($99 USD/mes):** 1.000 anÃ¡lisis/mes + soporte dedicado.

ObtÃ©n tu API key en [diagnostico-seo.vercel.app/dashboard](https://diagnostico-seo.vercel.app/dashboard).

== Installation ==

1. Sube la carpeta `diagnosticoseo` a `/wp-content/plugins/`.
2. Activa el plugin desde **Plugins â†’ Plugins instalados**.
3. Ve a **Ajustes â†’ DiagnÃ³sticoSEO** y pega tu API key.
4. Edita cualquier post o pÃ¡gina â€” verÃ¡s el panel **DiagnÃ³sticoSEO** debajo del editor.

== Frequently Asked Questions ==

= Â¿Necesito una cuenta? =
SÃ­. RegÃ­strate gratis en [diagnostico-seo.vercel.app/dashboard](https://diagnostico-seo.vercel.app/dashboard) con tu email para obtener una API key gratuita (Plan Starter).

= Â¿Funciona con el editor de bloques (Gutenberg)? =
SÃ­. El botÃ³n "Insertar en el Editor" genera bloques nativos de WordPress automÃ¡ticamente.

= Â¿Funciona con el editor clÃ¡sico? =
SÃ­. Si tienes el plugin Classic Editor activo, el contenido se inserta en TinyMCE.

= Â¿En quÃ© idioma genera el contenido? =
En espaÃ±ol por defecto, con soporte para mÃºltiples paÃ­ses (Chile, Argentina, MÃ©xico, Colombia, EspaÃ±a, PerÃº).

== Screenshots ==

1. Panel de configuraciÃ³n con gestiÃ³n de API key.
2. Meta box en el editor: AnÃ¡lisis SEO con score visual.
3. Meta box en el editor: GeneraciÃ³n de contenido H1/H2/H3.
4. Contenido insertado en el editor de bloques.

== Changelog ==

= 1.0.0 =
* VersiÃ³n inicial.
* AnÃ¡lisis SEO con score 0-100, issues y quick wins.
* GeneraciÃ³n de contenido con GPT-4o (H1, H2, H3, schema markup).
* InserciÃ³n automÃ¡tica en Gutenberg y editor clÃ¡sico.
* Panel de configuraciÃ³n con test de conexiÃ³n.
* Widget de dashboard.

= 1.0.3 =
* Fix: Botones en metabox ya no recargan la página (agregado type="button").
* Fix: Corregida URL base de API predeterminada (diagnostico-seo.vercel.app).
* Fix: Mejora en manejo de tiempos de respuesta de GPT-4o (timeout ampliado).
* Fix: DSEO undefined en JS se previene con mejor orden de carga.
* Mejora: Re-intento y mensajes de error más claros en el editor.
* Sincronización de API key con plan detectado en ajustes.
