import os
import json
import random

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
# Models
from transformers import (
    BertForSequenceClassification,
    ElectraForSequenceClassification,
    DistilBertForSequenceClassification,

    BertTokenizer
)
import zipfile


DEFAULT_PARAMETER = {
    'maxSeqLen': 128,
    'batchSize': 32,
    'warmupProportion': 0.001,
}


MODEL_FOR_SEQUENCE_CLASSIFICATION = {
    'bert': BertForSequenceClassification,
    'electra': ElectraForSequenceClassification,
    'distilBert': DistilBertForSequenceClassification,
}


TOKENIZER_CLASSES = {
    'bert': BertTokenizer,
    'electra': BertTokenizer,
    'distilBert': BertTokenizer,
}


class ToyDataset(Dataset):
    def __init__(self, df, tokenizer, max_length):
        self.input_ids = []
        for sentence in df['text']:
            self.input_ids.append(tokenizer(
                sentence,
                padding='max_length',
                max_length=max_length,
                return_tensors='pt',
                return_token_type_ids=False,
                return_attention_mask=False,
                truncation=True)['input_ids'][0])
        self.labels = torch.LongTensor(df['label'])
        print("INPUT Shape >> ", len(self.input_ids), self.input_ids[0].shape)
        print("INPUT LABEL Shape >> ", len(self.labels), self.labels.shape)

    def __len__(self):
        return len(self.input_ids)

    def __getitem__(self, idx):
        return self.input_ids[idx], self.labels[idx]


def get_model(model_name):
    model = MODEL_FOR_SEQUENCE_CLASSIFICATION[model_name].from_pretrained(f"./models/{model_name}")
    tokenizer = TOKENIZER_CLASSES[model_name].from_pretrained(f"./models/{model_name}")
    return model, tokenizer


def accuracy_score(labels, predicts):
    return (labels == predicts).mean()


def set_seed(random_seed):
    random.seed(random_seed)
    np.random.seed(random_seed)
    torch.manual_seed(random_seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(random_seed)


def get_dataloader(dataset, batch_size, shuffle):
    dataloader = DataLoader(
        dataset=dataset,
        batch_size=batch_size,
        pin_memory=True,
        shuffle=shuffle,
    )
    return dataloader


def write_model_info(model_name, save_dir):
    print("SAVE MODEL INFO")
    with open(os.path.join(save_dir, "model_info.json"), "w") as f:
        json.dump({"model_name": model_name}, f)


def zipper(target_dir):
    print("ZIPPER RUN!!")
    base_dir = "./../default"
    file_types = {'.json', '.txt', '.bin'}
    with zipfile.ZipFile(os.path.join(target_dir, "output.zip"), 'w', compression=zipfile.ZIP_DEFLATED) as ZIP:
        for file_name in os.listdir(target_dir):
            if os.path.splitext(file_name)[-1] in file_types:
                ZIP.write(os.path.join(target_dir, file_name), file_name, compress_type=zipfile.ZIP_DEFLATED)
        for file_name in os.listdir(base_dir):
            if "Docker" in file_name:
                continue
            ZIP.write(os.path.join(base_dir, file_name), file_name, compress_type = zipfile.ZIP_DEFLATED)
            
    
def unZipper(target_file, extract_path):
    zipfile.ZipFile(target_file, 'r').extractall(extract_path)
    print(f"EXTRACT PATH : {extract_path}")
    print(f"EXTRACTED FILE LIST : {os.listdir(extract_path)}")
    
    
    


