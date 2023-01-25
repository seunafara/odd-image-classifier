import { config as brainConfig } from "./brain.js"
import { config as trainingConfig } from "./training.js"

const IMAGE_EXTENSIONS = /\.jpg$|\.png$|\.jpeg$/
const defaults = [brainConfig, trainingConfig]
export { IMAGE_EXTENSIONS, defaults }
