import assert from 'node:assert';
import {describe, it} from 'node:test';
import Dare from '../../src/index.ts';
import MySQL57Dare from '../../src/mysql57.ts';
import PostgresDare from '../../src/postgres16.ts';
import SQLiteDare from '../../src/sqlite.ts';

/*
 * ES class methods are non-enumerable by default
 * Dare restores the enumerable behaviour of the former prototype assignments
 * via makeMethodsEnumerable, so instance methods remain visible to `for...in`
 */
describe('enumerability', () => {
	const engines = {
		Dare,
		MySQL57Dare,
		PostgresDare,
		SQLiteDare,
	};

	for (const [name, Klass] of Object.entries(engines)) {
		describe(name, () => {
			it('should define enumerable prototype methods', () => {
				const methods = Object.getOwnPropertyNames(
					Klass.prototype
				).filter(prop => prop !== 'constructor');

				assert.ok(methods.length, 'has prototype methods');

				for (const method of methods) {
					const descriptor = Object.getOwnPropertyDescriptor(
						Klass.prototype,
						method
					);
					assert.strictEqual(
						descriptor?.enumerable,
						true,
						`${name}.prototype.${method} should be enumerable`
					);
				}
			});

			it('should expose methods on instances via for...in', () => {
				const instance = new Klass();

				const enumerated = [];
				for (const prop in instance) {
					if (typeof instance[prop] === 'function') {
						enumerated.push(prop);
					}
				}

				assert.ok(
					enumerated.includes('get'),
					'get is enumerable on the instance'
				);
				assert.ok(
					enumerated.includes('post'),
					'post is enumerable on the instance'
				);
			});

			it('should keep the constructor non-enumerable', () => {
				const descriptor = Object.getOwnPropertyDescriptor(
					Klass.prototype,
					'constructor'
				);
				assert.strictEqual(descriptor?.enumerable, false);
			});
		});
	}
});
