# Introduction

The `odd-image-classifier` library is an image classifier built on top of brain.js. It allows you to train a neural network to recognize images based on a set of output labels.

# Installation
To use the odd-image-classifier library, you can install it using npm:

```javascript 
npm install odd-image-classifier 
```

# Usage
To use the `odd-image-classifier`, you can import the Classifier class and create a new instance of it. You can then configure the neural network using the configure method. The following example shows how to create a classifier for recognizing numbers:

```javascript
import { Classifier } from "odd-image-classifier";

const classifier = new Classifier("Numbers");

classifier.configure("brain", {
    hiddenLayers: [8, 16],
});
```

You can also configure the training options for the classifier by passing in an options object to the configure method.

```javascript
const OUTPUT_LABELS = [  ["1", ["7", "9"]],
  ["2", ["7", "3"]],
  ["3", ["2", "5"]],
  ["4", ["9", "7"]],
  ["5", ["6", "8"]],
  ["6", ["5", "8"]],
  ["7", ["1", "9"]],
  ["8", ["6", "5"]],
  ["9", ["7", "1"]],
]

classifier.configure("training", {
  iterations: 20000,
  output_labels: OUTPUT_LABELS,
  logPeriod: 100,
  layers: [12, 24],
  learningRate: 0.1,
  imageSize: {
    width: 32,
    height: 32,
  },
});

```

After configuring the classifier, you can start training it by calling the train method.

```javascript
classifier.train();
```

# API
The `odd-image-classifier` library exposes the following classes and methods:

 - Classifier: The main class for creating and configuring a new image classifier.
 - configure(type, options): Configure the classifier. The type parameter can be either "brain" or "training". The options parameter is an object with the options for the classifier.
 - train(): Start training the classifier.
 - 
