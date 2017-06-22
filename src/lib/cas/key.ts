import * as crypto from 'crypto';

function hash(value){
	const hash = crypto.createHash('sha256');
	hash.update(value);
	return hash.digest('hex');
}

export function generateKey(value){
	return hash(value);
}
