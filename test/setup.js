

const Dare = require('../src/');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Extend Chai
chai.use(chaiAsPromised);

// Set Globals
global.Dare = Dare;

global.expect = chai.expect;
