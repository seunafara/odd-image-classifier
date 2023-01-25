import { CrossValidate, NeuralNetwork } from "brain.js"
import fs from "fs"
import transform from "./transform.js"
import { isEmpty, path } from "ramda"

const DEFAULT_CONFIGS = [
	{
		name: "brain",
		default: {
			activation: "sigmoid",
			hiddenLayers: [9],
		},
	},
	{
		name: "training",
		default: {
			iterations: 15000,
			log: true,
			logPeriod: 150,
			layers: [32],
			learningRate: 0.5,
			applyConvolutions: true,
		},
	},
]

function Classifier(MODEL_NAME) {
	if (isEmpty(MODEL_NAME)) throw new Error("No model name specified")

	this.name = MODEL_NAME

	this.configurations = DEFAULT_CONFIGS.reduce(
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
		const prevConfig = DEFAULT_CONFIGS.find(({ name }) => config === name)
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
		const customPath = path(["configurations", "training", "customPath"], this)
        const modelPath = `./AI/models/${this.name.toLowerCase()}`
		const DIR = customPath || modelPath + "/training_images"
		transform(OUTPUT_LABELS, {
			classifier: this,
			DIR: { path: DIR, isCustom: !!customPath },
		}).then((trainingData) => {
			if (trainingData.length) {
				//   Train the model on the training data
				console.log("Training with", trainingData.length, "images")
				const saveModelPath = DIR + "/generated/"

				const start = new Date()
				console.log(
					"Training started at " +
						start +
						"\nPlease wait, This may take a while!",
				)
				this.crossValidate.train(trainingData, this.configurations.training)

				console.log("TRAINING DONE 🎉! Saving training data to " + saveModelPath)
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

	this.test = (options = { customPath: null, chopOutput: true }) => {
        const modelPath = `./AI/models/${this.name.toLowerCase()}`
		const DIR = options.customPath || modelPath + "/testing_images"
		const generatedPath = modelPath + "/generated/"
		const SAVED_MODEL_PATH =
			generatedPath + "/" + `${this.name.toLowerCase()}-training-data.json`

		transform([], {
			classifier: this,
			DIR: { path: DIR, isCustom: !!options.customPath },
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
						`Image: ${metadata.imageName} - Guess: ${
							single.key
						} - Confidence ${(single.value * 100).toFixed(0)}% `,
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
