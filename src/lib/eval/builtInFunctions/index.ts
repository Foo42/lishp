export function sum(){
	return [].reduce.call(arguments, (sum, current) => sum + current );
}

