# [0.62.0](https://github.com/5app/dare/compare/v0.61.2...v0.62.0) (2022-03-09)


### Features

* **option:** infer_intermediate_models ([5addd30](https://github.com/5app/dare/commit/5addd30cf09aa6a1c652ad15cdcfc573fb0a499d))

## [0.61.2](https://github.com/5app/dare/compare/v0.61.1...v0.61.2) (2022-02-07)


### Bug Fixes

* **ci:** semantic-release shareable config test ([53dbaad](https://github.com/5app/dare/commit/53dbaade25b0fd47fa85cceeca448a7053dd7723))

## [0.61.1](https://github.com/5app/dare/compare/v0.61.0...v0.61.1) (2022-01-13)


### Bug Fixes

* **onDuplicateKeyUpdate:** put backticks around UPDATE fields ([aeabcd8](https://github.com/5app/dare/commit/aeabcd868ea5f929f8a920d657dc0f8e67636878))

# [0.61.0](https://github.com/5app/dare/compare/v0.60.1...v0.61.0) (2021-12-01)


### Features

* refactor internal SQL function arguments ([280cb31](https://github.com/5app/dare/commit/280cb317bdcf30838bb6f330bbfa2df9b2226282))

## [0.60.1](https://github.com/5app/dare/compare/v0.60.0...v0.60.1) (2021-10-20)


### Bug Fixes

* **validateInput:** fix missing validateInput error ([bf5801f](https://github.com/5app/dare/commit/bf5801f463f59cd4a39422b0b6395a13fcc94806))

# [0.60.0](https://github.com/5app/dare/compare/v0.59.0...v0.60.0) (2021-10-18)


### Features

* **validation:** allow model's to define a default field definition ([16e25a5](https://github.com/5app/dare/commit/16e25a5bbbaaf5a9d1de3d3889ce1ce245fa9053))
* **validation:** input validation ([eb0a2fc](https://github.com/5app/dare/commit/eb0a2fc8446bac13926bf015f704adf8bc439c32))

# [0.59.0](https://github.com/5app/dare/compare/v0.58.0...v0.59.0) (2021-08-04)


### Features

* **fields:** fields prefixable with the negation operator ([e379612](https://github.com/5app/dare/commit/e3796120d718c72c021ed3ca3f393c964a8b3453))

# [0.58.0](https://github.com/5app/dare/compare/v0.57.2...v0.58.0) (2021-07-08)


### Features

* **deprecate:** remove table_alias object handling ([#189](https://github.com/5app/dare/issues/189)) ([f649ac6](https://github.com/5app/dare/commit/f649ac6104736e8d92e809d9ee5ada9e09de5edd))

## [0.57.2](https://github.com/5app/dare/compare/v0.57.1...v0.57.2) (2021-06-18)


### Bug Fixes

* **del, patch:** throws an error is nested filter given, [#187](https://github.com/5app/dare/issues/187) ([9f5a5d3](https://github.com/5app/dare/commit/9f5a5d3477fb54988d7fec41725e3ab28635c8f1))

## [0.57.1](https://github.com/5app/dare/compare/v0.57.0...v0.57.1) (2021-05-28)


### Reverts

* Revert "feat(esm): convert to esm modules (#184)" ([d881022](https://github.com/5app/dare/commit/d88102227fa607bcfad017e083422947dbd1aacf)), closes [#184](https://github.com/5app/dare/issues/184)

# [0.57.0](https://github.com/5app/dare/compare/v0.56.0...v0.57.0) (2021-05-28)


### Features

* **esm:** convert to esm modules ([#184](https://github.com/5app/dare/issues/184)) ([a219207](https://github.com/5app/dare/commit/a219207c46de4a5d9e0d1e26cde2cd5e0417f185))

# [0.56.0](https://github.com/5app/dare/compare/v0.55.4...v0.56.0) (2021-05-20)


### Features

* **models:** support for new options.models structure ([#181](https://github.com/5app/dare/issues/181)) ([a1d76e4](https://github.com/5app/dare/commit/a1d76e4bfdc083687b335b0a168674c8399a37b6))

## [0.55.4](https://github.com/5app/dare/compare/v0.55.3...v0.55.4) (2021-05-17)


### Bug Fixes

* **generated:** fix referencing a nested generated field ([10fcec9](https://github.com/5app/dare/commit/10fcec904e4fb035de6effeceed1e1030d1575a7))

## [0.55.3](https://github.com/5app/dare/compare/v0.55.2...v0.55.3) (2021-04-30)


### Bug Fixes

* **suffixing:** model names with $ in nested fields handling ([fdaffd7](https://github.com/5app/dare/commit/fdaffd796ca1cc38479ff90ee8f084d023f9cc95))

## [0.55.2](https://github.com/5app/dare/compare/v0.55.1...v0.55.2) (2021-04-29)


### Bug Fixes

* **subquery:** fix null subquery response ([b20fe7b](https://github.com/5app/dare/commit/b20fe7b8829c20fc468e868ce056dea0f4dcb46a))

## [0.55.1](https://github.com/5app/dare/compare/v0.55.0...v0.55.1) (2021-04-28)


### Bug Fixes

* throw error when calling format_request with falsy value ([7e34410](https://github.com/5app/dare/commit/7e344101473b310f479787c2cd2c5a2437e1795c))

# [0.55.0](https://github.com/5app/dare/compare/v0.54.0...v0.55.0) (2021-04-08)


### Features

* **handlers:** pass dare instance in second parameters ([ba0ef40](https://github.com/5app/dare/commit/ba0ef40f1c297ceadc7da416a63d14be8cde6809))

# [0.54.0](https://github.com/5app/dare/compare/v0.53.0...v0.54.0) (2021-03-09)


### Features

* **fields:** support SQL IF(field = 'string', ...) field definition ([912dd79](https://github.com/5app/dare/commit/912dd795988bbe7a6164225a079c6883d88d9150))

# [0.53.0](https://github.com/5app/dare/compare/v0.52.1...v0.53.0) (2021-02-19)


### Features

* show more errors when duplicate_key='ignore' is set ([#170](https://github.com/5app/dare/issues/170)) ([d523bc8](https://github.com/5app/dare/commit/d523bc8a3abf7514a857ef7302589744cc56e0d6))

## [0.52.1](https://github.com/5app/dare/compare/v0.52.0...v0.52.1) (2021-02-17)


### Bug Fixes

* **filter:** not exists assign to implicit join ([4bcce14](https://github.com/5app/dare/commit/4bcce148d2fffec97f15eb21c4a47fb01fce939e))

# [0.52.0](https://github.com/5app/dare/compare/v0.51.0...v0.52.0) (2021-02-17)


### Features

* **filter:** sql not exists ([#168](https://github.com/5app/dare/issues/168)) ([047fafa](https://github.com/5app/dare/commit/047fafa9e04c8ae0d00978f1586d335a15f8c207)), closes [#167](https://github.com/5app/dare/issues/167)

# [0.51.0](https://github.com/5app/dare/compare/v0.50.0...v0.51.0) (2021-02-10)


### Features

* ignore suffix on field property ([b7f9d19](https://github.com/5app/dare/commit/b7f9d190cda8a34643d9f7b68cea7eb809f3bd41))

# [0.50.0](https://github.com/5app/dare/compare/v0.49.0...v0.50.0) (2021-01-25)


### Features

* allow overriding the schema per operation ([472cedd](https://github.com/5app/dare/commit/472cedd4acb4847f00bc61b65a9445c19aa481bc))

# [0.49.0](https://github.com/5app/dare/compare/v0.48.0...v0.49.0) (2021-01-19)


### Features

* expose DareError object ([89e85e4](https://github.com/5app/dare/commit/89e85e478fb35707f7a4ad506077d6982b9961ae))

# [0.48.0](https://github.com/5app/dare/compare/v0.47.0...v0.48.0) (2020-11-18)


### Features

* **alias:** provide cross table field aliasing ([607c83f](https://github.com/5app/dare/commit/607c83f72c1b25bf1281bef96c5074d4a66207e5))

# [0.47.0](https://github.com/5app/dare/compare/v0.46.7...v0.47.0) (2020-10-28)


### Features

* shorthand nested filter keys ([86c90f8](https://github.com/5app/dare/commit/86c90f8dba7233a071ff8aec283336a6415649e6))

## [0.46.7](https://github.com/5app/dare/compare/v0.46.6...v0.46.7) (2020-08-19)


### Bug Fixes

* **orderby/groupby:** Ensures these joins are not cropped from the query [#152](https://github.com/5app/dare/issues/152) ([#153](https://github.com/5app/dare/issues/153)) ([2174dcc](https://github.com/5app/dare/commit/2174dcc3a45c5a2a4f3ebc811d6c8571193476ea))

## [0.46.6](https://github.com/5app/dare/compare/v0.46.5...v0.46.6) (2020-07-14)


### Bug Fixes

* **fields:** support GROUP_CONCAT(... ORDER BY 1) ([5a27157](https://github.com/5app/dare/commit/5a27157f96133344af0276689003ccecc54051f1))

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
