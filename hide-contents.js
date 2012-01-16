
	
(function(){

	var restoreProps = {
		width: "640px",
		height: "auto",
		background: "white",
		padding: "0px",
		margin: "0px"
	};

	function hideNonAncestorElements(el) {
		var parent = el.parentNode;
		if (!parent) return;
		for (var i=parent.childNodes.length-1; i>=0; i--) {
			var node = parent.childNodes[i];
			if (node != el) {
				if (node.nodeType == 1) {
					node.style.display = "none";
				} else {
					parent.removeChild(node);
				}
			} else {
				for (var prop in restoreProps) {
					node.style[prop] = restoreProps[prop]
				}
			}
		}
		hideNonAncestorElements(parent);
	}
	
	setInterval(function() {
		el = jQuery(".post");
		if (el && el.length) {
			hideNonAncestorElements(el[0]);
		}
	}, 100);
})()

