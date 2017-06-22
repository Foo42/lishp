import chai = require('chai');
import {createBindingTable} from '../src/lib/bindings';
import * as memoryCas from '../src/lib/cas/in-memory-cas';

const expect = chai.expect;

describe('binding table', () => {
	it('should store and retrieve bindings', () => {
		const cas = memoryCas.create();
		const bindings = createBindingTable(cas);
		return bindings.bind('label', 'somekey')
		.then(() => bindings.currentBinding('label'))
		.then(bindingValue => expect(bindingValue).to.equal('somekey'));
	});
});
