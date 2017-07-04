import chai = require('chai');
import {CAS} from '../src/lib/cas';
import * as memoryCAS from '../src/lib/cas/in-memory-cas';
import * as Evaluator from '../src/lib/eval';

const expect = chai.expect;
/*
 Should we eval arguments before passing them into a func, or allow func to do that? Difference between a macro and a func?
 Don't want to inadvertantly pass more than required.

Could choose to eval arguments (ie trad function behaviour) but with variety of semantics for keys
 Options:
 	1. pass key in as it - leave it to the func body to retrieve values (using some passed in retrieve func or a global)
  2. retrieve simple value, ie would return first level of mdags
	3. retrieve as mdag with full depth (only advantage of this is reduced need to provide a retriever to func body)
	4. Syntax to support the above
		a) >somekey to retrieve key value, >>somekey to retrieve full depth, >3>somekey to retrieve a chosen depth

Labels:
We can denote labels in expressions using the '$' symbol, ie (equal abc123 $someObject)
We could combine this with the syntax for retrieving values from the cas ie (add >abc123 >$someLabel)

Binding Generators:
What is the relationship between evaluating expressions and binding generators?
The a binding generator is essentially a function (a macro?) which takes an expression and generates a new expression from it with labels dereferenced to the key they are bound to
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

	it('evaluating a string value should return itself as a string', () => {
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
});
