<?php


/*
Plugin Name: WP Geo Big Map
Plugin URI: http://berniesumption.com/
Description: Adds a full screen map to WP-Geo. Install WP-Geo, then this plugin, then place the shortcode [big_map] on any page.
Version: 1.5.3
Author: Bernie Sumption
Author URI: http://berniesumption.com/
Minimum WordPress Version Required: 3.1
Tested up to: 3.5.1
License: FreeBSD license
*/

//
// To control the appearance of the post badge beyond what is possible with CSS, define an
// alternative version of this function in your theme functions.php
//
if (!function_exists('get_big_map_post_badge')) {
	function get_big_map_post_badge($single) {

		$imgtag = "";
		if (function_exists('get_post_thumbnail_id')) {
			$img_id = get_post_thumbnail_id($single->ID);
			if ($img_id) {
				$img = wp_get_attachment_image_src($img_id, "thumbnail");
				$imgtag = "<img src=\"{$img[0]}\" width=\"{$img[1]}\" height=\"{$img[2]}\" />";
			}
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


function wp_geo_big_map_enque_header_items() {

    // General styles
    wp_enqueue_style('wp-geo-big-map-style', plugins_url('style.css', __FILE__));

    // script to display big map on post pages
    $apitype = "googlemapsv3";
    $wp_geo_options = get_option( 'wp_geo_options' );
    if (isset($wp_geo_options["public_api"])) {
        $apitype = $wp_geo_options["public_api"];
    }
	if ($apitype != "googlemapsv2" && $apitype != "googlemapsv3") {
	    define('WPGEO_BIG_MAP_UNSUPPORTED_API', true);
	} else {
	    wp_enqueue_script('wp-geo-big-map-scripts', plugins_url("big-map-{$apitype}.js", __FILE__));
	}
    
    // script to hide non-content elements on post pages in iframes
    if (isset($_GET['postonly']) && $_GET['postonly'] == "true") {
        wp_enqueue_script('wp-geo-big-map-hide-contents', plugins_url('hide-contents.js', __FILE__));
    }
}

wp_geo_big_map_enque_header_items();

//
// Add [big_map] shortcode
//

global $big_map_shortcode_atts, $big_map_show_days;

add_shortcode('big_map', 'shortcode_wp_geo_big_map');

function shortcode_wp_geo_big_map($atts, $content = null) {
	global $big_map_shortcode_atts;
	
	$defaults = array(
		'lines' => true,
		'css_class' => false,
		'show_days' => 0,
		'fade_old_posts_to' => false,
		'full_window' => true,
		'post_link_target' => false,
		'backlink' => get_home_url(),
		'backtext' => 'back to blog',
		'combined_text' => 'posts - click to view',
		'numberposts' => -1,
		'orderby' => 'post_date',
		'order' => 'DESC',
		'lat' => false,
		'long' => false,
		'zoom' => false,
		'maptype' => false,
		'current_user_only' => false,
		'post_type' => 'post,page'
	);
	$big_map_shortcode_atts = wp_parse_args($atts, $defaults);
	
	add_action('wp_footer', 'do_shortcode_wp_geo_big_map');
	
	
	if (defined('WPGEO_BIG_MAP_UNSUPPORTED_API')) {
	    return "Can't display Big Map - unrecognised maps api type $apitype";
	}
	
	return <<<END
		<div id="travel_map" class="wpgeo_map" style="width:100%; height:100%;">
			Big Map can't be displayed. This is almost always because JavaScript is turned off, or there
			are JavaScript errors on this page preventing the map script from running (check the browser
			console for error messages)
		</div>
END;
}

function do_shortcode_wp_geo_big_map() {
	global $wpgeo, $wpgeo_map_id, $big_map_shortcode_atts, $big_map_show_days;
	if (is_feed()) {
		return '';
	}
	
	
	$atts = $big_map_shortcode_atts;
	
	$wpgeo_map_id++;
	$id = 'wpgeo_map_id_' . $wpgeo_map_id;
	
	if ($atts['current_user_only']) {
		$atts['author'] = (int) get_current_user_id();
	}
	
	// if show_days filter on posts newer than show_days and return days_old field in response
	$big_map_show_days = (int) $atts['show_days'];
	$fade_to = false;
	if ($big_map_show_days > 0) {
		add_filter( 'posts_where', 'big_map_add_posts_where' );
		add_filter( 'posts_fields', 'big_map_add_posts_fields' );
		$atts['suppress_filters'] = false;
		$fade_to = $atts['fade_old_posts_to'];
		if (is_numeric($fade_to) && $fade_to < 1) {
			$fade_to = max($fade_to, 0);
		}
	}
	
	$atts['post_type'] = explode(',', $atts['post_type']);
	
	$posts = get_posts($atts);
	
	remove_filter( 'posts_where', 'big_map_add_posts_where' );
	remove_filter( 'posts_fields', 'big_map_add_posts_fields' );
	
	// generate array holding posts
	$travelMapPoints = "[";
	$isFirst = true;
	foreach ( $posts as $post ) {
		$marker = get_post_meta($post->ID, WPGEO_MARKER_META, true);
		if ($marker == "") {
			$marker = "big_map_default_icon";
		} else {
			$marker = "wpgeo_icon_$marker";
		}
		// line_to_post command must be e.g. "350, #FF0000" for a red line to post 350
		$post_line = get_post_meta($post->ID, "line_to_post", true);
		if ($post_line && preg_match("/(\\d+)[\\s,]*#?([0-9a-fA-F]{6})?/", $post_line, $matches)) {
			$line_to_id = (int) $matches[1];
			$line_to_color = count($matches) > 2 ? $matches[2] : "000000";
			$post_line_js = "{id: $line_to_id, color: '#$line_to_color'}";
		} else {
			$post_line_js = "null";
		}
		$latitude = get_post_meta($post->ID, WPGEO_LATITUDE_META, true);
		$longitude = get_post_meta($post->ID, WPGEO_LONGITUDE_META, true);
		if ( is_numeric($latitude) && is_numeric($longitude) ) {
			if (!$isFirst) {
				$travelMapPoints .= ",";
			}
			$isFirst = false;
			
			if (is_numeric($fade_to)) {
				$proportion_old = ($big_map_show_days - $post->days_old) / $big_map_show_days;
				$alpha = $fade_to + ($proportion_old * (1-$fade_to));
			} else {
				$alpha = 1;
			}
			
			$travelMapPoints .= "\n\t\t\tnew MapLocation({$post->ID}, $latitude, $longitude, "
				. big_map_js_string_literal(get_big_map_post_badge($post)) . ", "
				. big_map_js_string_literal(get_permalink($post->ID)) . ", "
				. big_map_js_string_literal($marker) . ", "
				. $post_line_js . ", "
				. $alpha . ")";
		}
	}
	$travelMapPoints .= "\n\t\t]";
	
	$backLink = big_map_js_string_literal('<a class="big-map-back" href="' . $atts['backlink'] . '">' . $atts['backtext'] . '</a>');	
	$combined_text = big_map_js_string_literal($atts['combined_text']);
	$polyLines = $atts['lines'] ? "true" : "false";
	$fullWindow = $atts['full_window'] ? "true" : "false";
	$center = is_numeric($atts['lat']) && is_numeric($atts['long']) ? "new LatLng({$atts['lat']}, {$atts['long']})" : "false";
	$zoom = is_numeric($atts['zoom']) ? round($atts['zoom']) : "false";
	$mapType = big_map_js_string_literal($atts['maptype']);
	$linkTarget = $atts['post_link_target'] ? big_map_js_string_literal($atts['post_link_target']) : "false";
	$cssClass = $atts['css_class'] ? big_map_js_string_literal($atts['css_class']) : "false";
	
	echo <<<END
		<script type="text/javascript">
		<!--
		// locations, combinedText, backLink, polyLines
		var LatLng = window.GLatLng || (window.google && google.maps.LatLng) || function(){} ;
		wp_geo_big_map({
			locations: {$travelMapPoints},
			combinedText: {$combined_text},
			backLink: {$backLink},
			polyLines: {$polyLines},
			center: {$center},
			zoom: {$zoom},
			mapType: {$mapType},
			fullWindow: {$fullWindow},
			linkTarget: {$linkTarget},
			cssClass: {$cssClass}
		});
		
		-->
		</script>
END;
}

// Create a new filtering function that will add our where clause to the query
function big_map_add_posts_where( $where = '' ) {
	global $big_map_show_days;
	$where .= " AND DATEDIFF(NOW(), post_date) < $big_map_show_days";
	return $where;
}
function big_map_add_posts_fields( $fields = '' ) {
	global $big_map_show_days;
	$fields .= ", DATEDIFF(NOW(), post_date) as days_old";
	return $fields;
}

function big_map_js_string_literal($string) {
	return '"' . trim(preg_replace('/\r|\n|\r\n/', "\\n", addslashes($string))) . '"';
}

