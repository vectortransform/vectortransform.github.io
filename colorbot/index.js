const HOSTED_URLS = {
  model:
      'model_js/model.json',
  metadata:
      'model_js/metadata.json'
};

function status(statusText) {
  console.log(statusText);
  document.getElementById('status').textContent = statusText;
}

function showMetadata(metadataJSON) {
  document.getElementById('maxLen').textContent =
      metadataJSON['max_len'];
}

function disableLoadModelButtons() {
  document.getElementById('load-model').style.display = 'none';
}

function doPredict(predict) {
  const textField = document.getElementById('text-entry');
  const result = predict(textField.value);
  RGB_string = 'R: '+result.colors[0]+'; G: '+result.colors[1]+'; B: '+result.colors[2];
  //console.log(score_string);
  status(
      RGB_string + ' elapsed: ' + result.elapsed.toFixed(3) + ' ms)');
}



// async function urlExists(url) {
//   status('Testing url ' + url);
//   try {
//     const response = await fetch(url, {method: 'HEAD'});
//     return response.ok;
//   } catch (err) {
//     return false;
//   }
// }

// async function loadHostedPretrainedModel(url) {
//   status('Loading pretrained model from ' + url);
//   try {
//     const model = await tf.loadModel(url);
//     status('Done loading pretrained model.');
//     disableLoadModelButtons();
//     return model;
//   } catch (err) {
//     console.error(err);
//     status('Loading pretrained model failed.');
//   }
// }

// async function loadHostedMetadata(url) {
//   status('Loading metadata from ' + url);
//   try {
//     const metadataJson = await fetch(url);
//     const metadata = await metadataJson.json();
//     status('Done loading metadata.');
//     return metadata;
//   } catch (err) {
//     console.error(err);
//     status('Loading metadata failed.');
//   }
// }



// class Classifier {
//
//   async init(urls) {
//     this.urls = urls;
//     this.model = await loadHostedPretrainedModel(urls.model);
//     await this.loadMetadata();
//     return this;
//   }
//
//   async loadMetadata() {
//     const metadata =
//         await loadHostedMetadata(this.urls.metadata);
//     showMetadata(metadata);
//     this.maxLen = metadata['max_len'];
//     console.log('maxLen = ' + this.maxLen);
//     this.wordIndex = metadata['word_index']
//   }
//
//   predict(text) {
//     // Convert to lower case and remove all punctuations.
//     const inputText =
//         text.trim().toLowerCase().replace(/(\.|\,|\!)/g, '').split(' ');
//     // Look up word indices.
//     const inputBuffer = tf.buffer([1, this.maxLen], 'float32');
//     for (let i = 0; i < inputText.length; ++i) {
//       const word = inputText[i];
//       inputBuffer.set(this.wordIndex[word], 0, i);
//       //console.log(word, this.wordIndex[word], inputBuffer);
//     }
//     const input = inputBuffer.toTensor();
//     //console.log(input);
//
//     status('Running inference');
//     const beginMs = performance.now();
//     const predictOut = this.model.predict(input);
//     //console.log(predictOut.dataSync());
//     const score = predictOut.dataSync();//[0];
//     predictOut.dispose();
//     const endMs = performance.now();
//
//     return {score: score, elapsed: (endMs - beginMs)};
//   }
// };
//
// async function setup() {
//   if (await urlExists(HOSTED_URLS.model)) {
//     status('Model available: ' + HOSTED_URLS.model);
//     const button = document.getElementById('load-model');
//     button.addEventListener('click', async () => {
//       const predictor = await new Classifier().init(HOSTED_URLS);
//       document.getElementById('predict-text').onclick = function(){
//           console.log('Predicting...');
//           // doPredict(predict);
//       };
//     });
//     button.style.display = 'inline-block';
//   }

//   status('Standing by.');
// }

// setup();
document.getElementById('predict-text').onclick = function(){
    console.log('Predicting...');
    // doPredict(predict);
};
