/**
 * Configure requireJS.
 */
require.config({
	baseUrl: "js",
	paths: {
		"w": "../widgets",
		"text": "lib/text",
		"json": "lib/json",
		"mustache": "lib/mustache",
		"oauth": "lib/oauth",
		"lodash": "lib/lodash",
		"moment": "lib/moment",
		"jquery": "lib/jquery",
		"backbone": "lib/backbone",
		"oauth2": "../oauth2/oauth2",
		"fbanalytics": "lib/fbanalytics",
		"widgetTemplate": "widgets/registry/template",
		"jquery.serializejson": "lib/jquery.serializejson",
		"backbone.viewcollection": "lib/backbone.viewcollection",
		"fullcalendar": "lib/fullcalendar",
		"gcloader": "lib/gcloader",
		"feedlyproxy": "lib/feedlyproxy",
		"cryptoJs": "lib/cryptojs"
	},
	map: {
		"*": {
			"underscore": "lodash" // a Lodash Underscore build is not required for Backbone
		}
	},
	shim: {
		"lib/jquery.sortable": ["jquery"]
	}
});


// Make require synchronous. We do this to avoid delays with the two-tiered
// widget system (load the manifest, then the actual code). Without it calls to
// require wait at least 4ms before resolving, even if the module has been
// registered (but not initialized). The difference is difficult to measure but
// this saves approximately 200ms until the first full widget paint.
if (require.s) {
	require.s.contexts._.nextTick = function(fn) {
		return fn();
	};
}


/**
 * Init
 */
require(["core/init", "core/autorun", "core/pgdg"], function(app) {
	window.App = app;
});


(function() {
	// Preload all fonts using the Font Loading API so they're available for the first paint
	document.fonts.load("300 16px Open Sans, Roboto");
	document.fonts.load("400 16px Open Sans, Roboto, Entypo, Material Icons");
	document.fonts.load("500 16px Roboto");
	document.fonts.load("600 16px Open Sans");
	document.fonts.load("700 16px Open Sans, Roboto");

	// Preload the default background image, again so it's available at the first paint
	if (localStorage.themeImg) {
		var img = new Image();

		img.src = localStorage.themeImg;
	}
})();


//MP3: was in: <script id="preload-search-script">, see searxc.js
document.getElementById("preload-search-input").onkeydown = function(e) {
	if (e.keyCode === 13) {
		this.setAttribute("data-submit", "true");
	}
};
