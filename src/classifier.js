import { CrossValidate, NeuralNetwork } from "brain.js"
import fs from "fs"
import transformer from "./transformer.js"
import { isEmpty, path } from "ramda"
import { defaults } from "./config/index.js"
import decodeString from "./utils/decodeString.js"

function Classifier(MODEL_NAME) {
	if (isEmpty(MODEL_NAME)) throw new Error("No model name specified")

	this.name = MODEL_NAME

	this.configurations = defaults.reduce(
		(acc, config) => ({
			...acc,
			[config.name]: config.default,
		}),
		{},
	)
	// Define the architecture of the neural network
	this.crossValidate = new CrossValidate(
		() => new NeuralNetwork(this.configurations.brain),
	)

	this.configure = (config, options) => {
		const prevConfig = defaults.find(({ name }) => config === name)
		if (prevConfig) {
			this.configurations[config] = {
				...this.configurations[config],
				...options,
			}
			return
		}
		throw new Error("Invalid configuration type")
	}

	this.train = (OUTPUT_LABELS) => {
		const customImgsPath = path(
			["configurations", "training", "imagesPath"],
			this,
		)
		const modelPath = `./AI/models/${this.name.toLowerCase()}`
		const DIR = customImgsPath || modelPath + "/training_images"
		transformer(OUTPUT_LABELS, {
			classifier: this,
			DIR: { path: DIR, isCustom: !!customImgsPath },
			modelPath,
		}).then((trainingData) => {
			if (trainingData.length) {
				//   Train the model on the training data
				console.log("Training with", trainingData.length, "images")
				const saveModelPath = modelPath + "/generated/"

				const start = new Date()
				console.log(
					"Training started at " +
						start +
						"\nPlease wait, This may take a while!",
				)
				this.crossValidate.train(trainingData, this.configurations.training)

				console.log(
					"TRAINING DONE 🎉! Saving training data to " + saveModelPath,
				)
				const json = this.crossValidate.toJSON() // all stats in json as well as neural networks
				const data = JSON.stringify(json)

				// Write Model to disk for later
				if (!fs.existsSync(saveModelPath)) {
					fs.mkdirSync(saveModelPath, { recursive: true })
				}
				fs.writeFileSync(
					saveModelPath + `${this.name.toLowerCase()}-training-data.json`,
					data,
				)

				const end = new Date().getTime()
				console.log("end", (end - start) / 1000)
			}
		})
	}

	this.test = {}

	this.test.batch = (imagesPath = null, options = { chopOutput: true }) => {
		const modelPath = `./AI/models/${this.name.toLowerCase()}`
		const DIR = imagesPath || modelPath + "/testing_images"
		const generatedPath = modelPath + "/generated/"
		const SAVED_MODEL_PATH =
			generatedPath + "/" + `${this.name.toLowerCase()}-training-data.json`

		transformer([], {
			classifier: this,
			DIR: { path: DIR, isCustom: !!imagesPath },
			includeMetaData: true,
            type: 'batch'
		}).then((testingData) => {
			const start = new Date()
			console.log("start", start)

			const jsonData = JSON.parse(fs.readFileSync(SAVED_MODEL_PATH))
			const net = this.crossValidate.fromJSON(jsonData)

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
					console.log(
						`Image: ${metadata.imageName} - Guess: ${decodeString(
							single.key,
						)} - Confidence ${(single.value * 100).toFixed(0)}% `,
					)
				} else {
					console.log(`Image: ${metadata.imageName}`)
					console.log(guess)
				}
			}

			const end = new Date().getTime()
			console.log("end", (end - start) / 1000)
		})
	}

	this.test.single = (imagePath = null, options = { chopOutput: true }) => {
		const modelPath = `./AI/models/${this.name.toLowerCase()}`
		// const DIR = imagesPath || modelPath + "/testing_images"
		const generatedPath = modelPath + "/generated/"
		const SAVED_MODEL_PATH =
			generatedPath + "/" + `${this.name.toLowerCase()}-training-data.json`

        transformer([], {
					classifier: this,
					DIR: { path: imagePath, isCustom: false },
					includeMetaData: true,
				}).then((testingData) => {
					const start = new Date()
					console.log("start", start)

					const jsonData = JSON.parse(fs.readFileSync(SAVED_MODEL_PATH))
					const net = this.crossValidate.fromJSON(jsonData)

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
							console.log(
								`Image: ${metadata.imageName} - Guess: ${decodeString(
									single.key,
								)} - Confidence ${(single.value * 100).toFixed(0)}% `,
							)
						} else {
							console.log(`Image: ${metadata.imageName}`)
							console.log(guess)
						}
					}

					const end = new Date().getTime()
					console.log("end", (end - start) / 1000)
				})
	}
}

export default Classifier
