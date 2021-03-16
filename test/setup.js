

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Extend Chai
chai.use(chaiAsPromised);

global.expect = chai.expect;
