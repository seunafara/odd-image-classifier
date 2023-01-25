import fs from "fs"
import { Image } from "image-js"
import { basename, extname, join } from "path"
import { isEmpty } from "ramda"
import { arrayToRange, convolutions } from "./utils/index.js"
import { IMAGE_EXTENSIONS } from './config/index.js'

const processed = []
let CLASSIFIER

const applyConvolutions = (image) => {
    for(const value of Object.values(convolutions)){
        image = image.convolution(value)
    }
    return image
}

function transform(imgDIR, labels = []) {
	return new Promise((resolve) => {
		setTimeout(async () => {
			// Get a list of all files in the directory
			const files = fs.readdirSync(imgDIR)

            if(isEmpty(files)) return console.log('No images found in folder!')

			for (let file of files) {
				if (file.match(IMAGE_EXTENSIONS)) {
					const img = join(imgDIR, file)
					const imageName = basename(file, extname(file))
					const imageLabel = imageName.substring(0, imageName.indexOf("."))
					// We determine the label by picking the string before the first .
					// File name format - **label** + . + **unique_id** + . + {.jpg, .png, .jpeg}
					// e.g cat.001.png file label = cat
					// e.g cat.002.png file label = cat
					// e.g dog.001.png file label = dog

					let image = await Image.load(img)
					let machineReadableImg = image
						.grey() // convert the image to greyscale.
						.resize({ width: 144, height: 144 }) // TODO: should be 144 || classifier.c.t.sizes = {w, h}
                    
                    machineReadableImg = applyConvolutions(machineReadableImg).getPixelsArray()

					const output = {}
					for (let label of labels) {
						const [m, [f, s]] = label
						if (imageLabel === m) {
							output[m] = 0.999
							if (f) output[f] = 0
							if (s) output[s] = 0
						}
					}
                    processed.push({
                        input: arrayToRange(machineReadableImg),
                        output,
                    })
				}
			}
			resolve(processed)
		}, 10)
	})
}

async function start(DIR, labels) {
	return await transform(DIR, labels)
}

export default async (OUTPUT_LABELS, { classifier, DIR }) => {
    CLASSIFIER = classifier
	if (!DIR.isCustom && !fs.existsSync(DIR.path)) {
		fs.mkdirSync(DIR.path, { recursive: true })
		console.log(DIR.path + " - folder created!")
		console.log("Add images to " + DIR.path)
		return []
	}

	return start(DIR.path, OUTPUT_LABELS)
}
