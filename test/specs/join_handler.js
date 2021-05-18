const Dare = require('../../src/');
const joinHandler = require('../../src/format/join_handler');

describe('join_handler', () => {

	let dare;

	beforeEach(() => {

		// Create a new instance
		dare = new Dare();

		// Create an execution instance
		dare = dare.use();

	});

	it('join handler should be defined in instances of Dare', () => {

		expect(joinHandler).to.be.a('function');

	});

	it('should return an array of objects which describe the join between the two tables', () => {

		// Given a relationship between
		dare.options = {
			models: {
				parent: {},
				child: {
					schema: {parent_id: 'parent.id'}
				}
			}
		};

		const child_object = {
			table: 'child',
			alias: 'child'
		};

		const parent_object = {
			table: 'parent',
			alias: 'parent'
		};

		const join = joinHandler(child_object, parent_object, dare);

		expect(child_object).to.eql(join);

		expect(child_object).to.deep.equal({
			alias: 'child',
			table: 'child',
			join_conditions: {
				'parent_id': 'id'
			},
			many: true
		});

	});

	it('should return many=false when the table to be joined contains the key for the other', () => {

		// Given a relationship between
		dare.options = {
			models: {
				parent: {},
				child: {
					schema: {parent_id: 'parent.id'}
				}
			}
		};

		const parent_object = {
			table: 'parent',
			alias: 'parent'
		};

		const child_object = {
			table: 'child',
			alias: 'child'
		};

		const join = joinHandler(parent_object, child_object, dare);

		expect(parent_object).to.eql(join);

		expect(parent_object).to.deep.equal({
			alias: 'parent',
			table: 'parent',
			join_conditions: {
				'id': 'parent_id'
			},
			many: false
		});

	});

	it('should deduce any extra join to complete the relationship', () => {

		// Given a relationship between
		dare.options = {
			models: {
				grandparent: {},
				parent: {
					schema: {grand_id: 'grandparent.gid'}
				},
				child: {
					schema: {parent_id: 'parent.id'}
				}
			}
		};

		const child_object = {
			alias: 'child',
			table: 'child'
		};

		const grandparent_object = {
			alias: 'grandparent',
			table: 'grandparent'
		};

		const join = joinHandler(child_object, grandparent_object, dare);

		expect(join).to.deep.equal({
			table: 'parent',
			alias: 'a',
			join_conditions: {
				'grand_id': 'gid'
			},
			many: true,
			joins: [
				child_object
			]
		});

	});

	describe('many to many table joins', () => {

		beforeEach(() => {

			/*
			 * One table can have multiple joins with another table
			 * In this example below the message descibes to links
			 * Table
			 */
			dare.options = {
				models: {

					message: {
						schema: {
							from_id: 'author.id',
							to_id: 'recipient.id'
						}
					},

					person: {},

					// Aliases of the person table...

					// An Author (person) is referenced via messages.from_id field
					author: {},

					// A Recipient (person) is referenced via messages.to_id field.
					recipient: {}
				},

				table_aliases: {
					author: 'person',
					recipient: 'person'
				}
			};

		});


		it('message.recipient, message.author: using referenced aliases', () => {

			const recipient = {
				table: 'person',
				alias: 'recipient'
			};

			const message = {
				table: 'message',
				alias: 'message'
			};

			// Join the recipient table based upon the
			const recipient_join = joinHandler(recipient, message, dare);

			expect(recipient_join).to.deep.equal({
				table: 'person',
				alias: 'recipient',
				join_conditions: {
					'id': 'to_id'
				},
				many: false
			});


			const author = {
				table: 'person',
				alias: 'author$label'
			};

			// Join the recipient table based upon the
			const author_join = joinHandler(author, message, dare);

			expect(author_join).to.deep.equal({
				table: 'person',
				alias: 'author$label',
				join_conditions: {
					'id': 'from_id'
				},
				many: false
			});

		});

		it('author.message.recipient: using referenced aliases', () => {

			/*
			 * In this example we have a many to many relationship
			 * Where author and recipient are both aliases of person
			 */
			const message = {
				table: 'message',
				alias: 'message'
			};

			const author = {
				table: 'person',
				alias: 'author'
			};

			const recipient = {
				table: 'person',
				alias: 'recipient'
			};

			// Join the recipient table based upon the
			const author_join = joinHandler(message, author, dare);

			expect(author_join).to.deep.equal({
				table: 'message',
				alias: 'message',
				join_conditions: {
					'from_id': 'id'
				},
				many: true
			});

			// Join the recipient table based upon the
			const recipient_join = joinHandler(message, recipient, dare);

			expect(recipient_join).to.deep.equal({
				table: 'message',
				alias: 'message',
				join_conditions: {
					'to_id': 'id'
				},
				many: true
			});

		});

		it('author.inbox.recipient: using all referenced aliases', () => {

			/*
			 * In this example we have a many to many relationship
			 * Where author and recipient are both aliases of person
			 */
			const message = {
				table: 'message',
				alias: 'inbox'
			};

			const author = {
				table: 'person',
				alias: 'author'
			};

			const recipient = {
				table: 'person',
				alias: 'recipient'
			};

			// Join the recipient table based upon the
			const author_join = joinHandler(message, author, dare);

			expect(author_join).to.deep.equal({
				table: 'message',
				alias: 'inbox',
				join_conditions: {
					'from_id': 'id'
				},
				many: true
			});

			// Join the recipient table based upon the
			const recipient_join = joinHandler(message, recipient, dare);

			expect(recipient_join).to.deep.equal({
				table: 'message',
				alias: 'inbox',
				join_conditions: {
					'to_id': 'id'
				},
				many: true
			});

		});


		it('messageB.recipient: using unreferenced aliases', () => {

			dare.options.models.messageB = {
				schema: {
					to_id: 'person.id',
					from_id: 'author.id'
				}
			};

			const recipient = {
				table: 'person',
				alias: 'recipient'
			};

			const messageB = {
				table: 'messageB',
				alias: 'messageB'
			};

			// Join the recipient table based upon the
			const recipient_join = joinHandler(recipient, messageB, dare);

			expect(recipient_join).to.deep.equal({
				table: 'person',
				alias: 'recipient',
				join_conditions: {
					'id': 'to_id'
				},
				many: false
			});

		});

		it('recipient.messageB: using unreferenced aliases', () => {

			dare.options.models.message = {
				schema: {
					from_id: 'author.id',
					to_id: 'person.id'
				}
			};

			const join_object = {
				table: 'message',
				alias: 'message'
			};

			const root_object = {
				table: 'person',
				alias: 'recipient'
			};

			// Join the recipient table based upon the
			const recipient_join = joinHandler(join_object, root_object, dare);

			expect(recipient_join).to.deep.equal({
				table: 'message',
				alias: 'message',
				join_conditions: {
					'to_id': 'id'
				},
				many: true
			});

		});

		it('should join based upon the alias which doesn\'t have a schema', () => {

			/*
			 * We already know from options.table_alias this is the same as a person
			 * Redefine
			 */
			delete dare.options.models.recipient;


			const recipient = {
				table: 'person',
				alias: 'recipient'
			};

			const message = {
				table: 'message',
				alias: 'message'
			};

			// Join the recipient table based upon the
			const recipient_join = joinHandler(recipient, message, dare);

			expect(recipient_join).to.deep.equal({
				table: 'person',
				alias: 'recipient',
				join_conditions: {
					'id': 'to_id'
				},
				many: false
			});

		});

	});

});
