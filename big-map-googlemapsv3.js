
function MapLocation(id, lat, lng, badge_html, link, marker, line_to_post, alpha) {
	this.id = id;
	this.lat = lat;
	this.lng = lng;
	this.badge_html = badge_html;
	this.link = link;
	this.tag = lat + "," + lng;
	this.marker = marker
	this.line_to_post = line_to_post;
	this.alpha = alpha;
}

// display a full page map.
function wp_geo_big_map(conf) {
	
	if (!(window.google && window.google.maps)) {
		alert("Can't display big map because Google Maps is not available. This normally means that you haven't yet installed WP Geo, or that you haven't activated it with the Google API key.");
		return;
	}

	var el = document.getElementById("travel_map");
	
	if (conf.cssClass) {
		jQuery("body").addClass(conf.cssClass);
	}
		
	if (conf.fullWindow) {
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
	}
	
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
	var bounds = new google.maps.LatLngBounds();
	
	map = new google.maps.Map(el, {mapTypeId: google.maps.MapTypeId.TERRAIN});
	
	var points = [];
	var drawnTags = {};
	var postsById = {};
	var markerLocations = [];

	for (var i=0; i<conf.locations.length; i++) {
		var location = conf.locations[i];
		postsById[location.id] = location;
		var center = new google.maps.LatLng(location.lat, location.lng);
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
			var marker = createBigMapMarker(map, center, location.marker, badgeHtml);
			addTagListPopup(marker, location.tag);
		} else {
			var marker = createBigMapMarker(map, center, location.marker, location.badge_html);
			google.maps.event.addListener(marker, "click", makePostClickHandler(marker, location.link));
		}
		markerLocations.push(location)
		points[points.length] = center;
		bounds.extend(center);
	}
	if (conf.polyLines) {
		new google.maps.Polyline({
			path: points,
			strokeColor: "#FFFFFF",
			strokeWeight: 3,
			strokeOpacity: 0.7,
			map: map
		});
	}
	for (var i=0; i<conf.locations.length; i++) {
		var location = conf.locations[i];
		if (location.line_to_post) {
			var target = postsById[location.line_to_post.id]
			if (target && target.id != location.id) {
				var points =  [new google.maps.LatLng(location.lat, location.lng), new google.maps.LatLng(target.lat, target.lng)]
				new google.maps.Polyline({
					path: points,
					strokeColor: location.line_to_post.color,
					strokeWeight: 3,
					strokeOpacity: 0.7,
					map: map
				});
			}
		}
	}
	if (conf.center) {
	    map.setCenter(conf.center);
	    if (conf.zoom) {
		    map.setZoom(conf.zoom);
		}
	} else {
    	map.fitBounds(bounds);
	}
	if (conf.mapType && google.maps.MapTypeId[conf.mapType]) {
		map.setMapTypeId(google.maps.MapTypeId[conf.mapType]);
	}
	
	function addTagListPopup(marker, tag) {
		google.maps.event.addListener(marker, "click", function(overlay, latlong) {
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
			el.style.overflow = "auto";
			el.style.height = "100%";
			el.style.width = "350px";
			el.style.maxHeight = "400px";
			var links = el.getElementsByTagName("a");
			for (var i=0; i<links.length; i++) {
				var originalHref = links[i].href;
				links[i].href = "javascript:void(0);";
				links[i].onclick = makePostClickHandler(marker, originalHref);
			}
			showInfoWindow(el, marker);
		});
	}
	
	var infoWindow;
	function showInfoWindow(el, marker) {
		if (infoWindow) {
			infoWindow.close();
		}
		infoWindow = new google.maps.InfoWindow({content: el, maxWidth: 1100});
		infoWindow.open(map, marker)
	}
	
	function makePostClickHandler(marker, link) {
		if (conf.linkTarget) {
			return function() {
				window.open(link, conf.linkTarget);
			}
		} else {
			return function(overlay, latlong) {
				var el = document.createElement("div");
				el.innerHTML = "loading...";
				el.style.width = "660px";
				el.style.height = "550px";
				el.style.border = "none";
				showInfoWindow(el, marker);
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
}


function createBigMapMarker(map, latlng, icon, badge)  {
	
	var options = {
		position: latlng,
		map: map
	};
	if (icon && window[icon]) {
		options.icon = window[icon];
	}
	
	var marker = new google.maps.Marker(options);
	
	var tooltip = new Tooltip(marker, badge);
	
	marker.tooltip = tooltip;
	marker.badge = badge;
	
	google.maps.event.addListener(marker, "mouseover", showBigMapTooltip);
	google.maps.event.addListener(marker, "mouseout", hideBigMapTooltip);
	
	return marker;
	
}

function showBigMapTooltip(e) {
	positionBigMapTooltip(e.pageX, e.pageY);
	bigMapTooltip.html(this.badge).show();
}

function hideBigMapTooltip() {
	bigMapTooltip.hide();
}

function positionBigMapTooltip(x, y) {
	if (navigator.userAgent.match(/OS [_0-9]+ like Mac OS X/i)) {
		return; // otherwise this method breaks on iOS
	}
	var width = bigMapTooltip.width();
	var height = bigMapTooltip.height();
	var left = x - Math.round(width * (1/3));
	var top = y - height - 15;
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
