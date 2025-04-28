

export function arraySwap<T>(array: T[], fromIndex: number, toIndex: number): void {
	if (fromIndex < 0 || fromIndex === array.length) {
		return;
	}

	if (toIndex < 0 || toIndex === array.length) {
		return;
	}
	const temp = array[fromIndex];
	array[fromIndex] = array[toIndex];
	array[toIndex] = temp;
};