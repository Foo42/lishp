import chai = require('chai');
import * as memoryCAS from '../src/lib/cas/in-memory-cas';

const expect = chai.expect;

describe('In Memory CAS', () => {
	it('Should return a key when storing an item', () => {
		const cas = memoryCAS.create();
		return cas.store({}).then(key => expect(typeof(key)).to.equal('string'));
	});

	it('should return different keys when storing different values', () => {
		const cas = memoryCAS.create();
		return Promise.all([cas.store(1), cas.store(2)])
			.then(([keyA, keyB]) => expect(keyA).to.not.equal(keyB));
	});

	it('should retrieve stored items using key', () => {
		const cas = memoryCAS.create();
		const original = {a: 5, b: 'hello', c: {d: 'deep'}};
		return cas.store(original).then(key => cas.retrieve(key)).then(value => expect(value).to.deep.equal(original));
	});

	describe('Merkle DAG Storage', () => {
		it('should store primitives directly', () => {
			const cas = memoryCAS.create();
			return Promise.all([cas.store(5), cas.storeAsMDAG(5)])
				.then(([primitiveKey, asDagKey]) => expect(asDagKey).to.equal(primitiveKey));
		});

		it('should store objects as maps of keys to values', () => {
			const cas = memoryCAS.create();
			const storingPrimitive = cas.store(5);
			const storingMDag = cas.storeAsMDAG({someNumber: 5});
			const retrievingRootNode = storingMDag.then(rootKey => cas.retrieve(rootKey));

			return Promise.all([storingPrimitive, retrievingRootNode])
				.then(([primitiveKey, rootNode]) => expect(rootNode.someNumber).to.equal(primitiveKey));
		});

		it('should allow retrieving of MDAGs as fully rehydrated values', () => {
			const cas = memoryCAS.create();
			const original = {a: 5, b: 'hello', c: {d: 'deep'}};
			const storing = cas.storeAsMDAG(original);
			return storing.then(key => cas.retrieveFromMDAG(key)).then(value => expect(value).to.deep.equal(original));

		});
	});
});
