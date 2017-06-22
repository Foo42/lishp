import * as Promise from 'bluebird';
import {generateKey} from './key';

export function create(){
	const storage = {};
	return {
		store(value): Promise<string>{
			const serialised = JSON.stringify(value);
			const key = generateKey(serialised);
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
				return Promise.props(storingChildren).then(MDAG => this.store(MDAG));
			}
			return this.store(value);
		}
	};
}
