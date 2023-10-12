import * as mysql from './mysql.js';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

// Extend Chai
chai.use(chaiAsPromised);

const mochaHooks = {
	beforeAll: [mysql.mochaHooks.beforeAll],
	beforeEach: [mysql.mochaHooks.beforeEach],
	afterAll: [mysql.mochaHooks.afterAll],
};

export {mochaHooks};
