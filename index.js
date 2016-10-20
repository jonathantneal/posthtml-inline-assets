var filetype = require('file-type');
var fs       = require('fs-promise');
var path     = require('path');
var posthtml = require('posthtml');

module.exports = function (rawOptions) {
	// options
	var options = extend(defaultOptions, rawOptions);

	return function inlineAssets(tree) {
		// relative directory
		var pathToCWD = process.cwd();

		if (!options.from && tree.options && tree.options.from) {
			pathToCWD = path.dirname(path.resolve(tree.options.from));
		} else if (options.from) {
			pathToCWD = path.dirname(path.resolve(options.from));
		}

		// initialize inlined assets
		var readFiles = [];
		var warnings = [];

		// cached inline keys
		var inlineKeys = options.inline && Object.keys(options.inline);

		if (inlineKeys) {
			// walk each element
			tree.walk(function (node) {
				inlineKeys.forEach(function (key) {
					var type = options.inline[key];

					var hasCheck = typeof type.check === 'function';
					var hasThen = typeof type.then === 'function';

					if (hasCheck && hasThen) {
						var nodeChecked = type.check(node);

						if (nodeChecked) {
							var pathToInline = path.resolve(pathToCWD, nodeChecked);

							// push readFile promise
							readFiles.push(fs.readFile(pathToInline).then(function (buffer) {
								var mime = (filetype(buffer) || {}).mime;

								// processed node
								return type.then(node, {
									buffer:   buffer,
									from:     pathToInline,
									mimeType: mime
								});
							}, function (error) {
								warnings.push(error);
							}));
						}
					}
				});

				return node;
			});
		}

		// resolve all inlined assets
		return Promise.all(readFiles).then(function () {
			if (warnings.length) {
				console.warn(warnings);
			}

			return tree;
		});
	};
};

module.exports.process = function (contents, options) {
	return posthtml().use(module.exports(options)).process(contents);
};

var defaultOptions = {
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
};

function extend(objectA, objectB) {
	var objectC = {};

	Object.keys(objectA).concat(Object.keys(objectB)).filter(function (item, index, array) {
		return array.indexOf(item) === index;
	}).forEach(function (key) {
		var valueA = objectA[key];

		if (key in objectB) {
			var valueB = objectB[key];

			if (typeof valueA === 'object' && Object(valueA) === valueA && typeof valueB === 'object' && Object(valueB) === valueB) {
				objectC[key] = extend(valueA, valueB);
			} else {
				objectC[key] = valueB;
			}
		} else {
			objectC[key] = valueA;
		}
	});

	return objectC;
}
