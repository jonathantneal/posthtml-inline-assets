// tooling
const path = require('path');
const posthtml = require('posthtml');
const fs = require('fs');

const tests = {
	'posthtml-inline-assets': {
		'basic': {
			message: 'supports basic usage'
		},
		'basic:errors': {
			message: 'supports { errors: "throw" } option',
			options: {
				errors: 'throw'
			},
			expect: 'basic.html',
			errors: {
				message: /^Error: ENOENT/
			}
		},
		'basic:cwd': {
			message: 'supports { cwd } option',
			options: {
				cwd: 'path/to/unresolveable'
			},
			expect: 'basic.html'
		},
		'basic:root': {
			message: 'supports { root } option',
			options: {
				root: 'test'
			}
		},
		'basic:none': {
			message: 'supports { transforms: false } option',
			options: {
				transforms: false
			}
		},
		'basic:noimage': {
			message: 'supports { transform: { image: false } } option',
			options: {
				transforms: {
					image: false
				}
			}
		},
		'basic:uglify': {
			message: 'supports { transforms: { script: { process } } } minification option',
			options: {
				transforms: {
					script: {
						transform(node, data) {
							delete node.attrs.src;

							node.content = [
								require('uglify-js').minify(data.buffer.toString('utf8')).code
							];
						}
					}
				}
			}
		},
		'basic:cssnano': {
			message: 'supports { transforms: { style: { process } } } minification option',
			options: {
				transforms: {
					style: {
						transform(node, data) {
							delete node.attrs.href;
							delete node.attrs.rel;

							node.tag = 'style';

							return require('cssnano').process(
								data.buffer.toString('utf8'),
								{
									from: data.from
								}
							).then(result => {
								node.content = [result.css];
							});
						}
					}
				}
			}
		}
	}
};

// current working directory
const cwd = process.cwd();

// default options
const opts = {
	plugin:   cwd,
	config:   path.join(cwd, '.tape.js'),
	fixtures: path.join(cwd, 'test')
};

// plugin
const plugin = require(path.resolve(cwd, opts.plugin));

// run tests
Object.keys(tests).reduce(
	(testpromise, section) => testpromise.then(
		() => Object.keys(tests[section]).reduce(
			(sectionpromise, name) => sectionpromise.then(
				() => {
					const test = tests[section][name];

					// initialize test paths
					const testBase = name.split(':')[0];
					const testFull = name.split(':').join('.');

					const sourcePath = path.resolve(opts.fixtures, test.source || `${testBase}.html`);
					const expectPath = path.resolve(opts.fixtures, test.expect || `${testFull}.expect.html`);
					const resultPath = path.resolve(opts.fixtures, test.result || `${testFull}.result.html`);

					// begin test
					console.log('▶', section, test.message);

					// run something before the plugin
					if (test.before) {
						test.before();
					}

					const processOptions = Object.assign({
						from: sourcePath,
						to:   resultPath
					}, test.processOptions);

					const initializedPlugin = posthtml([
						(typeof test.plugin === 'function' ? test.plugin : plugin)(test.options)
					]);

					const readSource = readFile(sourcePath);

					const readExpect = readFile(expectPath).catch(
						() => writeFile(expectPath, '')
					);

					const processSource = readSource.then(
						(sourceHTML) => initializedPlugin.process(sourceHTML, processOptions)
					);

					const writeResult = processSource.then(
						result => writeFile(resultPath, result.html)
					);

					const compareResult = Promise.all([ writeResult, readExpect ]).then(
						resolve => {
							const resultHTML = resolve[0];
							const expectHTML = resolve[1];

							if (resultHTML !== expectHTML) {
								return Promise.reject([
									`Expected: ${JSON.stringify(expectHTML).slice(1, -1)}`,
									`Rendered: ${JSON.stringify(resultHTML).slice(1, -1)}`
								].join('\n'));
							} else {
								console.log('✔', section, test.message);

								return true;
							}
						},
						error => {
							const isExpectedError = test.errors && Object.keys(test.errors).every(
								(key) => test.errors[key] instanceof RegExp
									? test.errors[key].test(error[key])
								: test.errors[key] === error[key]
							);

							if (isExpectedError) {
								console.log('✔', section, test.message);

								return true;
							} else {
								console.log('✖', section, test.message);

								return Promise.reject(error.reason || error.message || error);
							}
						}
					).then(
						() => {
							// run something after the plugin
							if (test.after) {
								test.after();
							}
						}
					);

					return compareResult;
				}
			),
			Promise.resolve()
		)
	),
	Promise.resolve()
).then(
	() => {
		process.exit(0);
	},
	error => {
		console.warn(error);

		process.exit(1);
	}
);

// promises the contents of a file
function readFile(file) {
	return new Promise(
		(resolve, reject) => {
			fs.readFile(
				file, 'utf8', (error, contents) => {
					if (error) {
						reject(error);
					} else {
						// console.log('readFile', [file, contents]);
						resolve(contents);
					}
				}
			)
		}
	);
}

// promises contents written to a file
function writeFile(file, contents) {
	return new Promise(
		(resolve, reject) => {
			fs.writeFile(
				file, contents, error => {
					if (error) {
						reject(error);
					} else {
						// console.log('writeFile', [file, contents]);
						resolve(contents);
					}
				}
			)
		}
	);
}
