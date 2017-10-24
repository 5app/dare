'use strict';

describe('join_handler', () => {

	let dare;

	beforeEach(() => {
		// Create a new instance
		dare = new Dare();

		// Create an execution instance
		dare = dare.use();
	});

	it('join handler should be defined in instances of Dare', () => {
		expect(dare).to.have.property('join_handler');
	});

	it('should return an array of objects which describe the join between the two tables', () => {

		// Given a relationship between
		dare.options = {
			schema: {
				parent: {},
				child: {
					parent_id: 'parent.id'
				}
			}
		};

		const child_table = {
			table: 'child'
		};

		const join = dare.join_handler(child_table, 'parent');

		expect(child_table).to.eql(join);

		expect(child_table).to.deep.equal({
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
			schema: {
				parent: {},
				child: {
					parent_id: 'parent.id'
				}
			}
		};

		const parent_table = {
			table: 'parent'
		};

		const join = dare.join_handler(parent_table, 'child');

		expect(parent_table).to.eql(join);

		expect(parent_table).to.deep.equal({
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
			schema: {
				grandparent: {},
				parent: {
					grand_id: 'grandparent.gid'
				},
				child: {
					parent_id: 'parent.id'
				}
			}
		};

		const child_table = {
			table: 'child'
		};

		const join = dare.join_handler(child_table, 'grandparent');

		expect(join).to.deep.equal({
			table: 'parent',
			alias: 'a',
			join_conditions: {
				'grand_id': 'gid'
			},
			many: true,
			joins: [
				child_table
			]
		});

	});

	describe('using alternative schema', () => {

		beforeEach(() => {

			// One table can have multiple joins with another table
			// In this example below the message descibes to links
			// Table
			dare.options = {
				schema: {

					message: {
						from_id: 'author.id',
						to_id: 'recipient.id'
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


		it('should prefer an alternative schema definition if one exists for the alias used', () => {


			const recipient = {
				table: 'person',
				alias: 'recipient'
			};

			// Join the recipient table based upon the
			const recipient_join = dare.join_handler(recipient, 'message');

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
			const author_join = dare.join_handler(author, 'message');

			expect(author_join).to.deep.equal({
				table: 'person',
				alias: 'author$label',
				join_conditions: {
					'id': 'from_id'
				},
				many: false
			});
		});
	});
});
