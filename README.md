# PostHTML Inline Assets [<img src="https://posthtml.github.io/posthtml/logo.svg" alt="PostHTML" width="90" height="90" align="right">](posthtml)

[<img alt="npm version" src="https://img.shields.io/npm/v/posthtml-inline-assets.svg" height="20">](https://www.npmjs.com/package/posthtml-inline-assets)
[<img alt="build status" src="https://img.shields.io/travis/jonathantneal/posthtml-inline-assets/master" height="20">](https://travis-ci.org/jonathantneal/posthtml-inline-assets?branch=master)
[<img alt="support chat" src="https://img.shields.io/badge/support-chat-blue.svg" height="20">](https://gitter.im/posthtml/posthtml)

[PostHTML Inline Assets] lets you inline external scripts, styles, and images
in HTML.

```html
<link href="body.css" rel="stylesheet" class="body-style">

<!-- becomes -->

<style class="body-style">body { background-color: black; color: white; }</style>
```

## Usage

Add **PostHTML Inline Assets** to your project:

```bash
npm install posthtml-inline-assets --save-dev
```

Use **PostHTML Inline Assets** to process your HTML:

```js
const posthtml = require('posthtml')
const posthtmlInlineAssets = require('posthtml-inline-assets')

posthtml([
  posthtmlInlineAssets(/* pluginOptions */)
]).process(YOUR_HTML /*, processOptions */)
```

#### Gulp

Add [Gulp PostHTML] to your build tool:

```bash
npm install gulp-posthtml --save-dev
```

Use [PostHTML Inline Assets] in your Gulpfile:

```js
const posthtml = require('gulp-posthtml');
const posthtmlInlineAssets = require('posthtml-inline-assets');

gulp.task('css', () => gulp.src('./src/*.css').pipe(
  posthtml([
    posthtmlInlineAssets()
  ])
).pipe(
  gulp.dest('.')
));
```

#### Grunt

Add [Grunt PostHTML] to your build tool:

```bash
npm install grunt-posthtml --save-dev
```

Use [PostHTML Inline Assets] in your Gruntfile:

```js
const posthtmlInlineAssets = require('posthtml-inline-assets');

grunt.loadNpmTasks('grunt-posthtml');

grunt.initConfig({
  posthtml: {
    options: {
      use: [
       posthtmlInlineAssets()
      ]
    },
    dist: {
      src: '*.css'
    }
  }
});
```

## Options

### cwd

The `cwd` option specifies the working directory used by an HTML file, and it
is used to determine the relative location of assets. By default, the current
file directory is used, otherwise the current working directory is used.

```js
const posthtmlInlineAssets = require('posthtml-inline-assets');

posthtmlInlineAssets({
  cwd: '/path/to/files'
});
```

```html
<!-- resolves to /path/to/files/body.css -->
<link href="body.css" rel="stylesheet" class="body-style">
```

### root

The `root` option specifies the root directory used by an HTML file, and it
is used to determine the absolute location of assets. By default, the current
file directory is used, otherwise the current working directory is used.

```js
const posthtmlInlineAssets = require('posthtml-inline-assets');

posthtmlInlineAssets({
  root: '/path/to/files'
});
```

```html
<!-- resolves to /path/to/files/body.css -->
<link href="/body.css" rel="stylesheet" class="body-style">

<!-- resolves to the current working directory + body.css -->
<link href="body.css" rel="stylesheet" class="body-style">
```

### errors

The `errors` option specifies how transform errors should be handled,
whether those errors occur when a resolved asset cannot be read, or when
something goes wrong while an asset is being transformed. The default
behavior is to `ignore` these errors, but they may also `throw` an error,
or log a `warning`.

```js
const posthtmlInlineAssets = require('posthtml-inline-assets');

posthtmlInlineAssets({
  // throw an error whenever a resolved asset fails to inline
  errors: 'throw' // the options are to 'throw', 'warn', or 'ignore' errors
});
```

### transforms

The `transforms` option specifies the transforms used to inline assets. New
transforms can be added by creating a child object with two functions;
`resolve` and `transform`.

#### resolve

The `resolve` function is used to determine the path of an asset. It is passed
the current node, and it must return the path of the asset to be inlined. If it
does not return a string, the asset will not be transformed.

```js
function resolve(node) {
  // if the node is a <foo> element then always return 'some/path'
  return node.tag === 'foo' && 'some/path'; 
}
```

#### transform

The `transform` function is used to transform the asset being inlined. It is
passed the current node as well as an object containing the `buffer`, the full
`path`, and the `mime` type (if available) of the asset. It may also return a
promise if an asynchronous transform is required.

```js
function transform(node, { buffer, path, mime }) {
  // always inline the contents as a child of the node
  node.content = [ buffer.toString('utf8') ];
}
```

### Examples of changing or creating transforms

The default transforms can be modified to alter their functionality. For
instance, `script.resolve` might be changed so that `<script>` elements with a
`type` attribute are ignored.

```js
const posthtmlInlineAssets = require('posthtml-inline-assets');

posthtmlInlineAssets({
  transforms: {
    script: {
      resolve(node) {
        // transform <script src="file.js"> but not <script src="file.js" type>
        return node.tag === 'script' && node.attrs && !node.attrs.type && node.attrs.src;
      }
    }
  }
});
```

The transform could also be removed entirely by passing the transform a
non-object.

```js
const posthtmlInlineAssets = require('posthtml-inline-assets');

posthtmlInlineAssets({
  transforms: {
    // any non-object will work
    script: false
  }
});
```

New transforms are easy to add. For instance, a new `pics` object might be
added to inline `<picture>` elements with a `src` attribute.

```js
const posthtmlInlineAssets = require('posthtml-inline-assets');

posthtmlInlineAssets({
  transforms: {
    pics: {
      resolve(node) {
        return node.tag === 'picture' && node.attrs && node.attrs.src;
      },
      transform(node, data) {
        node.tag = 'img';

        node.attrs.src = 'data:' + data.mime + ';base64,' + data.buffer.toString('base64');
      }
    }
  }
});
```

Be creative with your transforms. For instance, `script.transform` might be
changed so that the contents of the script are also minified.

```js
const posthtmlInlineAssets = require('posthtml-inline-assets');
const uglify = require('uglify-js');

posthtmlInlineAssets({
  transforms: {
    script: {
      transform(node, data) {
        delete node.attrs.src;

        node.content = [
          uglify.minify(data.buffer.toString('utf8')).code
        ];
      }
    }
  }
});
```

[Gulp PostHTML]: https://github.com/posthtml/gulp-posthtml
[Grunt PostHTML]: https://github.com/TCotton/grunt-posthtml
[PostHTML Inline Assets]: https://github.com/jonathantneal/posthtml-inline-assets
[PostHTML]: https://github.com/posthtml/posthtml
