import * as Promise from 'bluebird';
import {BindingTable} from '../bindings';
import {CAS} from '../cas';
import * as builtInFunctions from './builtInFunctions';
import parse = require('s-expression');
import * as _ from 'lodash';

export interface Evaluator {
	evaluate(expression: string | string[]): Promise<any>;
}

export function create(cas: CAS){
	function evaluate(expression: string | string[]): Promise<any> {
		const parsed = expression instanceof Array ? expression : parse(expression);
		if (parsed instanceof Array){
			const funcName = parsed[0];
			const rawArgs = parsed.slice(1);
			return Promise.map(rawArgs, evaluate)
				.then(argValues => findFunction(funcName).apply(null, argValues));
		}
		return applyOperators(parsed).then(coerce);
	}

	function applyOperators(value){
		if (value instanceof String){
		return Promise.resolve(value);
		}

		const operator = /^>/.exec(value);
		if (operator === null){
			return Promise.resolve(value);
		}
		if (operator[0] === '>'){
			const key = value.substr(1);
			return cas.retrieve(key);
		}
		return Promise.resolve(value);
	}

	function coerce(value){
		if (value instanceof String){
			return value.toString();
		}
		if (/^\d+$/.test(value)){
			return parseInt(value, 10);
		}
		if (/^\d+\.\d+$/.test(value)){
			return parseFloat(value);
		}
		return value;
	}

	return {
		evaluate
	};
}

function findFunction(name: string){
	return builtInFunctions[name];
}
