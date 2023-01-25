export default (arr, min = 0, max = 255) => {
	let range = new Array(arr.length)
	// Loop through the input array and convert each value to a decimal between 0 and 1
	for (let i = 0; i < arr.length; i++) {
		range[i] = (arr[i] - min) / (max - min)
	}
	return range
}
