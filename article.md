# Smooth Scrolling in Plain JavaScript and CSS

Smooth scrolling is an user interface pattern that progresssively enhances the default in-page navigation user experience by smoothly scrolling the scroll box(the viewport or a scrollable element) from the location of the activated link to the location of the destination element indicated in hash fragment of the link url.

This is nothing new, being a pattern  known from many years now,  check for instance this [SitePoint article](http://www.sitepoint.com/scroll-smoothly-javascript/) that dates back to 2003!  As an aside, this article has an historical value as it shows how client side JavaScript programming, and the DOM in particular, has changed and evolved in these years, allowing the development of vanilla JavaScript solutions less cumbersome.

Many implementations of this patterns are possible with the jQuery ecosystem, either using this library standalone or by using some plugins, but in this article we are interested to pure JavaScript solution. In particular we are going to explore the [Jump.js](http://callmecavs.com/jump.js/) library.

After a presentation of the utility, with an overview of its features and characteristics, we wil apply some changes to the original code to adapt it to our needs. In doing this we will refresh some JavaScript core language skills as functions and closures.
After this, we will write an HTML page to test the smooth scolling behavior that we will implement with an additional script.
Support, when available, for native smooth scrolling with CSS will then added and finally we conclude with some observations on the browser history.

## Jump.js

Jump.js is written in vanilla JavaScript(ES6), without any external dependencies.  It is a small utility, being only about 42 [SLOC](https://en.wikipedia.org/wiki/Source_lines_of_code). but the size of the provided minified bundle is around 2.67 KB because it had to be transpiled. 
A [Demo](http://callmecavs.com/jump.js/) is available on the Github project page. 

As suggested by the library name,  it provides only the jump, that is, the animated change of the scrollbar position from its current position to the destination, specified  providing either a element, its DOM node or the relative CSS selector, or a distance, a positive or negative number value. 
This means that in the implementation of the smooth scrolling pattern, we must perform the link  hijacking ourself. More on this in the following sections.

To be noted that at the moment only the scrolling of the [viewport is supported](https://github.com/callmecavs/jump.js/issues/23	) and only in the vertical direction. 
			
We can configure a jump with some options such as the duration(this parameter is mandatory), the easing function and a callback fired at the end of the animation. We will see them in action later in the demo. 
See the [documentation](https://github.com/callmecavs/jump.js) for full details.
		
Talking about browser support, Jump.js runs without problems on 'modern' browsers. See the [documentation](https://github.com/callmecavs/jump.js#browser-support) for full supported browser list. Here we report that regarding Internet Explorer, it is  required the version 10 or higher. With opportune polyfills for [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) it should run even on older browsers. 

## A Quick Peek Behind the Screen

Internally the Jump.js source uses the [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) method of the window object to schedule the update of the position of the viewport vertical position at each frame of the scrolling animation. This update is performed passing the next position value computed with the easing function to the window.scrollTo method. See the [source](https://github.com/callmecavs/jump.js/blob/master/src/jump.js) for full details.

## A Bit of Customization
		
Before diving into a demo to show the usage of Jump.js  we are going to  perform some slight changes to the original code, that however will left unmodified its core code.
In fact the code is in ES6 and it needs to be used with a Js build pipeline setup for transpiling and bundling modules. This could be overkill for some projects.
So we are going to apply some refactoring to convert the code to ES5, ready to be used everywhere.

First things first, let's remove ES6 syntax and features. The original code defines an ES6 class:

```javascript
import easeInOutQuad from './easing'

export default class Jump {
  jump(target, options = {}) {
    this.start = window.pageYOffset

    this.options = {
      duration: options.duration,
      offset: options.offset || 0,
      callback: options.callback,
      easing: options.easing || easeInOutQuad
    }

    this.distance = typeof target === 'string'
      ? this.options.offset + document.querySelector(target).getBoundingClientRect().top
      : target

    this.duration = typeof this.options.duration === 'function'
      ? this.options.duration(this.distance)
      : this.options.duration

    requestAnimationFrame(time => this._loop(time))
  }

  _loop(time) {
    if(!this.timeStart) {
      this.timeStart = time
    }

    this.timeElapsed = time - this.timeStart
    this.next = this.options.easing(this.timeElapsed, this.start, this.distance, this.duration)

    window.scrollTo(0, this.next)

    this.timeElapsed < this.duration
      ? requestAnimationFrame(time => this._loop(time))
      : this._end()
  }

  _end() {
    window.scrollTo(0, this.start + this.distance)

    typeof this.options.callback === 'function' && this.options.callback()
    this.timeStart = false
  }
}
```

We could convert this to a ES5 'class' with a constructor function and a bunch of prototype methods, but we observe that we never need multiple instances of this class, so a singleton implemented with a plain object literal will do the trick:

```javascript
var jump = (function() {

	var o = {

		jump: function(target, options) {
			this.start = window.pageYOffset

			this.options = {
			  duration: options.duration,
			  offset: options.offset || 0,
			  callback: options.callback,
			  easing: options.easing || easeInOutQuad
			}

			this.distance = typeof target === 'string'
			  ? this.options.offset + document.querySelector(target).getBoundingClientRect().top
			  : target

			this.duration = typeof this.options.duration === 'function'
			  ? this.options.duration(this.distance)
			  : this.options.duration

			requestAnimationFrame(_loop)
		},

		_loop: function(time) {
			if(!this.timeStart) {
			  this.timeStart = time
			}

			this.timeElapsed = time - this.timeStart
			this.next = this.options.easing(this.timeElapsed, this.start, this.distance, this.duration)

			window.scrollTo(0, this.next)

			this.timeElapsed < this.duration
			  ? requestAnimationFrame(_loop)
			  : this._end()
		},

		_end: function() {
			window.scrollTo(0, this.start + this.distance)

			typeof this.options.callback === 'function' && this.options.callback()
			this.timeStart = false
		}
	 
	};
	
	var _loop = o._loop.bind(o);

	// Robert Penner's easeInOutQuad - http://robertpenner.com/easing/
	function easeInOutQuad(t, b, c, d)  {
		t /= d / 2
		if(t < 1) return c / 2 * t * t + b
		t--
		return -c / 2 * (t * (t - 2) - 1) + b
	}
	
	return o;

})();
```

Apart from the class wiping, we needed to make a couple of other changes.
The callback for requestAnimationFrame, used to update the scrollbar position at each frame, that in the original code is invoked through an ES6 arrow function, is pre-bound to the jump singleton at init time.
Then we just bundled the default easing function in the same source file.
Finally, we have wrapped the code in an IIFE(*Immediately-invoked Function Expressions*) to avoid namespace pollution.

Now we apply another refactor step, noting that with the help of nested functions and closures(refer to SP article?) we can just use a function instead of an object.

```javascript
function jump(target, options) {
	var start = window.pageYOffset;

	var opt = {
	  duration: options.duration,
	  offset: options.offset || 0,
	  callback: options.callback,
	  easing: options.easing || easeInOutQuad
	};

	var distance = typeof target === 'string' ? 
		opt.offset + document.querySelector(target).getBoundingClientRect().top : 
		target
	;

	var duration = typeof opt.duration === 'function'
		  ? opt.duration(distance)
		  : opt.duration
	;

	var 
		timeStart = null,
		timeElapsed
	;
	
	requestAnimationFrame(loop);
	
	function loop(time) {
		if (timeStart === null)
			timeStart = time;

		timeElapsed = time - timeStart;

		window.scrollTo(0, opt.easing(timeElapsed, start, distance, duration));

		if (timeElapsed < duration)
			requestAnimationFrame(loop)
		else
			end();
	}

	function end() {
		window.scrollTo(0, start + distance);

		typeof opt.callback === 'function' && opt.callback();
		timeStart = null;
	}
	
	// Robert Penner's easeInOutQuad - http://robertpenner.com/easing/
	function easeInOutQuad(t, b, c, d)  {
		t /= d / 2
		if(t < 1) return c / 2 * t * t + b
		t--
		return -c / 2 * (t * (t - 2) - 1) + b
	}
 
}

```

The singleton now becomes the jump function that will be called to animate the scroll and the looping and the end callbacks becomes nested functions while the object properties now migrate to local variables(closures). Note that we don't need the IIFE anymore because now all the code is safely wrapped in the master function.

After a last refactoring step to avoid repeating the timeStart reset check at each invocation of the loop loop callback, along with some other minor changes, we get the final version of our customized script:

```javascript
function jump(target, options) {
	var 
		start = window.pageYOffset,
		opt = {
			duration: options.duration,
			offset: options.offset || 0,
			callback: options.callback,
			easing: options.easing || easeInOutQuad
		},
		distance = typeof target === 'string'
			? opt.offset + document.querySelector(target).getBoundingClientRect().top
			: target,
		duration = typeof opt.duration === 'function'
			? opt.duration(distance)
			: opt.duration,
		timeStart, timeElapsed
	;
	
	requestAnimationFrame(function(time) { timeStart = time; loop(time); });
	
	function loop(time) {
		timeElapsed = time - timeStart;

		window.scrollTo(0, opt.easing(timeElapsed, start, distance, duration));

		if (timeElapsed < duration)
			requestAnimationFrame(loop)
		else
			end();
	}

	function end() {
		window.scrollTo(0, start + distance);

		if (typeof opt.callback === 'function')
			opt.callback();
	}
	
	// Robert Penner's easeInOutQuad - http://robertpenner.com/easing/
	function easeInOutQuad(t, b, c, d)  {
		t /= d / 2
		if(t < 1) return c / 2 * t * t + b
		t--
		return -c / 2 * (t * (t - 2) - 1) + b
	}
 
}
```

The first time requestAnimationFrame is called we pass it an anonymous functions that reset the timerStart variable before calling the loop function.

Once again, note that in the course of these refactorings the core scrolling animation code didn't change.
	
## The Test Page

Now that we have customized the script to suit our needs, we are ready to assemble a testing demo.

In this section we write the page that we will enhance with smooth scrolling using the script presented in the next section.

The page consists of a table of content(TOC) with in-page links to following sections in the document,  with additional backward links to the TOC.  We will mix-in some external links pointing to other pages too. Here's the basic structure of this page:
 
```HTML
<body>
<h1>Title</h1>
<nav id="toc">
	<ul>
		<li><a href="#sect-1">Section 1</a></li>
		<li><a href="#sect-2">Section 2</a></li>
		...
	</ul>
</nav>
<section id="sect-1">
	<h2>Section 1</h2>
	<p>Pellentesque habitant morbi tristique senectus et netus et <a href="http://www.example.net/">a link to another page</a> ac turpis egestas. <a href="http://www.example.net/index.html#foo">A link to another page, with an anchor</a> quam, feugiat vitae, ...</p>
	<a href="#toc">Back to TOC</a>
</section>
<section id="sect-2">
	<h2>Section 2</h2>
	...
</section>
...
<script src="jump.js"></script>
<script src="script.js"></script>
</body>
```

In the head we include a few CSS rule to setup a basic, minimal layout, while at the end of the body tag we include two JavaScript files, the former is the customized version of Jump.js and the latter is the script that we discuss right now.

## The Master Script

This is the script that will enhance the scrolling experience of the test page with the animated jumps provided by our customized version of Jump.js. Of course also this code will be written in plain JavaScript.

Let's briefly outline the tasks the it should perform.
It must *hijack* the clicks on the in-page links, disabling the browser default behaviour, that is, the abrupt jump to the target element indicated in the hash fragment of the href attribute of the clicked link,  and replace it with a call to our jump() function.

So, first thing is to monitor the clicks on the in-page links.
We can do this in two ways, with event delegation or attaching the handler to each relevant link.

In the first approach, with event delegation, we add our click listener to only one elemnt, namely the document.body. In this way, every click event on whatever element of the page will bubble up DOM tree along the branch of its anchestors until it will reach the document body element:

```javascript
document.body.addEventListener('click', onClick, false);
```

Of course, now in the registered event listener(onClick) the first thing that we have to do is to inspect the target of the incoming click event object  to check that it is relative to an in page link element.
This can be don ine several ways so we abstract it in an helper function,  isInPageLink(). We'll have a look at the mechanics of this function in a moment.

If the incoming click is on an in-page link we stop the event bubbling and prevent the associated default action, the instantaneus scrollbar change to the target destination.

Finally we call our jump function, providing it first the hash selector for the target element and then the parameters to configure the desidered animated jump.

Here's our event handler:

```javascript
function onClick(e) {
	if (!isInPageLink(e.target))
		return;
	
	e.stopPropagation();
	e.preventDefault();
		
	jump(e.target.hash, {
		duration: duration
	});
}
```

With the second approach to monitoring the link clicks, the event handler, a slight modification of the one presented above,  is attached to each in-page link element, so there is no event bubbling:

```javascript
[].slice.call(document.querySelectorAll('a'))
	.filter(isInPageLink)
	.forEach(function(a) { a.addEventListener('click', onClick, false); });
```

We query for all A elements, and convert the returned DOM NodeList in a JavaScript array with the [].slice() hack. Then we can use the array methods to filter the in-page links,  re-using the same helper function defined above, and to finally attach the listener to the remaining link elements.

The event handler is almost the same as before but of course we don't need to check the click target:

```javascript		
function onClick(e) {
	e.stopPropagation();
	e.preventDefault();
	
	jump(hash, {
		duration: duration
	});
}
```

Which approach is best depends on the use context. For example, if new links elements may be dynamically added after the initial page load, we must use event delegation.

Now we turn to the implementation of the isInPageLink, the helper function we used in the previous event handlers to abstract the test for the in-page links.  As we have seen this function takes a DOM node as an argument and returns a boolean value to indicate if the node represents an in-page link element. It is not sufficient to check that the passed node is an A tag and that it has an hash fragment set because the link could be to another page and in this case the default browser action must not disabled. So we check if the value stored in the attribute href minus the hash fragment is equal to the page url:

```javascript
function isInPageLink(n) {
	return n.tagName.toLowerCase() === 'a' 
		&& n.hash.length > 0
		&& stripHash(n.href) === pageUrl
	;
}
```

stripHash is another helper funtion that we use also to set at script init time the value of the variable pageUrl:

```javascript
var pageUrl = location.hash
		? stripHash(location.href)
		: location.href
	;
	
function stripHash(url) {
	return url.slice(0, url.lastIndexOf('#'));
}
```

As I told before, this is only a possible way to perform this test. For example the [Sitepoint article](http://www.sitepoint.com/scroll-smoothly-javascript/) cited at the beginning of this tutorial uses a different solution, using the url components.

To be noted that we have used this function in both approaches to event subscription, but in the second one, we are using it as a filter for elements that we know are A tags so the first check on the tagName attribute is reduntant. This is left as an exercise for the reader:)

Here's the complete source of the master script, with all the previously discussed code snippets:

```javascript
initSmoothScrolling();

function initSmoothScrolling() {
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
```

## Supporting Native Smooth Scrolling  with CSS

The [CSS Object Model View module specification](https://drafts.csswg.org/cssom-view/#smooth-scrolling) introduced a new property to natively implement smooth scrolling: 'scroll-behavior'. 
Note the spelling, 'behavior' as used in America English and not 'behaviour'.
It can takes two values, auto for the default instant scrolling and smooth for the animated scrolling.
The Specification doesn't provide any way to configure the animation of the scroll, such as its duration and the timing function(easing).

Unfortunately, at the time of this writing the support is very low, there are a lot of red cells in the [Can I Use table]((http://caniuse.com/#feat=css-scroll-behavior)), with a bit of green only in the Firefox column.
In Chrome this features is [under development]((https://www.chromestatus.com/features/5812155903377408)) and a partial implementation is available enabling it in the chrome://flags screen. The css property is is not implemented yet so the smooth scrolling on link clicks doesn't work.

Anyway, with a tiny change to our master script, we can detect if this feature is available in the user agent and stopping its execution if the test result is positive. So let's go back to the sources.

First thing, to use smooth scrolling on the viewport we apply the CSS property to the root element, HTML(but in our test page we could even apply it to the body element):

```css
html {
	scroll-behavior: smooth;
}
```

Then we add a simple feature-detection test at the beginning of the script:

```javascript
function initSmoothScrolling() {
	if (isCssSmoothSCrollSupported()) {
		document.getElementById('css-support-msg').className = 'supported';
		return;
	}
...
}

function isCssSmoothSCrollSupported() {
	return 'scrollBehavior' in document.documentElement.style;
}
```

Hence, if the browser supports the native scrolling the script does nothing and quits, else it continue the execution as before and the unsupported CSS property will be ignored by the CSS parser.

## Conclusion

A further advantage of the CSS solution just discussed,  beyond implementation semplicity and performance, is that the browser history behavior is consistent with the one expected when using the default instant scrolling. Every in-page jump is pushed on the browser history stack and we can go back-and-forth throught this entries with the relative buttons(but without smooth scrolling, at least on Firefox).
	
Getting bak to the the master script, that now we could consider as a fallback when the CSS support lacks, we did not make any considerations on the  behaviour of the script with respect the browser history.
Depending on the context and use case this is something that may or may not be of interest, but if we are taking the view that the script should enhance the default scrolling experience we should except a consistent behavior, as it happens with CSS. But now we are out time therefore this could the subject for a follow-up to this article.
