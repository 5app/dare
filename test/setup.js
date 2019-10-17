

const Dare = require('../src/');
const chai = require('chai');

// Set Globals
global.Dare = Dare;

global.expect = chai.expect;

// Global.sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);