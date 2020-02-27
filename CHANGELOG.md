# Changes to PostHTML Inline Assets

### 3.1.0 (February 27, 2020)

- Added support for SVGs — `<img src="{PATH_TO_SVG}" />` (#13)
- Added support for favicons — `<link rel="icon" href="{PATH_TO_FAVICON}" />` (#14)

### 3.0.0 (January 19, 2018)

- Added: `root` option to handle absolute paths (`/path/to/asset.css`, etc.)
- Added: `errors` option to handle errors during inlining
- Changed: `cwd` option to replace `from` (`cwd` takes a working directory)
- Renamed: `inline` option to `transforms`
- Renamed: transform `check` function to `resolve`
- Renamed: transform `then` function to `transform`
- Renamed: `mime` key to replace `mimeType` key passed to `transform` function 

## 2.0.0 (October 20, 2016)

- Updated: `from` fallback is the current document

## 1.0.2 (December 11, 2015)

- Updated: Cleanup source for PostHTML debugging
- Updated: Add another link to PostHTML

## 1.0.1 (December 10, 2015)

- Updated: Allow `then` to chain to Promise
- Updated: Test to include `cssnano` example

## 1.0.0 (December 10, 2015)

- Added: Initial version
