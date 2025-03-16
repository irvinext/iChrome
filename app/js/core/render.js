/**
 * Template renderer and cacher
 */
define(["lodash", "mustache", "core/status", "i18n/i18n", "core/templates"], function(_, Mustache, Status, Translate, templates) {
	var cache = templates.compiled || {},
		raw = templates.raw || {},
		i18n = Translate.getAll();

	var render = function(template, data, partials) {
		var compiled = render.getTemplate(template);

		if (!compiled) {
			return 'Template "' + template + '" not found!';
		}

		data = _.clone(data || {});

		if (!data.i18n) {
			data.i18n = i18n;
		}

		return compiled.render(data, partials);
	};


	/**
	 * Returns a compiled template
	 *
	 * @param   {String}  template  The name of the template to retrieve
	 */
	render.getTemplate = function(template) {
		if (!cache[template] && typeof raw[template] !== "undefined") {
			try {
				// Create a compatible template object that mimics Hogan's interface
				cache[template] = {
					render: function(data, partials) {
						return Mustache.render(raw[template], data, partials);
					}
				};
				
				// Pre-parse the template for better performance
				Mustache.parse(raw[template]);
			}
			catch (e) {
				Status.error("An error occurred while trying to render the " + template + " template!");
			}
		}

		return cache[template];
	};

	render.getRowTemplate = function(template) {
		return raw[template];
	}


	return render;
});