import { CrossValidate, NeuralNetwork } from "brain.js"
import fs from "fs"
import recognize from "./recognize.js"
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
            this.configurations[config] = { ...this.configurations[config], ...options }
            return
        }
		throw new Error("Invalid configuration type")
	}

	this.train = (OUTPUT_LABELS) => {
		const customPath = path(["configurations", "training", "path"], this)
		const DIR = customPath || `./AI/models/${this.name.toLowerCase()}`
		const trainingImagesDir = DIR + "/training_images"

		recognize(OUTPUT_LABELS, {
			classifier: this,
			DIR: { path: trainingImagesDir, isCustom: !!customPath },
		}).then((trainingData) => {
			//   Train the model on the training data
			console.log("Training with", trainingData.length, "images")
			const generatedPath = DIR + "/generated/"
			const saveModelPath = generatedPath + this.name.toLowerCase() + "/"

			const start = new Date()
			console.log(
				"Training started at " +
					start +
					"\nPlease wait, This may take a while!",
			)
			this.crossValidate.train(trainingData, this.configurations.training)

			console.log("Done training! Saving training data to " + saveModelPath)
			const json = this.crossValidate.toJSON() // all stats in json as well as neural networks
			const data = JSON.stringify(json)

			// Write Model to disk for later
			if (!fs.existsSync(generatedPath)) {
				fs.mkdirSync(saveModelPath, { recursive: true })
			}
			fs.writeFileSync(
				saveModelPath + `${this.name.toLowerCase()}-training-data.json`,
				data,
			)

			const end = new Date().getTime()
			console.log("end", (end - start) / 1000)
		})
	}
}

export default Classifier
