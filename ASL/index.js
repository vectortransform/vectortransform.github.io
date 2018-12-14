const HOSTED_URLS = {
    model: 'model_js/model.json',
    metadata: 'model_js/metadata.json'
};

const player = document.getElementById('player');
const snapshotCanvas = document.getElementById('snapshot');
const pred_region = document.getElementById('pred-region');
const stop_sign = document.getElementById('stop-sign');
const chars = document.getElementById('chars');
const lastchar = document.getElementById('lastchar');

var x_slider = new Slider("#x-slider");
var y_slider = new Slider("#y-slider");

var xSliderRegion = document.getElementById('xSlider');
var ySliderRegion = document.getElementById('ySlider');

// Enable camera streaming
function handleSuccess(stream) {
    // Attach the video stream to the video element and autoplay.
    player.srcObject = stream;
    setTimeout(function (){
        const w = player.videoWidth;
        const h = player.videoHeight;
        const space = 10;

        snapshotCanvas.width = w;
        snapshotCanvas.height = h;

        xSliderRegion.style.left = (w - xSliderRegion.offsetWidth)/2 + 'px';
        xSliderRegion.style.top = h + space + 'px';
        ySliderRegion.style.left = w + space + 'px';
        ySliderRegion.style.top = (h - ySliderRegion.offsetHeight)/2 + 'px';

        stop_sign.style.left = (w - stop_sign.offsetWidth)/2 + 'px';
        stop_sign.style.top = h + xSliderRegion.offsetHeight + 2*space + 'px';

        pred_region.style.display = 'inline';
        pred_region.style.left = (w - pred_region.offsetWidth)/2 + 'px';
        pred_region.style.top = (h - pred_region.offsetHeight)/2 + 'px';

        // notice lower bound and upper bound
        x_slider.on("slide", function(sliderValue) {
        	pred_region.style.left = (w - pred_region.offsetWidth)/2 + (w-224)/100*(sliderValue-50) +'px';
        });
        y_slider.on("slide", function(sliderValue) {
        	pred_region.style.top = (h - pred_region.offsetHeight)/2 + (h-224)/100*(sliderValue-50) +'px';
        });

    }, 500);
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
        // Convert to image_size, get image slice (image_size)
        // var inputImg = tf.image.resizeNearestNeighbor(img, [this.image_size, this.image_size]);
        var inputImg = img.slice([player.videoHeight/2 - this.image_size/2, player.videoWidth/2 - this.image_size/2, 0], [this.image_size, this.image_size, 3]);
        // Preprocess the image
        inputImg = inputImg.div(255.0);
        inputImg = inputImg.sub(this.RGB_mean);
        inputImg = inputImg.expandDims(0);
        // console.log(inputImg.shape);

        // Predict the label
        status('Running inference');
        const beginMs = performance.now();

        const predictOut = this.model.predict(inputImg);
        const result = tf.topk(tf.squeeze(predictOut), 5);
        const indices = result['indices'].dataSync();
        const probs = result['values'].dataSync();
        var labels = [];
        var i;
        for (i = 0; i < indices.length; i++) {
            labels.push(this.int2label[indices[i]]);
        }
//         console.log(labels);
//         console.log(probs);
        // const argMaxPred = tf.argMax(tf.squeeze(predictOut));
        // const maxPred = tf.max(tf.squeeze(predictOut));
        // console.log('Here is the result!');
        // return how many probabilities?
        // const label = this.int2label[argMaxPred.dataSync()];
        // const prob = maxPred.dataSync();
        predictOut.dispose();
        // argMaxPred.dispose();
        // maxPred.dispose();
        result['indices'].dispose();
        result['values'].dispose();

        const endMs = performance.now();
        return {labels: labels, probs: probs, elapsed: (endMs - beginMs)};
    }
};

function displayPred(pred) {
    chars.textContent = pred.labels;
    lastchar.textContent = pred.probs;
    if (pred.probs[0]>0.85) {
        status(pred.labels[0]);
    }
}

function keepPredict(predictor) {
    snapshotCanvas.getContext('2d').drawImage(player, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
    const img = tf.fromPixels(snapshotCanvas);
    const pred = predictor.predict(img.asType('float32'));
    console.log(pred.labels);
    console.log(pred.probs);
    // status('Label: ' + result.label + '; Probability: ' + result.prob[0].toFixed(3) + '; Elapsed: ' + result.elapsed.toFixed(3) + ' ms');
    displayPred(pred);
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
