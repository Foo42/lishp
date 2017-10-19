import chai = require('chai');
import {BindingTable, createBindingTable} from '../src/lib/bindings';
import {CAS} from '../src/lib/cas';
import * as memoryCAS from '../src/lib/cas/in-memory-cas';
import * as Evaluator from '../src/lib/eval';
import {withResolvedLabels} from '../src/lib/eval/decorators';
import { unlabel } from '../src/lib/eval/decorators/unlable';

const expect = chai.expect;
/*
*/
// eval a value, returns value
//eval a key, returns stored value (what about MDAGs)?
// This means


describe('evaluator', () => {
	let cas: CAS;
	let evaluator: Evaluator.Evaluator;
	beforeEach(() => {
		cas = memoryCAS.create();
		evaluator = Evaluator.create(cas);
	});

	it('evaluating an integer value should return itself as an integer', () => {
		return evaluator.evaluate('5').then(value => expect(value).to.equal(5));
	});

	it('evaluating a float value should return itself as a float', () => {
		return evaluator.evaluate('5.5').then(value => expect(value).to.equal(5.5));
	});

	it('evaluating a quoted string value should return itself as a string', () => {
		return evaluator.evaluate('"5.5"').then(value => expect(value).to.equal('5.5'));
	});

	describe('evaluating keys', () => {
		it('should evaluate a key to itself', () => {
			const storing = cas.store(5);

			return storing
			.then(key => evaluator.evaluate(`${key}`))
			.then(value => Promise.all([storing, value]))
			.then(([key, value]) => expect(value).to.equal(key));
		});

		it('should evaluate to stored value when prefixed with >', () => {
			return cas.store(5)
			.then(key => evaluator.evaluate(`>${key}`))
			.then(value => expect(value).to.equal(5));
		});
	});

	describe('labels', () => {
		it('unlable should replace symbols prefixed with $ with key label last bound to', () => {
			const original = '(f $somelabel)';
			const bindingTable = createBindingTable(cas);
			return cas.store(5)
				.tap(key => bindingTable.bind('somelabel', key))
				.then(key => {
					return unlabel(original, bindingTable).then(unlabelled => expect(unlabelled).to.deep.equal(['f', key]));
				});
		});

		it('unlable should replace symbols prefixed with >$ with key label last bound to prefixed with >', () => {
			const original = '(f >$somelabel)';
			const bindingTable = createBindingTable(cas);
			return cas.store(5)
				.tap(key => bindingTable.bind('somelabel', key))
				.then(key => {
					return unlabel(original, bindingTable).then(unlabelled => expect(unlabelled).to.deep.equal(['f', `>${key}`]));
				});
		});


		describe('Unlabelling evaluator decorator', () => {
			let bindingTable;

			beforeEach(() => {
					bindingTable = createBindingTable(cas);
					evaluator = withResolvedLabels(evaluator, bindingTable);
			});

			it('should substitue labels for their values', () => {
				let expectedKey;
				return cas.store(42)
				.tap(key => expectedKey = key)
				.then(key => bindingTable.bind('foo', key))
				.then(() => evaluator.evaluate('$foo'))
				.then(value => expect(value).to.equal(expectedKey));
			});
		});
	});

	describe('function evaluation', () => {
		it('should apply the first element of a list as a built in function to the following elements', () => {
			const expression = '(sum 1 3)';
			return evaluator.evaluate(expression).then(value => expect(value).to.equal(4));
		});

		it('should apply nested functions', () => {
			const expression = '(sum 1 (sum 3 2))';
			return evaluator.evaluate(expression).then(value => expect(value).to.equal(6));
		});
	});

	describe('unlabel', () => {
			});
});
