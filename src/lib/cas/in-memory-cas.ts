import * as Promise from 'bluebird';
import {mapValues} from 'lodash';
import {generateKey, HashTypes, parseKey} from './key';

export function create(){
	const storage = {};
	return {
		store(value, type: HashTypes = 'value'): Promise<string>{
			const serialised = JSON.stringify(value);
			const key = generateKey(serialised, type);
			storage[key] = serialised;
			return Promise.resolve(key);
		},
		retrieve(key: string): Promise<any> {
			return Promise.resolve(JSON.parse(storage[key]));
		},
		storeAsMDAG(value: any): Promise<string>{
			if (value instanceof Object){
				const keys = Object.keys(value).filter(key => !(value[key] instanceof Function));
				const storingChildren = keys.reduce((acc, key) => {
					acc[key] = this.storeAsMDAG(value[key]);
					return acc;
				}, {});
				return Promise.props(storingChildren).then(MDAG => this.store(MDAG, 'MDAG'));
			}
			return this.store(value, 'value');
		},
		retrieveFromMDAG(key: string): Promise<any>{
			const rootKey = parseKey(key);
			if (rootKey.type === 'value'){
				return this.retrieve(key);
			}
			return this.retrieve(key)
				.then(rootNode => Promise.props(mapValues(rootNode, this.retrieveFromMDAG.bind(this))));
		}
	};
}
