import * as Promise from 'bluebird';
import {CAS} from '../cas';

interface BindingTable{
	bind(name: string, key: string): Promise<any>;
	currentBinding(name): Promise<string>;
	bindingHistory(name): Promise<string>;
}

export function createBindingTable(cas: CAS): BindingTable{
	const bindings = {};
	return {
		bind(name, key){
			const listStructure = {item: key, previous: bindings[name]};
			return cas.store(listStructure).tap(headKey => bindings[name] = headKey);
		},
		currentBinding(name){
			return this.bindingHistory(name)
			.then(headKey => headKey && cas.retrieve(headKey))
			.then(head => head && head.item);
		},
		bindingHistory(name){
			return Promise.resolve(bindings[name]);
		}
	};
}
