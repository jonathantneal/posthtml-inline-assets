# Inline Assets

<a href="https://github.com/posthtml/posthtml"><img src="http://posthtml.github.io/posthtml/logo.svg" alt="PostHTML Logo" style="float:right;height:80px;width:80px" width="80" height="80" align="right"></a>

[![NPM Version][npm-img]][npm] [![Build Status][ci-img]][ci]

[Inline Assets] lets you inline external scripts, styles, and images in HTML.

```html
<!-- BEFORE -->
<link href="body.css" rel="stylesheet" class="body-style">
```

```html
<!-- AFTER -->
<style class="body-style">body { background-color: black; color: white; }</style>
```

## Usage

Add [Inline Assets] to your build tool:

```bash
npm install posthtml-inline-assets --save-dev
```

#### Node

```js
require('posthtml-inline-assets').process(YOUR_HTML, { /* options */ });
```

#### PostHTML

Add [PostHTML] to your build tool:

```bash
npm install posthtml --save-dev
```

Load [Inline Assets] as a PostHTML plugin:

```js
posthtml([
	require('posthtml-inline-assets')({ /* options */ })
]).process(YOUR_HTML, /* options */);
```

#### Gulp

Add [Gulp PostHTML] to your build tool:

```bash
npm install gulp-posthtml --save-dev
```

Enable [Inline Assets] within your Gulpfile:

```js
var posthtml = require('gulp-posthtml');

gulp.task('html', function () {
	return gulp.src('./src/*.html').pipe(
		posthtml([
			require('posthtml-inline-assets')({ /* options */ })
		])
	).pipe(
		gulp.dest('.')
	);
});
```

#### Grunt

Add [Grunt PostHTML] to your build tool:

```bash
npm install grunt-posthtml --save-dev
```

Enable [Inline Assets] within your Gruntfile:

```js
grunt.loadNpmTasks('grunt-posthtml');

grunt.initConfig({
	posthtml: {
		options: {
			use: [
				require('posthtml-inline-assets')({ /* options */ })
			]
		},
		dist: {
			src: '*.html'
		}
	}
});
```

## Options

#### `from`

Type: `String`  
Default: `currentFile.from || process.cwd()`

Specifies the location of the HTML file. It is used to determine the relative directory of the assets. By default, the current file is used, otherwise the current working directory is used.

#### `inline`

Type: `Object`  
Defaults: `image`, `script`, `style`

Specifies all of the transforms used on elements. Three transforms are available by default; `image`, `script`, and `style`.

### Transforms

Inline transforms are easily created or modified. They require two functions; `check` and `then`.

###### `check`

Type: `Function`  
Arguments: `node`

The method used to determine whether the element should be transformed. It is passed the current node, and it must return the path of the asset to be fetched.

###### `then`

Type: `Function`  
Arguments: `node, { buffer, originalPath, resolvedPath, mimeType }`

The method used to transform the element. It is passed the current node as well as an object containing the asset’s buffer, original path, resolved path, and mime type (if applicable).

### Transform Examples

All inline transforms may be modified to change their functionality. For instance, `inline.script.check` might be changed so that `<script>` elements with a `type` attribute are ignored.

```js
require('posthtml-inline-assets').process(YOUR_HTML, {
	inline: {
		script: {
			check: function (node) {
				return node.tag === 'script' && node.attrs && !node.attrs.type && node.attrs.src;
			}
		}
	}
});
```

New inline transforms may be added as well. For instance, `inline.picture` might be created so that `<picture>` elements with a `src` attribute are inlined.

```js
require('posthtml-inline-assets').process(YOUR_HTML, {
	inline: {
		picture: {
			check: function (node) {
				return node.tag === 'picture' && node.attrs && node.attrs.src;
			},
			then: function (node, data) {
				node.tag = 'img';

				node.attrs.src = 'data:' + data.mime + ';base64,' + data.buffer.toString('base64');
			}
		}
	}
});
```

Be creative with your transforms. For instance, `inline.script.then` might be changed so that the contents of the script are minified.

```js
var minify = require('uglify-js').minify;

require('posthtml-inline-assets').process(YOUR_HTML, {
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
});
```

[ci]:      https://travis-ci.org/jonathantneal/posthtml-inline-assets
[ci-img]:  https://img.shields.io/travis/jonathantneal/posthtml-inline-assets.svg
[npm]:     https://www.npmjs.com/package/posthtml-inline-assets
[npm-img]: https://img.shields.io/npm/v/posthtml-inline-assets.svg

[Gulp PostHTML]:  https://github.com/posthtml/gulp-posthtml
[Grunt PostHTML]: https://github.com/TCotton/grunt-posthtml
[PostHTML]:       https://github.com/posthtml/posthtml

[Inline Assets]: https://github.com/jonathantneal/posthtml-inline-assets
