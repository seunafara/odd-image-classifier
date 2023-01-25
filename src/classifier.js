import { CrossValidate, NeuralNetwork } from "brain.js"
import recognize from './recognize.js'
import { isEmpty } from 'ramda'

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
			// iterations: 15000,
			// log: true,
			// logPeriod: 150,
			// layers: [32],
			// learningRate: 0.5,
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
    this.crossValidate = null

	this.configure = (config, options) => {
		const configExists = DEFAULT_CONFIGS.find(({ name }) => config === name)
		if (configExists) return (this.configurations[config] = options)
		throw new Error("Invalid configuration type")
	}

    this.train = (OUTPUT_LABELS) => {
        // Define the architecture of the neural network
        this.crossValidate = new CrossValidate(() => new NeuralNetwork(this.configurations.brain));

        recognize(this, OUTPUT_LABELS)


    }
}

export default Classifier
