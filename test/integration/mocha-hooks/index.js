const mysql = require('./mysql');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Extend Chai
chai.use(chaiAsPromised);

global.expect = chai.expect;

function buildTestId(testTitle) {

	const friendlyTestName = testTitle
		.toLowerCase()
		.replace(/([^a-z])/g, '_')
		.slice(0, 20);
	/*
	 * Because we only use test title (and titles can be duplicated across different describe blocks), we need
	 * something more unique.
	 * We use timestamp rather than random because it means our ids are ordered by time (possibility of a clash, but unlikely):
	 */
	return `${Date.now()}_${friendlyTestName}`;

}

function setTestId() {

	const testTitle = this.currentTest.title;
	this.testId = this.currentTest.testId = buildTestId(testTitle);

}

exports.mochaHooks = {
	beforeAll: [
		mysql.mochaHooks.beforeAll
	],
	beforeEach: [
		setTestId,
		mysql.mochaHooks.beforeEach
	],
	afterAll: [mysql.mochaHooks.afterAll]
};
