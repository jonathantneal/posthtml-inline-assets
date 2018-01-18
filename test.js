var tests = {
	'posthtml-inline-assets': {
		'basic': {
			message: 'supports basic usage',
			options: {
				from: './test/index.html'
			}
		},
		'basic:root': {
			message: 'supports basic usage with root option',
			options: {
				root: './test/',
				from: './test/index.html'
			}
		},
		'basic:noimage': {
			message: 'supports basic usage without image transforms',
			options: {
				from:   './test/index.html',
				inline: {
					image: false
				}
			}
		},
		'basic:none': {
			message: 'supports basic usage without any transforms',
			options: {
				from:   './test/index.html',
				inline: false
			}
		},
		'basic:uglify': {
			message: 'supports basic usage with uglified scripts',
			options: {
				from:   './test/index.html',
				inline: {
					script: {
						then: function (node, data) {
							delete node.attrs.src;

							node.content = [minify(data.buffer.toString('utf8'), {
								fromString: true
							}).code];
						}
					}
				}
			}
		},
		'basic:cssnano': {
			message: 'supports basic usage with minified styles',
			options: {
				from:   './test/index.html',
				inline: {
					style: {
						then: function (node, data) {
							delete node.attrs.href;
							delete node.attrs.rel;

							node.tag = 'style';

							return cssnano.process(data.buffer.toString('utf8')).then(function (result) {
								node.content = [result.css];
							});
						}
					}
				}
			}
		}
	}
};

var debug = true;
var dir   = './test/';

var cssnano = require('cssnano');
var fs      = require('fs');
var minify  = require('uglify-js').minify;
var path    = require('path');
var plugin  = require('./');
var test    = require('tape');

Object.keys(tests).forEach(function (name) {
	var parts = tests[name];

	test(name, function (t) {
		var fixtures = Object.keys(parts);

		t.plan(fixtures.length);

		fixtures.forEach(function (fixture) {
			var message    = parts[fixture].message;
			var options    = parts[fixture].options;

			var baseName   = fixture.split(':')[0];
			var testName   = fixture.split(':').join('.');

			var inputPath  = path.resolve(dir + baseName + '.html');
			var expectPath = path.resolve(dir + testName + '.expect.html');
			var actualPath = path.resolve(dir + testName + '.actual.html');

			var inputHTML  = '';
			var expectHTML = '';

			try {
				inputHTML = fs.readFileSync(inputPath,  'utf8');
			} catch (error) {
				fs.writeFileSync(inputPath, inputHTML);
			}

			try {
				expectHTML = fs.readFileSync(expectPath,  'utf8');
			} catch (error) {
				fs.writeFileSync(expectPath, expectHTML);
			}

			plugin.process(inputHTML, options).then(function (result) {
				var actualHTML = result.html;

				if (debug) fs.writeFileSync(actualPath, actualHTML);

				t.equal(actualHTML, expectHTML, message);
			});
		});
	});
});
