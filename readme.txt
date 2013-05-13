=== WP Geo Big Map ===
Contributors: berniecode
Tags: geo, wp-geo, map
Requires at least: 3.1
Tested up to: 3.2.1

Adds a full screen map to WP-Geo. Install WP-Geo, then this plugin, then place the shortcode [big_map] on any page.

== Description ==

Adds a full screen map to WP-Geo. Install WP-Geo, then this plugin, then place the shortcode [big_map] on any page.

The [big_map] shortcode accepts arguments like so:

[big_map numberposts="10" author_name="bernie" tag="happy-days"]

The above will show the most recent 10 posts by the user "bernie" that are tagged "happy-days".

The full list of attributes accepted is:

*   lines: set to "0" to hide polylines between pins, default is "1" which shows lines
*   backLink: the URL of the back link, default is the blog home page
*   backText: the text of the back link, default is "back to blog"
*   combined_text: the text to show when multiple posts have been combined into one marker. This text is appended to the number of posts at that location. Default is "posts - click to view",  causing the tooltip to read e.g. "8 posts - click to view"
* lat, long: the latitude and longitude of the map center. The default behaviour is to center the map in the middle of the currently displayed points. Both of these properties must be provided to work correctly.
* zoom: an integer controlling the map scale. 3 shows most of the world, 10 shows a large city. The default setting is to automatically choose the highest zoom level that shows all the points on one screen.
* css_class: sets a CSS class on the map element. This is useful if you have more than one kind of map on your site and you want to style them differently
* mapType: a default map type. Available values are: G_NORMAL_MAP, G_HYBRID_MAP, G_PHYSICAL_MAP
* current_user_only: set to "1" to display only posts from the currently logged in user. If no user is logged in, the map will be empty.
* full_window: set to "0" to disable the plugin's default behaviour of taking up the whole window. Instead, the map will occupy the size of the HTML container it is in. Note however that it is still only possible to have one map per page.
* post_link_target: by default, clicking on a marker opens a post in an iframe without leaving the map. If this attribute is set, clicking a marker will link directly to a regular post. The value can be anything accepted by an HTML link's 'target' arrtibute. Useful values include "_self" (the current frame), "_blank" (a new window), "_top" (the topmost frame, useful if you are displaying a map in an iframe) or the name of a specific window.
* show_days: restrict the map to only showing posts up to a certain number of days old
* fade_old_posts_to: only valid with show_days. This can be a number between 0 and 1. Brand new posts will be fully opaque. As posts get older and approach the age where they would be removed from the map, they fade to this level of transparency. E.g. set show_days="10" fade_old_posts_to="0.5" to have posts fade to 50% transparency over 10 days before being removed.
* post_type: a csv list of wordpress post types to display, e.g. "post,page,my-custom-type"
*   Any of the parameters accepted by [get_posts()](http://codex.wordpress.org/Function_Reference/get_posts) which in turn accepts the parameters accepted by [WP_Query()](http://codex.wordpress.org/Function_Reference/WP_Query). These parameters control which posts are displayed on the map.

= A note on grouping points =

WP-Geo Big Map groups posts together if they have the same latitude and longitude. If you want to ensure that posts are grouped together, make sure that the map locations are *identical*.

= Drawing lines between two posts =

To draw a line between posts, first make a note of the post ID you want to link *to*. You can get this ID by editing the post and copying the number out of the URL. Then edit the post you want to link *from*. In this post, create a new custom field with the name "line_to_post". Enter the post id as a value. Optionally, you can enter the line colour using HTML color codes. For example, to draw a red line to post 350, enter a value of "350, FF0000"

= Customising WP-Geo Big Map =

*   You can override the CSS styles in your own theme's style.css
*   You can define a new `function get_big_map_post_badge($single)` in your theme's functions.php in order to control the look of the post badge beyond what is possible with CSS

= Using WP-Geo Big Map with other themes =

WP-Geo Big Map has been tested with the Twenty Ten and Twenty Eleven themes that ship with WordPress. When posts are viewed within an iframe, the parameter postonly=true is added to the URL. This triggers JavaScript that hides everything except the post. In order to be compatible with this process, your theme must ensure that the post content is inside the first element on the page with the CSS class "post".

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




