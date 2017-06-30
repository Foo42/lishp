import * as Promise from 'bluebird';

export interface CAS {
	store(value: any): Promise<string>;
	storeAsMDAG(value: any): Promise<string>;
	retrieve(key: string): Promise<any>;
	retrieveFromMDAG(key: string): Promise<any>;
}
