/**
 * This is a RequireJS plugin for widget templates
 */
define(["mustache", "text"], function(Mustache, text) {
    var buildMap = {};

    return {
        load: function(name, req, onLoad, config) {
            text.get(req.toUrl(name), function(data) {
                if (config.isBuild) {
                    // Store parsed template for build optimization
                    buildMap[name] = JSON.stringify(Mustache.parse(data));
                }

                // Create a render function that matches Hogan's compiled template interface
                var template = {
                    render: function(context, partials) {
                        return Mustache.render(data, context, partials);
                    }
                };
                
                onLoad(template);
            });
        },

        write: function(plugin, module, write) {
            if (module in buildMap) {
                write(
                    'define("' + plugin + '!' + module + '",["mustache"],function(Mustache){' +
                    'var template = ' + buildMap[module] + ';' +
                    'return {' +
                    '  render: function(context, partials) {' +
                    '    return Mustache.render(' + JSON.stringify(module) + ', context, partials);' +
                    '  }' +
                    '};});'
                );
            }
        }
    };
});