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
