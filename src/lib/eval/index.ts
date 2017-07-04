import * as Promise from 'bluebird';
import * as builtInFunctions from './builtInFunctions';
import parse = require('s-expression');

export interface Evaluator {
	evaluate(expression: string | string[]): Promise<any>;
}
function evaluate(expression: string | string[]): Promise<any> {
	console.log(`evaluating ${expression}`)
	const parsed = expression instanceof Array ? expression : parse(expression);
	if (parsed instanceof Array){
		const funcName = parsed[0];
		const rawArgs = parsed.slice(1);
		return Promise.map(rawArgs, evaluate)
			.then(argValues => findFunction(funcName).apply(null, argValues));
	}
	return Promise.resolve(coerce(parsed));
}

export function create(cas){
	return {
		evaluate
	};
}

function findFunction(name: string){
	return builtInFunctions[name];
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
