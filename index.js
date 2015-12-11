var posthtml = require('posthtml');
var filetype = require('file-type');

var fs   = require('fs-promise');
var path = require('path');

module.exports = function (options) {
	// extend options from defaults
	options = extend({
		from:   __filename,
		inline: {
			image: {
				check: function (node) {
					return node.tag === 'img' && node.attrs && node.attrs.src;
				},
				then: function (node, data) {
					node.attrs.src = 'data:' + data.mimeType + ';base64,' + data.buffer.toString('base64');
				}
			},
			script: {
				check: function (node) {
					return node.tag === 'script' && node.attrs && node.attrs.src;
				},
				then: function (node, data) {
					delete node.attrs.src;

					node.content = [data.buffer.toString('utf8')];
				}
			},
			style: {
				check: function (node) {
					return node.tag === 'link' && node.attrs && node.attrs.rel === 'stylesheet' && node.attrs.href;
				},
				then: function (node, data) {
					delete node.attrs.href;
					delete node.attrs.rel;

					node.tag = 'style';

					node.content = [data.buffer.toString('utf8')];
				}
			}
		}
	}, options);

	// get relative directory
	var from = path.dirname(path.resolve(options.from));

	// cache type transforms
	var types = Object.keys(options.inline || []).map(function (key) {
		return options.inline[key];
	});

	return function (tree) {
		return new Promise(function (resolve) {
			// initialize inlined assets
			var inlined = [];

			// walk each element
			tree.walk(function (node) {
				types.forEach(function (type) {
					var href = typeof type.check === 'function' && type.check(node);

					if (href) {
						var full = path.join(from, href);

						// return read file
						inlined.push(fs.readFile(full).then(function (buffer) {
							if (typeof type.then === 'function') {
								return type.then(node, {
									buffer:       buffer,
									originalPath: href,
									resolvedPath: full,
									mimeType:     (filetype(buffer) || {}).mime
								});
							}
						}));
					}
				});

				return node;
			});

			// resolve all inlined assets
			Promise.all(inlined).then(resolve.bind(null, tree));
		});
	};
};

module.exports.process = function (contents, options) {
	var plugin = module.exports(options);

	return posthtml().use(plugin).process(contents);
};

function extend(objectA, objectB) {
	objectA = objectA || {};
	objectB = objectB || {};

	for (var key in objectB) {
		var valueA = objectA[key];
		var valueB = objectB[key];

		if (typeof valueA === 'object' && Object(valueA) === valueA && typeof valueB === 'object' && Object(valueB) === valueB) {
			objectA[key] = extend(valueA, valueB);
		} else {
			objectA[key] = valueB;
		}
	}

	return objectA;
}
