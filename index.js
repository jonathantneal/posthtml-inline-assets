// tooling
import filetype from 'file-type';
import fs from 'fse';
import path from 'path';
import defaultTransforms from './lib/default-transforms';
import errorHandler from './lib/error-handler';

// plugin
export default opts => {
	// initialize root from options
	const root = Object(opts).root;

	// initialize transform from options
	const transforms = Object(opts).transforms === false
		? {}
	: assign(defaultTransforms, Object(opts).transforms || {});

	return function posthtmlInlineAssets(tree) {
		// initialize current working directory from options
		const cwd = Object(opts).cwd
			? path.resolve(opts.cwd)
		: Object(tree.options).from
			? path.dirname(path.resolve(tree.options.from))
		: process.cwd();

		// initialize error handling from options
		const resolution = Object(opts).errors;

		// file promises
		const promises = [];

		// walk html nodes
		tree.walk(node => {
			// walk transforms
			Object.keys(transforms).forEach(type => {
				// transform
				const transform = Object(transforms[type]);

				// resolved asset file path
				const assetpath = typeof transform.resolve === 'function' && typeof transform.transform === 'function' && transform.resolve(node);

				if (typeof assetpath === 'string') {
					// absolute asset file path (used as "from")
					const from = root && path.isAbsolute(assetpath)
						? path.join(root, assetpath)
					: path.resolve(cwd, assetpath);

					// add promise of asset contents
					promises.push(
						fs.readFile(from).then(
							buffer => {
								// file type (used as "mime")
								const mime = (filetype(buffer) || {}).mime;

								// transform the node
								return transform.transform(node, { from, buffer, mime });
							}
						).catch(
							error => {
								// otherwise, handle any issues
								errorHandler(resolution, error, tree.messages);
							}
						)
					);
				}
			});

			return node;
		});

		// resolve all inlined assets
		return Promise.all(promises).then(
			() => {
				// filter errors from messages as warnings
				const warnings = tree.messages.filter(
					message => message instanceof Error
				);

				if (warnings.length) {
					// conditionally warn the user about any issues
					console.warn(`\nWarnings (${warnings.length}):\n${ warnings.map(
						message => `  ${message.message}`
					).join('\n') }\n`);
				}

				// return the ast
				return tree;
			}
		);
	}
}

function assign(objectA, objectB) {
	if (typeof objectA === 'object' && typeof objectB === 'object') {
		const objectC = Object.assign({}, objectA);

		for (let key in objectB) {
			objectC[key] = assign(objectA[key], objectB[key]);
		}

		return objectC;
	} else {
		return objectB;
	}
}
