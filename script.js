initSmoothScrolling();

function initSmoothScrolling() {
	if ('scrollBehavior' in document.documentElement.style)
		return;
	
	var duration = 400;
	
	var pageUrl = location.hash
		? stripHash(location.href)
		: location.href
	;
	
	delegatedLinkHijacking();
	//directLinkHijacking();
	
	function delegatedLinkHijacking() {
		document.body.addEventListener('click', onClick, false);
		
		function onClick(e) {
			if (!isInPageLink(e.target))
				return;
			
			e.stopPropagation();
			e.preventDefault();
			
			jump(e.target.hash, {
				duration: duration
			});
		}
	}

	function directLinkHijacking() {
		[].slice.call(document.querySelectorAll('a'))
			.filter(isInPageLink)
			.forEach(function(a) { a.addEventListener('click', onClick, false); })
		;
			
		function onClick(e) {
			e.stopPropagation();
			e.preventDefault();
			
			jump(e.target.hash, {
				duration: duration,
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
