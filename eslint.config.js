import eslint from '@eslint/js';
import tsparser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
	eslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsparser,
			globals: {
				...globals.browser,
				...globals.node
			}
		},
		rules: {
			'no-unused-vars': 'off',
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			globals: {
				...globals.browser
			},
			parserOptions: {
				parser: tsparser
			}
		},
		rules: {
			'no-unused-vars': 'off',
			'no-undef': 'off',
			'svelte/require-each-key': 'off',
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		files: ['*.config.js'],
		languageOptions: {
			globals: {
				...globals.node
			}
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'node_modules/']
	}
];
