import * as _ from 'lodash';
import * as Promise from 'bluebird';
import parse = require('s-expression');
import { Evaluator } from '../';
import { BindingTable } from '../../bindings';

function identity(x){return x;}

function deepMapExpression(expression, expressionFunc = identity, valueFunc = identity){
	console.log('in deep map expression with ',expression);
	if (expression instanceof Array){
		return Promise.resolve(expressionFunc(Promise.map(expression, subExpression => deepMapExpression(subExpression, expressionFunc, valueFunc))));
	}
	return valueFunc(expression);
}

function isSymbol(value){
	if (value instanceof String){
		return false;
	}
	if (!_.isString(value)){
		return false;
	}
	return /\w.*/.test(value);
}

export function unlabel(expression: string | string[], bindingTable: BindingTable): Promise<any[]> {
	expression = expression instanceof Array ? expression : parse(expression);
	return deepMapExpression(expression, identity, value => {
		console.log(`${value} isSymbol = ${isSymbol(value)}`);
		if (isSymbol(value)) {
			if(value.startsWith('$')){
				return bindingTable.currentBinding(value.substring(1));
			} else if(value.startsWith('>$')){
				return bindingTable.currentBinding(value.substring(2)).then(key => `>${key}`);
			}
		}
		return value;
	});
}
