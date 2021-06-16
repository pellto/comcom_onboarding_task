import os
import json

import torch
from flask import Flask, make_response
from flask_restx import Api, Resource, reqparse
from scipy.special import softmax
import zipfile
from transformers import (
    BertForSequenceClassification,
    ElectraForSequenceClassification,
    DistilBertForSequenceClassification,

    BertTokenizer
)

MODEL_FOR_SEQUENCE_CLASSIFICATION = {
    'bert': BertForSequenceClassification,
    'electra': ElectraForSequenceClassification,
    'distilbert': DistilBertForSequenceClassification,
}


TOKENIZER_CLASSES = {
    'bert': BertTokenizer,
    'electra': BertTokenizer,
    'distilbert': BertTokenizer,
}


app = Flask(__name__)
api = Api(app)


DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
EXTRACT_FILE_PATH = "."


with open(os.path.join(EXTRACT_FILE_PATH, "model_info.json"), 'r') as f:
    data = json.load(f)
MODEL_INFO = data['model_name']

print("MODEL LOADING ...")
MODEL = MODEL_FOR_SEQUENCE_CLASSIFICATION[MODEL_INFO].from_pretrained(EXTRACT_FILE_PATH)
print("TOKENIZER LOADING ...")
TOKENIZER = TOKENIZER_CLASSES[MODEL_INFO].from_pretrained(EXTRACT_FILE_PATH)
MODEL.to(DEVICE)
MODEL.eval()

def predict(text):
    if text == "":
        return "ERROR!! :("
    
    tokens = TOKENIZER.encode(text, return_tensors='pt').to(DEVICE)
    prediction = softmax(MODEL(tokens).logits.detach().cpu().numpy()[0])
    out = {"negative":str(prediction[0]), "positive":str(prediction[1])}
    return out


@api.route("/predict")
@api.doc(params={
   'text': {
      'description':"INPUT YOUR TEXT"
   }
})
class SentimentClassifyAPI(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument("text")
        text = parser.parse_args()['text']
        
        pred = predict(text)
        return make_response(json.dumps({"result":pred}, ensure_ascii=False))


api.add_resource(SentimentClassifyAPI, '/predict')


if __name__=="__main__":
    app.run(host="0.0.0.0", port=5000)