import json
import os

import pandas as pd
import firebase_admin
from firebase_admin import credentials, db, storage


MODEL_FILE_LIST = [
    'config.json',
    'pytorch_model.bin',
    'special_tokens_map.json',
    'tokenizer_config.json',
    'vocab.txt'
]


def init_firebase():
    cred = credentials.Certificate("./../keys/toyproject-20210611-firebase-admin.json")
    with open('./../keys/firebase-config.json') as f:
        data = json.load(f)
    firebase_admin.initialize_app(cred, data)
    print('Initialized Firebase')
#     print("Down Load data")
#     download_data()


# def download_model(model_name, model_version):
#     bucket = storage.bucket()
#     if not os.path.exists('./model'):
#         os.makedirs('./model')
#     for file_name in MODEL_FILE_LIST:
#         bucket.blob(f'model/{model_name}/{model_version}/{file_name}'). \
#             download_to_filename(f'./model/{file_name}')
#     print(f'Download {model_name} Version {model_version}')


def logging(spending_time, remain_time, acc, loss, taskID):
    ref = db.reference(f"tasks/{taskID}")
    data = ref.get()
    data["spendingTime"] = spending_time
    data["remainTime"] = remain_time
    data["acc"] = acc
    data["loss"] = loss
    ref.set(data)
    
    
def change_status(status, taskID):
    ref = db.reference(f"tasks/{taskID}/status")
    ref.set(status)


def download_data(taskID):
    bucket = storage.bucket()
    data = db.reference(f"tasks/{taskID}").get()
    if (data is not None) and (data['status'] == 'readyToTrain'):
        csv_path = data['csvPath']
        
        if not os.path.exists(f"./../data/{taskID}"):
            os.makedirs(f"./../data/{taskID}")
        file_name = os.path.split(csv_path)[1]
        save_path = f"./../data/{taskID}/{file_name}"
        bucket.blob(csv_path).download_to_filename(save_path)
        # header = text, label
        train_df = pd.read_csv(save_path)
        print(f'Data Load : {len(train_df)}')
        print(f"Positive : {sum(train_df['label'])}, Negative : {len(train_df) - sum(train_df['label'])}")
        return train_df, data
    else:
        print("MODEL NOT READY TO TRAIN")
        return 0, 0
        
    #os.remove(save_path)

    
def check_train_tasks():
    ref = db.reference("tasks/")
    data = ref.get()
    task_list = list(data.keys())
    next_task = ""
    for task_id in sorted(task_list, reverse=True):
        if data[task_id]['status'] == "uploadedData":
            next_task = task_id
            db.reference("taskQueue").set(next_task)
            ref.child(task_id + "/status").set("readyToTrain")
            break
    if next_task != "":
        return "taskQueue"
    return False


def get_train_tasks():
    ret = check_train_tasks()
    if ret:
        return db.reference(ret).get()
    else:
        False


def delete_train_tasks(key):
    db.reference(f'taskQueue/{key}').delete()
    
    
def delete_complete_tasks(task_id):
    db.reference(f"tasks/{task_id}").delete()
    

def move_from_tasks_to_history(task_id, upload_location, file_name):
    print("MOVE TASKS!!")
    data = db.reference(f"tasks/{task_id}").get()
    uid = task_id.split(":")[-1]
    ref = db.reference(f"histories/{uid}/{task_id}")
    data['modelLocation'] = upload_location
    data['outputFileName'] = file_name
    ref.set(data)
    db.reference(f"tasks/{task_id}").set(data)


def upload_result(task_id, value):
    bucket = storage.bucket()
    with open('result.json','w') as f:
        json.dump(value, f, indent=2, ensure_ascii=False)
    model_blob = bucket.blob(f'model/{task_id}/result.json')
    model_blob.upload_from_filename('result.json')
    print(f'Upload Result at {task_id}')
    print("BLOB URL", model_blob.public_url)
    
    
def upload_model(model_name, task_id):
    upload_location = f'model/{task_id}'
    file_name = "output.zip"
    bucket = storage.bucket()
#     for file_name in MODEL_FILE_LIST:
#         bucket.blob(f'model/{task_id}/{model_name}/{file_name}'). \
#             upload_from_filename(f'./../output_dir/{file_name}')
    bucket.blob(upload_location + "/" + file_name). \
        upload_from_filename(f'./../output_dir/output.zip')
    print(f'Upload Model at {model_name} Version {task_id}')
    return upload_location, file_name



if __name__ == "__main__":
    init_firebase()