=== DiagnósticoSEO ===
Contributors:      diagnosticoseo
Tags:              seo, content, gpt, ai, analysis
Requires at least: 6.0
Tested up to:      6.7
Requires PHP:      8.0
Stable tag:        1.0.0
License:           GPLv2 or later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Analiza y genera contenido SEO optimizado directamente desde el editor de WordPress. Powered by GPT-4o.

== Description ==

**DiagnósticoSEO** conecta tu WordPress con nuestra API para:

* **Analizar cualquier URL** y obtener un score SEO 0-100 con issues categorizados (Técnico, On-Page, Contenido).
* **Detectar competidores** y oportunidades de keyword.
* **Generar contenido completo** con H1, H2, H3, párrafos, sugerencias de imágenes y schema markup usando GPT-4o.
* **Insertar el contenido** directamente en el editor de bloques (Gutenberg) o el editor clásico.

= Planes =

* **Starter (Gratis):** 10 análisis/mes — acceso a todas las funciones de análisis.
* **Pro ($29 USD/mes):** 100 análisis/mes + generación de contenido con GPT-4o.
* **Agency ($99 USD/mes):** 1.000 análisis/mes + soporte dedicado.

Obtén tu API key en [diagnosticoseo.vercel.app/dashboard](https://diagnosticoseo.vercel.app/dashboard).

== Installation ==

1. Sube la carpeta `diagnosticoseo` a `/wp-content/plugins/`.
2. Activa el plugin desde **Plugins → Plugins instalados**.
3. Ve a **Ajustes → DiagnósticoSEO** y pega tu API key.
4. Edita cualquier post o página — verás el panel **DiagnósticoSEO** debajo del editor.

== Frequently Asked Questions ==

= ¿Necesito una cuenta? =
Sí. Regístrate gratis en [diagnosticoseo.vercel.app/dashboard](https://diagnosticoseo.vercel.app/dashboard) con tu email para obtener una API key gratuita (Plan Starter).

= ¿Funciona con el editor de bloques (Gutenberg)? =
Sí. El botón "Insertar en el Editor" genera bloques nativos de WordPress automáticamente.

= ¿Funciona con el editor clásico? =
Sí. Si tienes el plugin Classic Editor activo, el contenido se inserta en TinyMCE.

= ¿En qué idioma genera el contenido? =
En español por defecto, con soporte para múltiples países (Chile, Argentina, México, Colombia, España, Perú).

== Screenshots ==

1. Panel de configuración con gestión de API key.
2. Meta box en el editor: Análisis SEO con score visual.
3. Meta box en el editor: Generación de contenido H1/H2/H3.
4. Contenido insertado en el editor de bloques.

== Changelog ==

= 1.0.0 =
* Versión inicial.
* Análisis SEO con score 0-100, issues y quick wins.
* Generación de contenido con GPT-4o (H1, H2, H3, schema markup).
* Inserción automática en Gutenberg y editor clásico.
* Panel de configuración con test de conexión.
* Widget de dashboard.
