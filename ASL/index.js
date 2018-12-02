const HOSTED_URLS = {
    model: 'model_js/model.json',
    metadata: 'model_js/metadata.json'
};

const player = document.getElementById('player');
const snapshotCanvas = document.getElementById('snapshot');
const word = document.getElementById('word');


// Enable camera streaming
function handleSuccess(stream) {
    // Attach the video stream to the video element and autoplay.
    player.srcObject = stream;
};

navigator.mediaDevices.getUserMedia({video: true}).then(handleSuccess);


// Load the model and metadata
function status(statusText) {
    console.log(statusText);
    document.getElementById('status').textContent = statusText;
}

async function urlExists(url) {
    status('Testing url ' + url);
    try {
        const response = await fetch(url, {method: 'HEAD'});
        return response.ok;
    } catch (err) {
        return false;
    }
}

async function loadHostedPretrainedModel(url) {
    status('Loading pretrained model from ' + url);
    try {
        const model = await tf.loadModel(url);
        status('Done loading pretrained model.');
        document.getElementById('load-model').style.display = 'none';
        return model;
    } catch (err) {
        console.error(err);
        status('Loading pretrained model failed.');
    }
}

async function loadHostedMetadata(url) {
    status('Loading metadata from ' + url);
    try {
        const metadataJson = await fetch(url);
        const metadata = await metadataJson.json();
        status('Done loading metadata.');
        return metadata;
    } catch (err) {
        console.error(err);
        status('Loading metadata failed.');
    }
}


// ASL classifier
class Classifier {

    async init(urls) {
        this.urls = urls;
        this.model = await loadHostedPretrainedModel(urls.model);
        await this.loadMetadata();
        return this;
    }

    async loadMetadata() {
        const metadata = await loadHostedMetadata(this.urls.metadata);
        this.label2int = metadata['label2int'];
        this.int2label = metadata['int2label'];
        this.image_size = metadata['image_size'];
        this.RGB_mean = metadata['RGB_mean'];
        console.log('RGB_mean = ' + this.RGB_mean);
    }

    predict(img) {
        // Convert to image_size
        var inputImg = tf.image.resizeNearestNeighbor(img, [this.image_size, this.image_size]);
        // Preprocess the image
        inputImg = inputImg.sub(this.RGB_mean)
        inputImg = inputImg.div(127.5)
        inputImg = inputImg.expandDims(0)
        console.log(inputImg.shape)

        // Predict the label
        status('Running inference');
        const beginMs = performance.now();

        const predictOut = this.model.predict(inputImg);
        const argMaxPred = tf.argMax(predictionOut);
        const maxPred = tf.max(predictionOut);
        argMaxPred.print();
        maxPred.print();
        console.log('Here is the result!');
//         const probs = predictOut.dataSync();// return how many probabilities?
        const label = this.int2label[argMaxPred.dataSync()];
        const prob = maxPred.dataSync();
//         predictOut.dispose();
        argMaxPred.dispose();
        maxPred.dispose();
        
        const endMs = performance.now();
        return {label: label, prob: prob, elapsed: (endMs - beginMs)};
    }
};

function keepPredict(predictor) {
    snapshotCanvas.getContext('2d').drawImage(player, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
    const img = tf.fromPixels(snapshotCanvas);
    const result = predictor.predict(img.asType('float32'));
    status('Label: ' + result.label + ' ' + result.prob + '; elapsed: ' + result.elapsed.toFixed(3) + ' ms)');
    // word context
}

async function setup() {
    if (await urlExists(HOSTED_URLS.model)) {
        status('Model available: ' + HOSTED_URLS.model);
        const button = document.getElementById('load-model');
        button.addEventListener('click', async () => {
            const predictor = await new Classifier().init(HOSTED_URLS);
            console.log(predictor);
            window.int = self.setInterval(function () {
                keepPredict(predictor);
            }, 1000);
        });
        button.style.display = 'inline-block';
    };
    status('Standing by.');
}

setup();
