const mysql = require('./mysql');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Extend Chai
chai.use(chaiAsPromised);

// Export Chai Expect
global.expect = chai.expect;

exports.mochaHooks = {
	beforeAll: [
		mysql.mochaHooks.beforeAll
	],
	beforeEach: [
		mysql.mochaHooks.beforeEach
	]
};
