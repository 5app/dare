// Import promise from 'eslint-plugin-promise';
import security from 'eslint-plugin-security';
import fiveapp from 'eslint-config-5app';
import prettier from 'eslint-config-prettier/flat';
import n from 'eslint-plugin-n';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
	{
		ignores: ['types/', 'coverage/', 'dist/'],
	},
	n.configs['flat/recommended'],
	...fiveapp,
	prettier,

	/*
	 * ...,
	 */
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.node,
			},
		},
		plugins: {
			security,
		},
		rules: {
			// "no-negated-condition": 2,
			'no-unused-expressions': 2,
			'prefer-named-capture-group': 2,
			// "prefer-destructuring": 2,
			'arrow-body-style': [2, 'as-needed'],
			'capitalized-comments': 2,
			'no-empty-function': 2,
			'no-param-reassign': 0,
			'max-params': [2, {max: 4}],
			'multiline-comment-style': [2, 'starred-block'],
			'prefer-promise-reject-errors': 2,
			// "promise/prefer-await-to-then": 2,
			'n/no-unsupported-features/node-builtins': 0,
			'security/detect-unsafe-regex': 2,
		},
	},

	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tseslint.parser,
		},
		plugins: {
			'@typescript-eslint': tseslint.plugin,
		},
		rules: {
			// Use the TypeScript-aware variant, which understands type declarations
			'no-unused-vars': 0,
			'@typescript-eslint/no-unused-vars': 2,

			// Import resolution is validated by tsc (NodeNext), the plugin resolver is not TS-aware
			'n/no-missing-import': 0,

			// Types are declared in TypeScript signatures, not JSDoc
			'jsdoc/require-param': 0,
			'jsdoc/require-param-type': 0,
			'jsdoc/require-returns': 0,
			'jsdoc/require-returns-type': 0,
			'jsdoc/require-returns-check': 0,
			'jsdoc/check-param-names': 0,
		},
	},

	{
		files: ['test/**/*.ts'],
		languageOptions: {
			globals: {
				...globals.mocha,
				Dare: 'readonly',
			},
		},
		rules: {
			'quote-props': 0,
		},
	},
];
