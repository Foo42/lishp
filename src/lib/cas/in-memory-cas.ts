import * as Promise from 'bluebird';
import {mapValues} from 'lodash';
import {generateKey, HashTypes, parseKey} from './key';

interface KeyValueStore {
	set(key: string, value: string): Promise<any>;
	get(key: string): Promise<string | undefined>;
}

function createInMemoryKeyValueStore(): Promise<KeyValueStore> {
	const storage = {};
	return {
		set(key:string, value: string): Promise<any> {
			storage[key] = value;
			return Promise.resolve();
		},
		get(key: string): Promise<string | undefined> {
			return Promise.resolve(storage[key]);
		}
	}
}

export function create(){
	const storage = createInMemoryKeyValueStore();
	return {
		store(value, type: HashTypes = 'value'): Promise<string>{
			const serialised = JSON.stringify(value);
			const key = generateKey(serialised, type);
			return storage.set(key, serialised).then(() => key);
		},
		retrieve(key: string): Promise<any> {
			return storage.get(key).then(JSON.parse);
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
