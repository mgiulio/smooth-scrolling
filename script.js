//initSmoothScrolling();

function initSmoothScrolling() {
	var duration = 400;
	
	var pageUrl = location.hash
		? stripHash(location.href)
		: location.href
	;
	
	window.onpopstate = function(e) {
		console.log(e);
		// Restore sb pos at e.state.verticalScrollbarPosition
			// We could even smooth scroll to that position!
	};
	
	//eventDelegation();
	direct();
	
	function eventDelegation() {
		document.body.addEventListener('click', onClick, false);
		
		function onClick(e) {
			if (!isInPageLink(e.target))
				return;
			
			e.stopPropagation();
			e.preventDefault();
			
			var hash = e.target.hash;
			
			jump(hash, {
				duration: duration//,
				//callback: function() { location.hash = hash.substring(1); }
			});
		}
	}

	function direct() {
		[].slice.call(document.querySelectorAll('a'))
			.filter(isInPageLink)
			.forEach(function(a) { a.addEventListener('click', onClick, false); })
		;
			
		function onClick(e) {
			e.stopPropagation();
			e.preventDefault();
			
			var hash = e.target.hash;
			var targetUrl = e.target.href;
			
			jump(hash, {
				duration: duration,
				callback: function() { 
					//location.hash = hash.substring(1); 
					var verticalScrollbarPosition = 9999;
					console.log(targetUrl);
					history.pushState(
						{'verticalScrollbarPosition': 99/*verticalScrollbarPosition*/}, 
						'',
						targetUrl
					);
				}
			});
		}
		
	}

	function isInPageLink(n) {
		return n.tagName.toLowerCase() === 'a' 
			&& n.hash.length > 0
			&& stripHash(n.href) === pageUrl
		;
	}
		
	function stripHash(url) {
		return url.slice(0, url.lastIndexOf('#'));
	}

}
