'use strict';

let SQLEXP = require('../lib/sql-match');

describe('join_handler', () => {

	let dare;

	beforeEach(() => {
		dare = new Dare();
	});

	it('join handler should be defined in instances of Dare', () => {
		expect(dare).to.have.property('join_handler');
	});

	it('should given a table-join map return an array of SQL LEFT JOINS', () => {

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

		expect(joins[0]).to.match(SQLEXP('LEFT JOIN child ON (parent.id = child.parent_id)'));

	});

	it('should create sql for each key=value in the join map', () => {

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

		expect(joins[0]).to.match(SQLEXP('LEFT JOIN child ON (parent.id = child.parent_id)'));
		expect(joins[1]).to.match(SQLEXP('LEFT JOIN parent ON (grandparent.id = parent.grand_id)'));

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

		expect(joins[0]).to.match(SQLEXP('LEFT JOIN parent ON (grandparent.id = parent.grand_id)'));
		expect(joins[1]).to.match(SQLEXP('LEFT JOIN child ON (parent.id = child.parent_id)'));

	});
});
