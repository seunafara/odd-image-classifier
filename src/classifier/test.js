import fs from "fs"
import { decodeString } from '../utils/index.js'

export default (net, testingData, { modelPath, options }) => {
	const start = new Date()
	console.log("start", start)
	const outputArr = []
	const jsonData = JSON.parse(fs.readFileSync(modelPath))
	net = net.fromJSON(jsonData)

	for (let data of testingData) {
		const { metadata } = data.output

		const guess = net.run(data.input)
		if (options.chopOutput) {
			let single = {
				key: null,
				value: 0,
			}
			for (const [key, value] of Object.entries(guess)) {
				if (value > single.value) {
					single = {
						key,
						value,
					}
				}
			}
			// console.log(
			// 	`Image: ${metadata.imageName} - Guess: ${decodeString(
			// 		single.key,
			// 	)} - Confidence ${(single.value * 100).toFixed(0)}% `,
			// )
			outputArr.push({
				image: metadata.imageName,
				guess: decodeString(single.key),
				['confidence-score']: (single.value * 100).toFixed(0) + '/100',
			})
		} else {
			// console.log(`Image: ${metadata.imageName}`)
			// console.log(guess)
			outputArr.push({
				image: metadata.imageName,
				guess,
			})
		}
	}

	const end = new Date().getTime()
	console.log("end", (end - start) / 1000)

	return outputArr
}
