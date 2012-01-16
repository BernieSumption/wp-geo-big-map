
function MapLocation(lat, lng, badge_html, link, marker) {
	this.lat = lat;
	this.lng = lng;
	this.badge_html = badge_html;
	this.link = link;
	this.tag = lat + "," + lng;
	this.marker = marker
}

// display a full page map.
function wp_geo_big_map(conf) {

	var el = document.getElementById("travel_map");
	
	if (!window.GBrowserIsCompatible) {
		alert("Can't display big map because Google Maps is not available. Is the WP Geo plugin installed?");
		return;
	}

	if ( GBrowserIsCompatible() ) {
		
		// remove rest of page contents
		el.parentNode.removeChild(el);
		while (document.body.children.length > 0) {
			document.body.removeChild(document.body.children[0]);
		}
		document.body.appendChild(el);
		
		// set full screen viewport
		var props = {height: "100%", overflow: "hidden", padding: "0px", margin: "0px"};
		for (var prop in props) {
			document.body.style[prop] = props[prop];
			document.body.parentNode.style[prop] = props[prop];
		}
		
		jQuery("body").append(conf.backLink);
		
		jQuery("body").append('<div id="big-map-tooltip"></div>');
		window.bigMapTooltip = jQuery("#big-map-tooltip");
		jQuery("body").mousemove(function(e) {
			positionBigMapTooltip(e.pageX, e.pageY);
		});
		
		var tagCounts = {}; // map of "lat,long" to 
		for (var i=0; i<conf.locations.length; i++) {
			var location = conf.locations[i];
			if (!tagCounts[location.tag]) {
				tagCounts[location.tag] = 1;
			} else {
				tagCounts[location.tag] ++;
			}
		}
	
		// draw markers
		var bounds = new GLatLngBounds();
		map = new GMap2(el, {mapTypes: [G_PHYSICAL_MAP, G_HYBRID_MAP]});
		var ui = map.getDefaultUI();
		map.setUI(ui);
		var points = [];
		var drawnTags = {};
		for (var i=0; i<conf.locations.length; i++) {
			var location = conf.locations[i];
			var center = new GLatLng(location.lat, location.lng);
			var icon = window[location.marker] || G_DEFAULT_ICON;
			if (!icon.infoWindowAnchor) {
				icon.infoWindowAnchor = new GPoint(icon.iconSize.width / 2, -10);
			}
			if (location.tag && tagCounts[location.tag] > 1) {
				if (drawnTags[location.tag]) {
					continue;
				}
				drawnTags[location.tag] = true;
				var count = 0;
				for (var j=0; j<conf.locations.length; j++) {
					if (conf.locations[j].tag == location.tag) {
						count ++;
					}
				}
				var badgeHtml = '<div class="big-map-tooltip">' + count + " " + conf.combinedText + "</div>";
				var marker = createBigMapMarker(map, center, icon, badgeHtml);
				addTagListPopup(marker, location.tag);
			} else {
				var marker = createBigMapMarker(map, center, icon, location.badge_html);
				GEvent.addListener(marker, "click", makeIframePopupCallback(marker, location.link));
			}
			points[points.length] = center;
			bounds.extend(center);
		}
		if (conf.polyLines) {
			var polyline = new GPolyline(points, "#FFFFFF", 3, 0.7);
			map.addOverlay(polyline);
		}
		zoom = map.getBoundsZoomLevel(bounds);
		map.setCenter(conf.center || bounds.getCenter(), conf.zoom || zoom);
		if (conf.mapType && window[conf.mapType]) {
			map.setMapType(window[conf.mapType]);
		}
	}
	
	function addTagListPopup(marker, tag) {
		GEvent.addListener(marker, "click", function(overlay, latlong) {
			var badgeHtml = [];
			for (var i=0; i<conf.locations.length; i++) {
				var location = conf.locations[i];
				var pointTag = location.tag;
				if (pointTag == tag) {
					badgeHtml.push(location.badge_html);
				}
			}
			var el = document.createElement("div");
			el.innerHTML = badgeHtml.join("");
			var links = el.getElementsByTagName("a");
			for (var i=0; i<links.length; i++) {
				var originalHref = links[i].href;
				links[i].href = "javascript:void(0);";
				links[i].onclick = makeIframePopupCallback(marker, originalHref);
			}
			marker.openInfoWindow(el, {maxWidth: 1100});
		});
	}
	
	function makeIframePopupCallback(marker, link) {
		return function(overlay, latlong) {
			var el = document.createElement("div");
			el.innerHTML = "loading...";
			el.style.width = "660px";
			el.style.height = "550px";
			el.style.border = "none";
			marker.openInfoWindow(el, {maxWidth: 1100});
			var f = function() {
				var qm_or_amp = link.indexOf("?") == -1 ? "?" : "&";
				el.innerHTML = '<iframe src="' + link + qm_or_amp + 'postonly=true" width="660" height="550" frameborder="0"></iframe>';
			};
			var ver = getInternetExplorerVersion();
			if (ver >= 6 && ver < 8) {
				// IE don't like immediately creating an iframe. Durr.
				setTimeout(f, 2000);
			} else {
				f();
			}
		}
	}
	
	function getInternetExplorerVersion() {
	   var rv = -1;
	   if (navigator.appName == 'Microsoft Internet Explorer')
	   {
		  var ua = navigator.userAgent;
		  var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
		  if (re.exec(ua) != null)
			 rv = parseFloat( RegExp.$1 );
	   }
	   return rv;
	}
	
	function hideNonAncestorElements(el) {
		var parent = el.parentNode;
		if (!parent) return;
		for (var i=0; i<parent.childNodes; i++) {
			if (parent.childNodes[i] != el) {
				parent.childNodes[i].style.display = "none";
			}
		}
		hideNonAncestorElements(parent);
	}
}


function createBigMapMarker(map, latlng, icon, badge, link)  {
	var tooltip = new Tooltip(marker, badge);
	var marker = new GMarker(latlng, icon);
	
	marker.latlng = latlng;
	marker.tooltip = tooltip;
	marker.badge = badge;
	marker.link = link;
	
	GEvent.addListener(marker, "mouseover", showBigMapTooltip);
	GEvent.addListener(marker, "mouseout", hideBigMapTooltip);
	
	map.addOverlay(marker);
	
	return marker;
	
}

function showBigMapTooltip(e) {
	if(!(this.isInfoWindowOpen || this.isHidden())) {	
		positionBigMapTooltip(e.pageX, e.pageY);
		bigMapTooltip.html(this.badge).show();
	}
}

function hideBigMapTooltip() {
	bigMapTooltip.hide();
}

function positionBigMapTooltip(x, y) {
	var width = bigMapTooltip.width();
	var left = x - Math.round(width * (1/3));
	var top = y - bigMapTooltip.height() - 15;
	if (left < 5) {
		left = 5;
	}
	var bodyWidth = jQuery("body").width();
	if (left + width + 5 > bodyWidth) {
		left = bodyWidth - width - 5;
	}
	if (top < 5) {
		top = y + 25;
	}
	bigMapTooltip.css("left", left);
	bigMapTooltip.css("top", top);
}
