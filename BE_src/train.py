import gc
import os
import time

import torch
from tqdm import tqdm
from transformers import AdamW, get_linear_schedule_with_warmup

from firebase_utils import init_firebase, download_data, change_status, logging,\
 upload_model, get_train_tasks, delete_train_tasks, upload_result, move_from_tasks_to_history
from utils import MODEL_FOR_SEQUENCE_CLASSIFICATION, TOKENIZER_CLASSES, DEFAULT_PARAMETER
from utils import ToyDataset, get_dataloader, set_seed, accuracy_score, get_model, zipper, write_model_info


def train(model, train_dataloader, num_train_epochs, learning_rate, warmup_proportion, taskID):
    device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')
    model.train()
    global_total_step = len(train_dataloader) * num_train_epochs
    global_step = 0
    optimizer = AdamW(model.parameters(), lr=learning_rate, weight_decay=0)
    scheduler = get_linear_schedule_with_warmup(optimizer,
                                                num_warmup_steps=global_total_step * warmup_proportion,
                                                num_training_steps=global_total_step)
    with tqdm(total=global_total_step, unit='step') as t:
        total = 0
        total_loss = 0
        global_total_acc = 0
        global_time = 0
        for epoch in range(num_train_epochs):
            prev = ""
            for input_ids, labels in train_dataloader:
                start_time = time.time()
                input_ids = input_ids.to(device, non_blocking=True)
                labels = labels.to(device, non_blocking=True)
#                     if global_step >= 9:
#                         print(input_ids)
#                         print(labels)
                model.zero_grad(set_to_none=True)
                outputs = model(
                    input_ids=input_ids,
                    labels=labels
                )

                loss, logits = (outputs['loss'], outputs['logits']) if isinstance(outputs, dict) else (
                    outputs[0], outputs[1])

                loss.backward()
                optimizer.step()
                scheduler.step()

                preds = logits.detach().argmax(dim=-1).cpu().numpy()
                out_label_ids = labels.detach().cpu().numpy()

                batch_loss = loss.item() * len(input_ids)
                batch_acc = accuracy_score(out_label_ids, preds)

                total += len(input_ids)
                total_loss += batch_loss
                global_total_acc += batch_acc
                duration_time = time.time() - start_time
                global_time += duration_time
                global_step += 1
# spending_time, remain_time, acc, loss, taskID
                if global_step % 150 == 1:
                    if global_step == 1:
                        change_status("training", taskID)
                    logging(round(global_time, 2), round(duration_time * (global_total_step - global_step), 2), round(global_total_acc / global_step, 4), round(total_loss / global_step, 6), taskID)
                        

                t.set_postfix(loss='{:.6f}'.format(batch_loss),
                            accuracy='{:.2f}'.format(accuracy_score(out_label_ids, preds) * 100))
                t.update(1)
    logging(round(global_time, 2), 0, round(global_total_acc / global_step, 4), round(total_loss / global_step, 6), taskID)
    return total_loss, global_total_acc / global_total_step, round(global_total_acc / global_step, 4), round(total_loss / global_step, 6)


def train_single(model_type, train_df, num_train_epochs, learning_rate, batch_size, max_seq_len, warmup_proportion, taskID):
    # device 를 할당 한다.
    print("Set Device")
    device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')
    # Model 과 Tokenizer를 불러온다.
    print("Get Model", model_type)
    print(f"./../models/{model_type}/")
    model, tokenizer = get_model(model_type)
    # MODEL_FOR_SEQUENCE_CLASSIFICATION[model_type].from_pretrained(f'./model/{model_type}')
    # tokenizer = TOKENIZER_CLASSES[model_type].from_pretrained(f'./models/{model_type}')
    # Dataset 을 만든다.
    print("Get DataLoader")
    train_dataset = ToyDataset(train_df, tokenizer, max_seq_len)
    tokenizer.save_pretrained('./../output_dir')
    model.to(device)
    while batch_size:
        try:
            train_dataloader = get_dataloader(train_dataset, batch_size, shuffle=True)
            print("RUN Train")
            loss, acc, spending_time, remain_time = train(model, train_dataloader, num_train_epochs, learning_rate, warmup_proportion, taskID)
            break
        except RuntimeError as e:
            if 'CUDA out of memory' in f'{e}':
                if batch_size > 1:
                    print(
                        f'CUDA out of memory. Try to decrease batch size from {batch_size} to {batch_size // 2}')
                    batch_size //= 2
                    gc.collect()
                else:
                    print('You don\'t have enough gpu memory to train this model')
                    exit(1)
            else:
                print('Runtime Error', e.args)
                exit(1)
    model.save_pretrained('./../output_dir')
    zipper("./../output_dir")
    return loss, acc, spending_time, remain_time


def main():
    init_firebase()
    while True:
        taskID = get_train_tasks()
        if taskID:
            try:
                print(f'Train Task {taskID}')
                # Random Seed를 설정 해준다. => 재현을 위해
                print("setSeed")
                set_seed(12345)
                # 초기 모델을 다운로드 받는다.
                # model, tokenizer = download_model(value['modelType'])
                # 데이터를 다운로드 받는다.
                print("DownLoad Data")
                train_df, parameters = download_data(taskID)
                # 학습을 시작 한다.
                # (model_type, train_df, max_seq_len, batch_size,
                #  num_train_epochs, learning_rate, warmup_proportion)
                print("Train Single")
#                     value['modelInfo']['modelType'],
#                         train_df,
#                         value['modelInfo']['epoch'],
#                         value['modelInfo']['learningRate'],
#                         DEFAULT_PARAMETER['batchSize'],
#                         DEFAULT_PARAMETER['maxSeqLen'],
#                         DEFAULT_PARAMETER['warmupProportion'],
                if not(os.path.exists("./../output_dir")):
                    os.makedirs("./../output_dir")
                write_model_info(parameters['modelName'], "./../output_dir")
                loss, acc, spending_time, remain_time = train_single(
                    parameters['modelName'],
                    train_df,
                    parameters['epoch'],
                    parameters['learningRate'],
                    DEFAULT_PARAMETER['batchSize'],
                    DEFAULT_PARAMETER['maxSeqLen'],
                    DEFAULT_PARAMETER['warmupProportion'],
                    taskID,
                )
                change_status("uploadingResult", taskID)
                
                print(f'Validation Result Loss : {loss} Acc : {acc}')
                value = {}
                value['train_loss'] = loss
                value['train_acc'] = acc
                value['spending_time'] = spending_time
                value['remain_time'] = remain_time
                # 학습에 사용한 파라메터와 성능을 저장 한다.
                upload_result(taskID, value)
                # 학습 완료된 모델을 업로드 한다.
                upload_location, output_name = upload_model(parameters['modelName'], taskID)
                change_status("settedDownload", taskID)
                move_from_tasks_to_history(taskID, upload_location, output_name)
            except Exception as e:
                print('Error :', e)
            finally:
                print("HERE")
#                 delete_train_tasks(taskID)
        else:
            print('There are no train tasks')
            # 10초간 대기
            time.sleep(10)


if __name__ == '__main__':
    main()