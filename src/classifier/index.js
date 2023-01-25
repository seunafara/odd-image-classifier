import { CrossValidate, NeuralNetwork } from "brain.js"
import fs from "fs"
import transformer from "../transformer.js"
import { isEmpty, path } from "ramda"
import { defaults } from "../config/index.js"
import test from "./test.js"
import train from "./train.js"

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
		return transformer(OUTPUT_LABELS, {
			classifier: this,
			DIR: { path: DIR, isCustom: !!customImgsPath },
			modelPath,
			type: "batch",
		}).then((trainingData) =>
			train(this, trainingData, {
				modelPath,
			}),
		)
	}

	this.test = {}

	this.test.batch = (imagesPath = null, options = { chopOutput: true }) => {
		const modelPath = `./AI/models/${this.name.toLowerCase()}`
		const DIR = imagesPath || modelPath + "/testing_images"
		const generatedPath = modelPath + "/generated/"
		const SAVED_MODEL_PATH =
			generatedPath + "/" + `${this.name.toLowerCase()}-training-data.json`

		return transformer([], {
			classifier: this,
			DIR: { path: DIR, isCustom: !!imagesPath },
			includeMetaData: true,
			type: "batch",
		}).then((testingData) =>
			test(this.crossValidate, testingData, {
				modelPath: SAVED_MODEL_PATH,
				options,
			}),
		)
	}

	this.test.single = (imagePath = null, options = { chopOutput: true }) => {
		const modelPath = `./AI/models/${this.name.toLowerCase()}`
		const generatedPath = modelPath + "/generated/"
		const SAVED_MODEL_PATH =
			generatedPath + "/" + `${this.name.toLowerCase()}-training-data.json`

		return transformer([], {
			classifier: this,
			DIR: { path: imagePath, isCustom: false },
			includeMetaData: true,
		}).then((testingData) =>
			test(this.crossValidate, testingData, {
				modelPath: SAVED_MODEL_PATH,
				options,
			}),
		)
	}
}

export default Classifier
