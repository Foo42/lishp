import { Evaluator } from '../';
import { BindingTable } from '../../bindings';
import { unlabel } from './unlable';

export function withResolvedLabels( inner: Evaluator, bindingTable: BindingTable ) : Evaluator {
	return {
		evaluate(expression: string | string[]): Promise<any> {
			return unlabel(expression, bindingTable).then(inner.evaluate);
		}
	}
}
