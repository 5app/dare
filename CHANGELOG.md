## [0.46.5](https://github.com/5app/dare/compare/v0.46.4...v0.46.5) (2020-07-09)


### Bug Fixes

* **fields:** support GROUP_CONCAT(... ORDER BY 1) ([97ee8f2](https://github.com/5app/dare/commit/97ee8f29ff2e7c918d30073d1f26c58da3a4588b))
* **generated-functions:** remove extraneous fields ([#151](https://github.com/5app/dare/issues/151)) ([f0b6c6a](https://github.com/5app/dare/commit/f0b6c6ae09b4ae0b7ebfa4c9b28f9d119db5f56c)), closes [#150](https://github.com/5app/dare/issues/150) [#150](https://github.com/5app/dare/issues/150)

## [0.46.4](https://github.com/5app/dare/compare/v0.46.3...v0.46.4) (2020-07-03)


### Bug Fixes

* **ci:** ensure PR's have semantic titles ([d409c8a](https://github.com/5app/dare/commit/d409c8a715c48111bf07ce46c9a7c675ebf49cee))

## [0.46.3](https://github.com/5app/dare/compare/v0.46.2...v0.46.3) (2020-06-30)


### Bug Fixes

* **refactor:** Tidies code and deprecates features ([#146](https://github.com/5app/dare/issues/146)) ([2192521](https://github.com/5app/dare/commit/21925211c97bd310a5899be592b0640a851b42d4))

## [0.46.2](https://github.com/5app/dare/compare/v0.46.1...v0.46.2) (2020-06-24)


### Bug Fixes

* **alias:** fix labelling of aliased orderby, fixes [#142](https://github.com/5app/dare/issues/142) ([1fa8f10](https://github.com/5app/dare/commit/1fa8f10b72d6f6ded3dec26784a3cb950a61ff14))

## [0.46.1](https://github.com/5app/dare/compare/v0.46.0...v0.46.1) (2020-06-23)


### Bug Fixes

* **alias:** fix labelling of aliased fields, fixes [#142](https://github.com/5app/dare/issues/142) ([c79820c](https://github.com/5app/dare/commit/c79820c0cb1e3e7f69d62da070dfe7f92185d38f))

# [0.46.0](https://github.com/5app/dare/compare/v0.45.1...v0.46.0) (2020-06-18)


### Features

* **sql:** pass through '{sql, values}' to execute function ([#139](https://github.com/5app/dare/issues/139)) ([46f22e4](https://github.com/5app/dare/commit/46f22e4f07f672f45746e1576bb3cfa68026ca38))

## [0.45.1](https://github.com/5app/dare/compare/v0.45.0...v0.45.1) (2020-06-15)


### Bug Fixes

* fix rendering of SQL conditions in patch and delete ([18ba1ea](https://github.com/5app/dare/commit/18ba1ea2c3ffdf1778f8272b6824c9c11c41bf3e))

# [0.45.0](https://github.com/5app/dare/compare/v0.44.0...v0.45.0) (2020-06-03)


### Features

* **operators:** support for =,!=,<>,>,<,<=,>= operators ([3c5cd43](https://github.com/5app/dare/commit/3c5cd43a6aea989cd65d5b4322e21edf35830968))
* **operators:** support for =,!=,<>,>,<,<=,>= operators ([4088719](https://github.com/5app/dare/commit/4088719f6bf5f262aaf112a8c6ee9a1cde2ac919))

# [0.44.0](https://github.com/5app/dare/compare/v0.43.0...v0.44.0) (2020-05-22)


### Features

* **patch:** adds patch:option.duplicate_keys='ignore' ([8808c1a](https://github.com/5app/dare/commit/8808c1aa458e9e875f5220bca11d20cd36dbef77))

# [0.43.0](https://github.com/5app/dare/compare/v0.42.0...v0.43.0) (2020-03-11)


### Features

* **opt.notfound:** adds opts.notfound, fixes [#131](https://github.com/5app/dare/issues/131) ([cd38a65](https://github.com/5app/dare/commit/cd38a6524ea3649b781cd9a833137c8e0b7d96c0))

# [0.42.0](https://github.com/5app/dare/compare/v0.41.2...v0.42.0) (2020-02-21)


### Features

* **get:** opts.notfound, override the notfound behaviour ([cc80af5](https://github.com/5app/dare/commit/cc80af51e624c523b916c2f5fec40f8decaa9fad))

## [0.41.2](https://github.com/5app/dare/compare/v0.41.1...v0.41.2) (2020-01-27)


### Bug Fixes

* allow redefining arrays of field keys, fixes [#43](https://github.com/5app/dare/issues/43) ([1405742](https://github.com/5app/dare/commit/14057425fedfea0dd8003f602375b89bd383aca0))

## [0.41.1](https://github.com/5app/dare/compare/v0.41.0...v0.41.1) (2019-12-20)


### Bug Fixes

* **formatting:** include the index in the response_row_handler, [#96](https://github.com/5app/dare/issues/96) ([46d6f81](https://github.com/5app/dare/commit/46d6f817772c43f6b59f066c308393906d57fac1))

# [0.41.0](https://github.com/5app/dare/compare/v0.40.0...v0.41.0) (2019-12-19)


### Features

* **formatting:** provide a means of formatting responses, [#96](https://github.com/5app/dare/issues/96) ([70885c2](https://github.com/5app/dare/commit/70885c2ddbda06fe07c7ef55d23d52f6a941e71f))

# [0.40.0](https://github.com/5app/dare/compare/v0.39.2...v0.40.0) (2019-12-19)


### Features

* **filter:** filter empty, empty response, [#92](https://github.com/5app/dare/issues/92) ([c6af4c8](https://github.com/5app/dare/commit/c6af4c8568a93d2b17d30ffeb0b7828115241c6c))

## [0.39.2](https://github.com/5app/dare/compare/v0.39.1...v0.39.2) (2019-12-19)


### Reverts

* Revert "chore(ci): disable github actions" ([795f5d3](https://github.com/5app/dare/commit/795f5d3162f525aa2a5a46326286ffbf6b37a75e))

## [0.39.1](https://github.com/5app/dare/compare/v0.39.0...v0.39.1) (2019-12-17)


### Bug Fixes

* **buffer:** format response Buffer values ([#115](https://github.com/5app/dare/issues/115)) ([21ae6b2](https://github.com/5app/dare/commit/21ae6b281aa3d50375b87c40140170bcecb03e93))

# [0.39.0](https://github.com/5app/dare/compare/v0.38.0...v0.39.0) (2019-11-21)


### Features

* **json:** support serialised JSON data [#109](https://github.com/5app/dare/issues/109) ([#114](https://github.com/5app/dare/issues/114)) ([1a57653](https://github.com/5app/dare/commit/1a57653e6f6b24f3bc9d67ca487c353c1bb923b1))

# [0.38.0](https://github.com/5app/dare/compare/v0.37.1...v0.38.0) (2019-11-01)


### Features

* **field processing:** allow (.) character, disallow lowercase strings out of quotes ([#106](https://github.com/5app/dare/issues/106)) ([d61b198](https://github.com/5app/dare/commit/d61b1984ecb35ebbbed51a28a49abcf3b2e7c99a))

## [0.37.1](https://github.com/5app/dare/compare/v0.37.0...v0.37.1) (2019-10-31)


### Bug Fixes

* **ci:** clone to windows changing to CRLF ([#107](https://github.com/5app/dare/issues/107)) ([59a9750](https://github.com/5app/dare/commit/59a97502895925524901b65bd6183c63818d8536))

# [0.37.0](https://github.com/5app/dare/compare/v0.36.3...v0.37.0) (2019-10-18)


### Features

* **error:** return bad request 400 codes, instead of 500 ([b88a412](https://github.com/5app/dare/commit/b88a41277603fdc838d629c3b64481479e4dec7a))

## [0.36.3](https://github.com/5app/dare/compare/v0.36.2...v0.36.3) (2019-10-18)


### Bug Fixes

* **deps:** remove deepmerge, promote tricks ([c4ecca6](https://github.com/5app/dare/commit/c4ecca6f3b606186f3c7fe83d0b17c0b5f642e41))

## [0.36.2](https://github.com/5app/dare/compare/v0.36.1...v0.36.2) (2019-10-18)


### Bug Fixes

* **field-access:** revert deepMerge, it clones everything, [#99](https://github.com/5app/dare/issues/99) ([cf520ec](https://github.com/5app/dare/commit/cf520ec853ed2edbc69f4b5692aca8b10de86296))

## [0.36.1](https://github.com/5app/dare/compare/v0.36.0...v0.36.1) (2019-10-18)


### Bug Fixes

* **deploy:** silly preliminary release, noissue ([b4f79e0](https://github.com/5app/dare/commit/b4f79e03be94602f0ba869611054669e7feec4eb))

# [0.33.0](https://github.com/5app/dare/compare/v0.32.3...v0.33.0) (2019-10-18)


### Features

* **field-access:** enable declarative field access permissions [#99](https://github.com/5app/dare/issues/99) ([e1311af](https://github.com/5app/dare/commit/e1311af0c257f131a1c43de5b21434d8969cf628))

# [0.33.0](https://github.com/5app/dare/compare/v0.32.3...v0.33.0) (2019-10-18)


### Features

* **field-access:** enable declarative field access permissions [#99](https://github.com/5app/dare/issues/99) ([e1311af](https://github.com/5app/dare/commit/e1311af0c257f131a1c43de5b21434d8969cf628))

## [0.32.3](https://github.com/5app/dare/compare/v0.32.2...v0.32.3) (2019-09-25)


### Bug Fixes

* **filters:** prevent dare from modifying input filters, fixes [#91](https://github.com/5app/dare/issues/91) ([6c763dc](https://github.com/5app/dare/commit/6c763dc))

## [0.34.1](https://github.com/5app/dare/compare/v0.34.0...v0.34.1) (2019-09-05)


### Bug Fixes

* **getCount:** remove start option, [#81](https://github.com/5app/dare/issues/81) ([78afc8c](https://github.com/5app/dare/commit/78afc8c))
* **package:** refactor, but also trigger semantic release ([5ab2200](https://github.com/5app/dare/commit/5ab2200))
* **package:** refactor, but also trigger semantic release ([75fc5b1](https://github.com/5app/dare/commit/75fc5b1))

# [0.34.0](https://github.com/5app/dare/compare/v0.33.1...v0.34.0) (2019-09-05)


### Features

* **get:** shallow clone the request object to prevent mutation, [#81](https://github.com/5app/dare/issues/81) ([d7791f5](https://github.com/5app/dare/commit/d7791f5))
* **getCount:** Add Dare getCount to run the request and retrieve the number of matching results, [#81](https://github.com/5app/dare/issues/81) ([9ee95f6](https://github.com/5app/dare/commit/9ee95f6))
* **getCount:** clone the request object to prevent mutation, [#81](https://github.com/5app/dare/issues/81) ([17293b7](https://github.com/5app/dare/commit/17293b7))

## [0.33.1](https://github.com/5app/dare/compare/v0.33.0...v0.33.1) (2019-09-05)


### Bug Fixes

* **dist:** add deploy channel next ([9640cb8](https://github.com/5app/dare/commit/9640cb8))

# [0.33.0](https://github.com/5app/dare/compare/v0.32.2...v0.33.0) (2019-09-05)


### Features

* **dist:** add deploy channel next ([c0dddf6](https://github.com/5app/dare/commit/c0dddf6))
* **dist:** add deploy channel next ([c935a87](https://github.com/5app/dare/commit/c935a87))
* **dist:** add deploy channel next ([765d47f](https://github.com/5app/dare/commit/765d47f))

## [0.32.2](https://github.com/5app/dare/compare/v0.32.1...v0.32.2) (2019-09-03)


### Bug Fixes

* **datatype:** fix the broken datatype formatting, [#36](https://github.com/5app/dare/issues/36), [#84](https://github.com/5app/dare/issues/84) ([0d46af2](https://github.com/5app/dare/commit/0d46af2))

## [0.32.1](https://github.com/5app/dare/compare/v0.32.0...v0.32.1) (2019-09-03)


### Bug Fixes

* **datetime:** return cast datetime fields in ISO format ([71364db](https://github.com/5app/dare/commit/71364db))

# [0.32.0](https://github.com/5app/dare/compare/v0.31.4...v0.32.0) (2019-08-07)


### Features

* **Field Alias:** Enable aliasing field names ([#78](https://github.com/5app/dare/issues/78)) ([9d530d2](https://github.com/5app/dare/commit/9d530d2)), closes [#30](https://github.com/5app/dare/issues/30) [#30](https://github.com/5app/dare/issues/30) [#30](https://github.com/5app/dare/issues/30) [#30](https://github.com/5app/dare/issues/30) [#30](https://github.com/5app/dare/issues/30) [#30](https://github.com/5app/dare/issues/30) [#30](https://github.com/5app/dare/issues/30) [#30](https://github.com/5app/dare/issues/30) [#30](https://github.com/5app/dare/issues/30) [#30](https://github.com/5app/dare/issues/30) [#30](https://github.com/5app/dare/issues/30) [#30](https://github.com/5app/dare/issues/30)

## [0.31.4](https://github.com/5app/dare/compare/v0.31.3...v0.31.4) (2019-05-20)


### Bug Fixes

* properly escape *quotes* in JSON nested data constuct, fixes [#60](https://github.com/5app/dare/issues/60) ([e5162c7](https://github.com/5app/dare/commit/e5162c7))

## [0.31.3](https://github.com/5app/dare/compare/v0.31.2...v0.31.3) (2019-05-20)


### Bug Fixes

* Escape backslashes in concat fixes [#68](https://github.com/5app/dare/issues/68), again ([b48253f](https://github.com/5app/dare/commit/b48253f))

## [0.31.2](https://github.com/5app/dare/compare/v0.31.1...v0.31.2) (2019-05-20)


### Bug Fixes

* Escape backslashes in concat fixes [#68](https://github.com/5app/dare/issues/68) ([0e9cf8c](https://github.com/5app/dare/commit/0e9cf8c))

## [0.31.1](https://github.com/5app/dare/compare/v0.31.0...v0.31.1) (2019-05-09)


### Bug Fixes

* actually its a docs: but testing out semantic-releases ([e6861d2](https://github.com/5app/dare/commit/e6861d2))
