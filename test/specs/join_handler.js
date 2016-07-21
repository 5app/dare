'use strict';

describe('join_handler', () => {

	let dare;

	beforeEach(() => {
		dare = new Dare();
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

		let joins = dare.join_handler({
			'child': 'parent'
		});

		expect(joins).to.be.an('array');
		expect(joins.length).to.eql(1);

		expect(joins[0]).to.deep.equal({
			table: 'child',
			alias: 'child',
			conditions: {
				'parent.id': 'child.parent_id'
			},
			root: 'parent',
			many: true,
		});

	});

	it('should create multiple join objects as required', () => {

		// Given a relationship between
		dare.options = {
			schema: {
				grandparent: {},
				parent: {
					grand_id: 'grandparent.id'
				},
				child: {
					parent_id: 'parent.id'
				}
			}
		};

		let joins = dare.join_handler({
			'child': 'parent',
			'parent': 'grandparent',
		});

		expect(joins).to.be.an('array');
		expect(joins.length).to.eql(2);

		expect(joins[0]).to.deep.equal({
			table: 'child',
			alias: 'child',
			conditions: {
				'parent.id': 'child.parent_id'
			},
			root: 'parent',
			many: true,
		});

		expect(joins[1]).to.deep.equal({
			table: 'parent',
			alias: 'parent',
			conditions: {
				'grandparent.id': 'parent.grand_id'
			},
			root: 'grandparent',
			many: true,
		});

	});

	it('should deduce any extra join to complete the relationship', () => {

		// Given a relationship between
		dare.options = {
			schema: {
				grandparent: {},
				parent: {
					grand_id: 'grandparent.id'
				},
				child: {
					parent_id: 'parent.id'
				}
			}
		};

		let joins = dare.join_handler({
			'child': 'grandparent'
		});

		expect(joins).to.be.an('array');
		expect(joins.length).to.eql(2);

		expect(joins[0]).to.deep.equal({
			table: 'parent',
			alias: 'parent',
			conditions: {
				'grandparent.id': 'parent.grand_id'
			},
			root: 'grandparent',
			many: true,
		});

		expect(joins[1]).to.deep.equal({
			table: 'child',
			alias: 'child',
			conditions: {
				'parent.id': 'child.parent_id'
			},
			root: 'parent',
			many: true,
		});

	});

	it('should set many=false when the root table has the join reference key', () => {

		// Given a relationship between
		dare.options = {
			schema: {
				parent: {
					child_id: 'child.id'
				},
				child: {
				}
			}
		};

		let joins = dare.join_handler({
			'child': 'parent'
		});

		expect(joins).to.be.an('array');
		expect(joins.length).to.eql(1);

		expect(joins[0]).to.deep.equal({
			table: 'child',
			alias: 'child',
			conditions: {
				'child.id': 'parent.child_id'
			},
			root: 'parent',
			many: false,
		});

	});
});
