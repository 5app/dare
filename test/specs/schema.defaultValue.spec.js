import {expect} from 'chai';
import Dare from '../../src/index.js';

import getFieldAttributes from '../../src/utils/field_attributes.js';

function spy(obj, func, callback) {
	const history = [];
	obj[func] = (...params) => {
		history.push(params);
		return callback(...params);
	};
	return history;
}

describe('schema.defaultValue', () => {
	let dare;

	const dareInstance = {
		options: {
			method: 'get',
		},
	};

	beforeEach(() => {
		// Create a new instance
		const _dare = new Dare();

		dare = _dare.use({
			models: {
				mytable: {
					schema: {
						status: {
							defaultValue: 'active',
						},
					},
				},
			},
		});
	});

	describe('getFieldAttributes', () => {
		const field = 'field';

		it('defaultValue should not occur by default', () => {
			const attr = getFieldAttributes(field, {}, dareInstance);
			expect(attr).to.not.have.property('defaultValue');
		});

		[undefined, 1, null, 'string'].forEach(defaultValue => {
			it(`should expand defaultValue, ${defaultValue}`, () => {
				const attr = getFieldAttributes(
					field,
					{
						[field]: {
							post: {defaultValue},
							get: {defaultValue},
							patch: {defaultValue},
							del: {defaultValue},
						},
					},
					dareInstance
				);
				expect(attr).to.have.property('defaultValue', defaultValue);
			});
		});
	});

	describe('formatRequest', () => {
		['get', 'post', 'patch', 'del'].forEach(method => {
			it(`should add as a join filter in formatRequest for ${method}`, async () => {
				const defaultValue = method;

				// Update dare instance
				dare.options.method = method;

				// Set the default value for the method
				dare.options.models.mytable.schema.status = {
					[method]: {defaultValue},
				};

				const resp = await dare.format_request({
					table: 'mytable',
					fields: ['id', 'name'],
				});

				expect(resp.join).to.have.property('status', defaultValue);
			});
		});
	});

	describe('POST', () => {
		it('should insert default values into post operations', async () => {
			const history = spy(dare, 'execute', () => ({}));

			await dare.post('mytable', {
				title: 'hello',
			});

			const [{sql, values}] = history.at(0);
			expect(sql).to.include('`status`');
			expect(values).to.include('active');
		});

		it('should be overrideable', async () => {
			const history = spy(dare, 'execute', () => ({}));

			await dare.post('mytable', {
				title: 'hello',
				status: 'overridden',
			});

			const [{sql, values}] = history.at(0);
			expect(sql).to.include('`status`');
			expect(values).to.include('overridden');
		});

		it('should be overrideable, even with different formatting', async () => {
			const history = spy(dare, 'execute', () => ({}));

			// Lowercase field definitions
			dare = dare.use({
				getFieldKey: field => field.toLowerCase(),
			});

			await dare.post('mytable', {
				title: 'hello',
				Status: 'overridden',
			});

			const [{sql, values}] = history.at(0);
			expect(sql).to.include('`status`');
			expect(sql).to.not.include('Status');
			expect(values).to.include('overridden');
			expect(values).to.not.include('active');
		});

		it('should be removed', async () => {
			const history = spy(dare, 'execute', () => ({}));

			await dare.post('mytable', {
				title: 'hello',
				status: undefined,
			});

			/*
			 * TODO: Should not include filters where the values are undefined
			 * This should be akin to removing the defaultValue too
			 */
			const [{sql, values}] = history.at(0);
			expect(sql).to.include('`status`');
			expect(sql).to.include('DEFAULT');
			expect(values).to.not.include(undefined);
		});

		it('should pass through just the defaultValue.post to validateInput handler', async () => {
			spy(dare, 'execute', () => ({}));

			const history = [];
			const _dare = dare.use({
				validateInput(...params) {
					history.push(params);
				},
			});

			await _dare.post('mytable', {
				title: 'hello',
			});

			// Find in history the check for status
			const [attr] = history.find(
				([, propName]) => propName === 'status'
			);

			expect(attr).to.have.property('defaultValue', 'active');
		});
	});

	describe('DEL/GET/PATCH', () => {
		['get', 'patch', 'del'].forEach(method => {
			it(`should add WHERE condition for the dare.${method}() call`, async () => {
				const defaultValue = method;

				// Set the default value for the method
				dare.options.models.mytable.schema.status = {
					[method]: {defaultValue},
				};

				const history = spy(dare, 'execute', () => []);

				await dare[method]({
					table: 'mytable',
					fields: ['id', 'name'],
					body: {name: 'newvalue'},
					notfound: null,
				});

				const [{sql, values}] = history.at(0);

				expect(sql).to.include('status = ');
				expect(values).to.include(defaultValue);
			});

			['filter', 'join'].forEach(condition => {
				it(`should be overideable within a dare.${method}() call '${condition}'`, async () => {
					const defaultValue = method;

					// Set the default value for the method
					dare.options.models.mytable.schema.status = {
						[method]: {defaultValue},
					};

					const history = spy(dare, 'execute', () => []);

					await dare[method]({
						table: 'mytable',
						fields: ['id', 'name'],
						body: {name: 'newvalue'},
						[condition]: {status: 'boom'},
						notfound: null,
					});

					const [{sql, values}] = history.at(0);

					expect(sql).to.include('status = ');
					expect(values).to.not.include(defaultValue);
					expect(values).to.include('boom');
				});

				it(`should be overideable within a dare.${method}() call '${condition}' using an alias`, async () => {
					const defaultValue = method;

					// Set the default value for the method
					dare.options.models.mytable.schema.status = {
						[method]: {defaultValue},
					};

					// Lowercase field definitions
					dare = dare.use({
						getFieldKey: field => field.toLowerCase(),
					});

					const history = spy(dare, 'execute', () => []);

					await dare[method]({
						table: 'mytable',
						fields: ['id', 'name'],
						body: {name: 'newvalue'},
						[condition]: {Status: 'boom'},
						notfound: null,
					});

					const [{sql, values}] = history.at(0);

					expect(sql).to.include('status = ');
					expect(values).to.not.include(defaultValue);
					expect(values).to.include('boom');
				});

				it(`should be undefinedable within a dare.${method}() call '${condition}'`, async () => {
					const defaultValue = method;

					// Set the default value for the method
					dare.options.models.mytable.schema.status = {
						[method]: {defaultValue},
					};

					const history = spy(dare, 'execute', () => []);

					await dare[method]({
						table: 'mytable',
						fields: ['id', 'name'],
						body: {name: 'newvalue'},
						[condition]: {status: undefined},
						notfound: null,
					});

					const [{sql, values}] = history.at(0);

					/*
					 * TODO: Should not include filters where the values are undefined
					 * This should be akin to removing the defaultValue too
					 */
					expect(sql).to.include('status = ');
					expect(values).to.not.include(defaultValue);
					expect(values).to.include(undefined);
				});
			});
		});
	});
});
