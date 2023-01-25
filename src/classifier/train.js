import fs from "fs"

export default (classifier, trainingData, { modelPath }) => {
	if (trainingData.length) {
		//   Train the model on the training data
		console.log("Training with", trainingData.length, "images")
		const saveModelPath = modelPath + "/generated/"

		const start = new Date()
		console.log(
			"Training started at " + start + "\nPlease wait, This may take a while!",
		)
		classifier.crossValidate.train(trainingData, classifier.configurations.training)

		console.log("TRAINING DONE 🎉! Saving training data to " + saveModelPath)
		const json = classifier.crossValidate.toJSON() // all stats in json as well as neural networks
		const data = JSON.stringify(json)

		// Write Model to disk for later
		if (!fs.existsSync(saveModelPath)) {
			fs.mkdirSync(saveModelPath, { recursive: true })
		}
		fs.writeFileSync(
			saveModelPath + `${classifier.name.toLowerCase()}-training-data.json`,
			data,
		)

		const end = new Date().getTime()
		console.log("end", (end - start) / 1000)
	}
}
