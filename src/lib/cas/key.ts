import * as crypto from 'crypto';

function hash(value){
	const hash = crypto.createHash('sha256');
	hash.update(value);
	return hash.digest('hex');
}

export type HashTypes = 'value' | 'MDAG';

export function generateKey(value: string, type: HashTypes){
	return `${prefix(value, type)}:${hash(value)}`;
}

function prefix(value, type): string{
	return typePrefix(type);
}

function typePrefix(type: HashTypes): string {
	switch (type) {
		case 'value':
			return 'v';
		case 'MDAG':
			return 'MDAG';
	}
}

export function parseKey(key: string): Key{
	const [prefix, hash] = key.split(':');
	return {type: parsePrefix(prefix), hash};
}

function parsePrefix(prefix: string): HashTypes{
	switch (prefix) {
		case 'v':
			return 'value';
		case 'MDAG':
			return prefix;
		default:
			throw new Error('bad key prefix');
	}
}

export interface Key {
	hash: string;
	type: HashTypes;
}
