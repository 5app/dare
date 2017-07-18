'use strict';

describe('after Handler', () => {

	let dare;

	beforeEach(() => {
		// Create a new instance
		dare = new Dare();

		// Create an execution instance
		// Setup test schema
		dare = dare.use({
			schema: {
				'users': {

				},
				'emails': {
					user_id: 'users.id'
				}
			},
			meta: {
				domain_id: 10
			}
		});

	});

	it('after handler should be defined in instances of Dare', () => {
		expect(dare).to.have.property('after');
	});

	describe('should be called after success on api methods', () => {

		beforeEach(() => {
			dare.after = () => 'called';
			dare.execute = (sql, cb) => cb(null, [{}]);
		});

		const env = {
			get: () => dare.get('users', ['id']),
			post: () => dare.post('users', {name: 'Andrew'}),
			patch: () => dare.patch('users', {id: 1}, {name: 'Andrew'}),
			del: () => dare.del('users', {id: 1})
		};

		for (const method in env) {
			it(method, done => {
				env[method]().then(resp => {
					expect(resp).to.eql('called');
					done();
				})
					.catch(done);
			});
		}
	});


	describe('should modify response', () => {

		[
			{
				label: 'return a different value',
				handler() {
					return 'done';
				},
				expected(err, resp) {
					expect(resp).to.eql('done');
				}
			},
			{
				label: 'augment the existing value',
				handler(resp) {
					return resp.map(item => item.id);
				},
				expected(err, resp) {
					expect(resp).to.eql([1]);
				}
			},
			{
				label: 'support a Promise',
				handler() {
					return Promise.resolve(100);
				},
				expected(err, resp) {
					expect(resp).to.eql(100);
				}
			},
			{
				label: 'return the existing value if this returns an undefined',
				handler() {
					// do something but dont return...
				},
				expected(err, resp) {
					expect(resp).to.eql([{id: 1}]);
				}
			},
			{
				label: 'called with the this.options',
				handler() {
					expect(this.options).to.have.property('method', 'get');
					expect(this.options).to.have.property('table', 'users');
				},
				expected(err, resp) {
					expect(resp).to.eql([{id: 1}]);
				}
			},
			{
				label: 'trigger exception if error occurs',
				handler() {
					throw Error('whoops');
				},
				expected(err) {
					expect(err).to.have.property('message', 'whoops');
				}
			}

		].forEach(({label, handler: users, expected}) => {

			it(`and ${label}`, done => {

				const d = dare.use({
					afterGet: {
						users
					}
				});

				d.execute = (sql, callback) => {
					callback(null, [{id: 1}]);
				};

				d.get({
					table: 'users',
					fields: ['id'],
					limit: 1
				})
					.then(expected.bind(null, null), expected.bind(null))
					.then(() => done())
					.catch(done);

			});
		});

	});

	describe('should be overrideable by the pre-handler', () => {

		const new_after_handler = () => 'overriden';
		const preHandlers = {
			users() {
				// This will override it...
				this.after = new_after_handler;
			}
		};

		beforeEach(() => {
			dare.options.get = preHandlers;
			dare.options.post = preHandlers;
			dare.options.patch = preHandlers;
			dare.options.del = preHandlers;

			// Overwrite execute
			dare.execute = (sql, cb) => cb(null, [{}]);

			// This will be overriden
			dare.after_handler = () => {
				throw Error('this wasn\'t overridden');
			};
		});

		const env = {
			get: () => dare.get('users', ['id']),
			post: () => dare.post('users', {name: 'Andrew'}),
			patch: () => dare.patch('users', {id: 1}, {name: 'Andrew'}),
			del: () => dare.del('users', {id: 1})
		};

		for (const method in env) {
			it(method, done => {
				env[method]().then(resp => {
					expect(resp).to.eql('overriden');
					expect(dare.after).to.not.eql(new_after_handler);
					done();
				})
					.catch(done);
			});
		}
	});


});
