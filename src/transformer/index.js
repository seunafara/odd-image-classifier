import fs from "fs"
import { Image } from "image-js"
import { basename, extname, join } from "path"
import { flatten, isEmpty, path } from "ramda"
import {
	arrayToRange,
	convolutions,
	encodeString,
	sleep,
} from "../utils/index.js"
import { IMAGE_EXTENSIONS } from "../config/index.js"

const processed = []
let CLASSIFIER
let INCLUDE_METADATA
let MODEL_PATH
let TYPE

const applyConvolutions = (image) => {
	const canClassify = path(
		["configurations", "training", "applyConvolutions"],
		CLASSIFIER,
	)
	if (canClassify) {
		for (const c of Object.values(convolutions)) {
			image = image.convolution(c)
		}
	}
	return image
}

function transform(imgDIR) {
	return new Promise((resolve) => {
		setTimeout(async () => {
			// Get a list of all files in the directory
			const files = TYPE === "batch" ? fs.readdirSync(imgDIR) : [imgDIR]
			let count = 1

			if (isEmpty(files)) return console.log("No images found in folder!")

			// Check files length
			const LARGE_FOLDER = files.length > 100
			if (LARGE_FOLDER) {
				console.log(
					`Image Transformation started! ${files.length} files were detected. This may take time to transform and train!`,
				)
				console.log(
					"\n\nTo stop your computer from SLEEPING during training \nMacbook (Run via Terminal): caffeinate -d\n",
				)
				await sleep(2000)
			}
			const imageSize = path(
				["configurations", "training", "imageSize"],
				CLASSIFIER,
			)

			for (let file of files) {
				if (file.match(IMAGE_EXTENSIONS)) {
					const img = TYPE === "batch" ? join(imgDIR, file) : imgDIR
					const imageName = basename(file, extname(file))
					const imageLabel = imageName.substring(0, imageName.indexOf("."))
					// We determine the label by picking the string before the first .
					// File name format - **label** + . + **unique_id** + . + {.jpg, .png, .jpeg}
					// e.g cat.001.png file label = cat
					// e.g dog.001.png file label = dog

					let image = await Image.load(img)
					let machineReadableImg = image
						.grey() // convert the image to greyscale.
						.resize({
							width: imageSize?.width || 144,
							height: imageSize?.height || 144,
						})

					const convoluted = applyConvolutions(machineReadableImg)

					// Apply convolutions
					machineReadableImg = convoluted.getPixelsArray()

					const output = {}
					const labels = path(
						["configurations", "training", "output_labels"],
						CLASSIFIER,
					)

					for (let label of labels) {
						const flat = flatten(label)
						const [m, f, s] = flat
						if (m === imageLabel) {
							output[encodeString(m)] = 0.999
							if (f) output[encodeString(f)] = 0
							if (s) output[encodeString(s)] = 0
							break
						}
					}

					if (INCLUDE_METADATA) {
						output.metadata = {
							imageName,
							imageLabel,
						}
					}
					if (LARGE_FOLDER) {
						console.log("Image number " + count + " has been processed")
						count += 1
					}
					if (flatten(labels).includes(imageLabel)) {
						processed.push({
							input: arrayToRange(machineReadableImg),
							output,
						})
					}
				}
			}
			resolve(processed)
		}, 10)
	})
}

async function start(DIR) {
	return await transform(DIR)
}

export default async (
	classifier,
	{ DIR, includeMetaData, modelPath, type },
) => {
	CLASSIFIER = classifier
	INCLUDE_METADATA = includeMetaData
	MODEL_PATH = modelPath
	TYPE = type

	if (!DIR.isCustom && !fs.existsSync(DIR.path)) {
		fs.mkdirSync(DIR.path, { recursive: true })
		console.log(DIR.path + " - folder created!")
		console.log("Add images to " + DIR.path)
		return []
	}

	return start(DIR.path)
}
