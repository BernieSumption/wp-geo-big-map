=== WP Geo Big Map ===
Contributors: berniecode
Tags: geo, wp-geo, map
Requires at least: 3.1
Tested up to: 3.1

Adds a full screen map to WP-Geo. Install WP-Geo, then this plugin, then place the shortcode [big_map] on any page.

== Description ==

Adds a full screen map to WP-Geo. Install WP-Geo, then this plugin, then place the shortcode [big_map] on any page.

The [big_map] shortcode accepts arguments like so:

[big_map numberposts="10" author_name="bernie" tag="happy-days"]

The above will show the most recent 10 posts by the user "bernie" that are tagged "happy-days".

The full list of attributes accepted is:

*   backLink: the URL of the back link, default is the blog home page
*   backText: the text of the back link, default is "back to blog"
*   combined_text: the text to show when multiple posts have been combined into one marker. This text is appended to the number of posts at that location. Default is "posts - click to view",  causing the tooltip to read e.g. "8 posts - click to view"
*   Any of the parameters accepted by [get_posts()](http://codex.wordpress.org/Function_Reference/get_posts) which in turn accepts the parameters accepted by [WP_Query()](http://codex.wordpress.org/Function_Reference/WP_Query). These parameters control which posts are displayed on the map.

= A note on grouping points =

WP-Geo Big Map groups posts together if they have the same latitude and longitude. If you want to ensure that posts are grouped together, make sure that the map locations are *identical*.

= Customising WP-Geo Big Map =

*   You can override the CSS styles in your own theme's style.css
*   You can define a new `function get_big_map_post_badge($single)` in your theme's functions.php in order to control the look of the post badge beyond what is possible with CSS

= Using WP-Geo Big Map with other themes =

WP-Geo Big Map is designed to work with the Twenty Ten theme. When posts are viewed within an iframe, the CSS class "post-only" is added to the HTML body tag. The WP-Geo Big Map stylesheet contains rules that hide navigation elements and change the page width.

If you use another theme, you may have to change the CSS rules to hide unwanted page elements when in the map iframes.

== Installation ==

Either install through the wordpress "Add Plugin" page (search for "big map") or:

1. Upload the wp-geo-big-map` folder to your `/wp-content/plugins/` directory
1. Activate the plugin through the 'Plugins' menu in WordPress

== Screenshots ==

1. The map takes up the full browser window
2. HTML tooltips, configurable through your theme, display a preview of the post.
3. Posts can be read in a popup iframe without leaving the map

== Changelog ==

= 1.0 =
*   first version
If you have a custom theme that uses different element IDs for navigation elements, you may need to define new rules to hide navigation elements in your theme's style.css.




