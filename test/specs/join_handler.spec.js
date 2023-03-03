import Dare from '../../src/index.js';
import joinHandler from '../../src/format/join_handler.js';

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
					schema: {parent_id: ['parent.id']},
				},
			},
		};

		const child_object = {
			table: 'child',
			alias: 'child',
		};

		const parent_object = {
			table: 'parent',
			alias: 'parent',
		};

		const join = joinHandler(child_object, parent_object, dare);

		expect(child_object).to.eql(join);

		expect(child_object).to.deep.equal({
			alias: 'child',
			table: 'child',
			join_conditions: {
				parent_id: 'id',
			},
			many: true,
		});
	});

	it('should return many=false when the table to be joined contains the key for the other', () => {
		// Given a relationship between
		dare.options = {
			models: {
				parent: {},
				child: {
					schema: {parent_id: ['parent.id']},
				},
			},
		};

		const parent_object = {
			table: 'parent',
			alias: 'parent',
		};

		const child_object = {
			table: 'child',
			alias: 'child',
		};

		const join = joinHandler(parent_object, child_object, dare);

		expect(parent_object).to.eql(join);

		expect(parent_object).to.deep.equal({
			alias: 'parent',
			table: 'parent',
			join_conditions: {
				id: 'parent_id',
			},
			many: false,
		});
	});

	it('should deduce any extra join to complete the relationship `infer_intermediate_models=true`', () => {
		// Given a relationship between
		dare.options = {
			models: {
				greatgrandparent: {},
				grandparent: {
					schema: {
						ggrand_id: 'greatgrandparent.id',
					},
				},
				parent: {
					schema: {grand_id: ['grandparent.gid']},
				},
				child: {
					schema: {parent_id: ['parent.id']},
				},
			},
		};

		const child_object = {
			alias: 'child',
			table: 'child',
		};

		const grandparent_object = {
			alias: 'grandparent',
			table: 'grandparent',
		};

		const join = joinHandler(child_object, grandparent_object, dare);

		expect(join).to.deep.equal({
			table: 'parent',
			join_conditions: {
				grand_id: 'gid',
			},
			many: true,
			joins: [child_object],
		});

		{
			// ... But not when infer_intermediate_models is explicitly false

			const dareInst = dare.use({
				infer_intermediate_models: false,
			});

			const null_join = joinHandler(
				child_object,
				grandparent_object,
				dareInst
			);

			expect(null_join).to.deep.equal(null);
		}

		// But this is limited to only one intermediary table, not two

		const greatgrandparent_object = {
			alias: 'greatgrandparent',
			table: 'greatgrandparent',
		};

		const no_join = joinHandler(
			child_object,
			greatgrandparent_object,
			dare
		);

		expect(no_join).to.deep.equal(null);
	});

	it('should not infer_intermediate_join using a common key (defined on named models)', () => {
		// Given a relationship between
		dare.options = {
			models: {
				person: {
					schema: {
						personcountry_id: ['country.id'],
					},
				},
				comment: {
					schema: {
						commentcountry_id: ['country.id'],
					},
				},
				country: {
					// Id
				},
			},
		};

		const person = {
			table: 'person',
			alias: 'person',
		};

		const comment = {
			table: 'comment',
			alias: 'comment',
		};

		const no_join = joinHandler(person, comment, dare);

		expect(no_join).to.deep.equal(null);
	});

	it('should not infer_intermediate_join using a common key (defined on link models)', () => {
		// Given a relationship between
		dare.options = {
			models: {
				person: {},
				comment: {},
				country: {
					schema: {
						bad_key_id: ['person.id', 'comment.id'],
					},
				},
			},
		};

		const person = {
			table: 'person',
			alias: 'person',
		};

		const comment = {
			table: 'comment',
			alias: 'comment',
		};

		const no_join = joinHandler(person, comment, dare);

		expect(no_join).to.deep.equal(null);
	});

	it('should use the shortcuts to infer the connecting model', () => {
		const dareInst = dare.use({
			infer_intermediate_models: false,
			models: {
				grandparent: {},
				parent: {
					schema: {grand_id: ['grandparent.gid']},
				},
				child: {
					shortcut_map: {
						grandparents: 'parent.grandparent',
					},
					schema: {
						parent_id: ['parent.id'],
					},
				},
			},
		});

		const child_object = {
			alias: 'child',
			table: 'child',
		};

		const grandparent_object = {
			alias: 'grandparents',
			table: 'grandparents',
		};

		const join = joinHandler(grandparent_object, child_object, dareInst);

		expect(join).to.deep.equal({
			table: 'parent',
			join_conditions: {
				id: 'parent_id',
			},
			many: false,
			joins: [grandparent_object],
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
							from_id: ['author.id'],
							to_id: ['recipient.id'],
						},
					},

					person: {},

					// Aliases of the person table...

					// An Author (person) is referenced via messages.from_id field
					author: {},

					// A Recipient (person) is referenced via messages.to_id field.
					recipient: {},
				},
			};
		});

		it('message.recipient, message.author: using referenced aliases', () => {
			const recipient = {
				table: 'recipient',
			};

			const message = {
				table: 'message',
			};

			// Join the recipient table based upon the
			const recipient_join = joinHandler(recipient, message, dare);

			expect(recipient_join).to.deep.equal({
				table: 'recipient',
				join_conditions: {
					id: 'to_id',
				},
				many: false,
			});

			const author = {
				table: 'author',
			};

			// Join the recipient table based upon the
			const author_join = joinHandler(author, message, dare);

			expect(author_join).to.deep.equal({
				table: 'author',
				join_conditions: {
					id: 'from_id',
				},
				many: false,
			});
		});

		it('author.message.recipient: using referenced aliases', () => {
			/*
			 * In this example we have a many to many relationship
			 * Where author and recipient are both aliases of person
			 */
			const message = {
				table: 'message',
			};

			const author = {
				table: 'author',
			};

			const recipient = {
				table: 'recipient',
			};

			// Join the recipient table based upon the
			const author_join = joinHandler(message, author, dare);

			expect(author_join).to.deep.equal({
				table: 'message',
				join_conditions: {
					from_id: 'id',
				},
				many: true,
			});

			// Join the recipient table based upon the
			const recipient_join = joinHandler(message, recipient, dare);

			expect(recipient_join).to.deep.equal({
				table: 'message',
				join_conditions: {
					to_id: 'id',
				},
				many: true,
			});
		});

		it('messageB.recipient: using unreferenced aliases', () => {
			dare.options.models.messageB = {
				schema: {
					to_id: ['recipient.id'],
					from_id: ['author.id'],
				},
			};

			const recipient = {
				table: 'recipient',
			};

			const messageB = {
				table: 'messageB',
			};

			// Join the recipient table based upon the
			const recipient_join = joinHandler(recipient, messageB, dare);

			expect(recipient_join).to.deep.equal({
				table: 'recipient',
				join_conditions: {
					id: 'to_id',
				},
				many: false,
			});
		});

		it('recipient.messageB: using unreferenced aliases', () => {
			dare.options.models.message = {
				schema: {
					from_id: ['author.id'],
					to_id: ['person.id'],
				},
			};

			const join_object = {
				table: 'message',
			};

			const root_object = {
				table: 'person',
			};

			// Join the recipient table based upon the
			const recipient_join = joinHandler(join_object, root_object, dare);

			expect(recipient_join).to.deep.equal({
				table: 'message',
				join_conditions: {
					to_id: 'id',
				},
				many: true,
			});
		});

		it('should return null if there is no way to join the models', () => {
			/*
			 * We already know from options.table_alias this is the same as a person
			 * Redefine
			 */
			delete dare.options.models.message;

			const recipient = {
				table: 'recipient',
			};

			const message = {
				table: 'message',
			};

			// Join the recipient table based upon the
			const recipient_join = joinHandler(recipient, message, dare);

			expect(recipient_join).to.equal(null);
		});
	});
});
