<?php


/*
Plugin Name: WP Geo Big Map
Plugin URI: http://berniesumption.com/
Description: Adds a full screen map to WP-Geo. Install WP-Geo, then this plugin, then place the shortcode [big_map] on any page.
Version: 1
Author: Bernie Sumption
Author URI: http://berniesumption.com/
Minimum WordPress Version Required: 3.1
Tested up to: 3.1.1
License: FreeBSD license
*/




//
// To control the appearance of the post badge beyond what is possible with CSS, define an
// alternative version of this function in your theme functions.php
//
if (!function_exists('get_big_map_post_badge')) {
	function get_big_map_post_badge($single) {

		$imgtag = "";
		$img_id = get_post_thumbnail_id($single->ID);
		if ($img_id) {
			$img = wp_get_attachment_image_src($img_id, "thumbnail");
			$imgtag = "<img src=\"{$img[0]}\" width=\"{$img[1]}\" height=\"{$img[2]}\" />";
		}
		
		$date = date('jS M', strtotime($single->post_date));
		$link = get_permalink($single->ID);
		
		return <<<END
			<div class="big-map-post-badge">
				<a href="{$link}">
					{$imgtag}
					<span class="title">{$date}: {$single->post_title}</span>
					<span class="excerpt">{$single->post_excerpt}</span>
					<span class="more">more&nbsp;&gt;&gt;</span>
					<span class="bottom"></span>
				</a>
			</div>
END;
	}
}

wp_enqueue_style('wp-geo-big-map-style', plugins_url('style.css', __FILE__));
wp_enqueue_script('wp-geo-big-map-scripts', plugins_url('scripts.js', __FILE__));

//
// Add post-only CSS class to HTML body element if postonly=true is specified in the query string
//

add_filter('body_class', 'do_add_postonly_body_class');

function do_add_postonly_body_class($classes) {
	if (isset($_GET['postonly']) && $_GET['postonly'] == "true") {
		$classes[] = 'post-only';
	}
	return $classes;
}

//
// Add [full_screen_map] shortcode
//

global $bigMapShortcodeAtts;

add_shortcode('big_map', 'shortcode_wp_geo_big_map');

function shortcode_wp_geo_big_map($atts, $content = null) {
	global $bigMapShortcodeAtts;
	
	$defaults = array(
		'backLink' => get_home_url(),
		'backText' => 'back to blog',
		'combined_text' => 'posts - click to view',
		
		'numberposts' => -1,
		'orderby' => 'post_date',
		'order' => 'DESC'
	);
	$bigMapShortcodeAtts = wp_parse_args($atts, $defaults);
	
	add_action('wp_footer', 'do_shortcode_wp_geo_big_map');
}

function do_shortcode_wp_geo_big_map() {
	global $wpgeo, $wpgeo_map_id, $bigMapShortcodeAtts;
	if (is_feed()) {
		return '';
	}
	
	$atts = $bigMapShortcodeAtts;
	
	$wpgeo_map_id++;
	$id = 'wpgeo_map_id_' . $wpgeo_map_id;
	
	$posts = get_posts($atts);
	
	// generate array holding posts
	$travelMapPoints = "[";
	$isFirst = true;
	foreach ( $posts as $post ) {
		$latitude = get_post_meta($post->ID, WPGEO_LATITUDE_META, true);
		$longitude = get_post_meta($post->ID, WPGEO_LONGITUDE_META, true);
		if ( is_numeric($latitude) && is_numeric($longitude) ) {
			$icon = apply_filters( 'wpgeo_marker_icon', 'wpgeo_icon_small', $post, 'wpgeo_map' );
			if (!$isFirst) {
				$travelMapPoints .= ",";
			}
			$isFirst = false;
			
			$travelMapPoints .= "\n\t\t\tnew MapLocation($latitude, $longitude, " . big_map_js_string_literal(get_big_map_post_badge($post)) . ", " . big_map_js_string_literal(get_permalink($post->ID)) . ")";
		}
	}
	$travelMapPoints .= "\n\t\t]";
	
	$backLink = big_map_js_string_literal('<a class="big-map-back" href="' . $atts['backLink'] . '">' . $atts['backText'] . '</a>');	
	$combined_text = big_map_js_string_literal($atts['combined_text']);	
	
	echo <<<END
		<div id="travel_map" class="wpgeo_map" style="width:100%; height:100%;"></div>
		<script type="text/javascript">
		<!--
		
		var bigMapBackLink = {$backLink};
		var bigMapCombinedText = {$combined_text};
		
		wp_geo_big_map({$travelMapPoints});
		
		-->
		</script>
END;
}

function big_map_js_string_literal($string) {
	return '"' . trim(preg_replace('/\r|\n|\r\n/', "\\n", addslashes($string))) . '"';
}

