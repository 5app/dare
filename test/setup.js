import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

// Extend Chai
chai.use(chaiAsPromised);

global.expect = chai.expect;
