import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import firebase from "../firebaseConfig";
import { updateTaskID, setSelectedFile, setLogInfo } from "../reducers";

const TrainButton = () => {
    const modelInfo = useSelector((state) => state.modelParams);
    const [csvPath, setCsvPath] = useState(null);
    const [clickedButton, setClickedButton] = useState(null);
    const stateTaskID = useSelector((state) => state.taskID);
    const uid = useSelector((state) => state.userInfo.uid);
    const currentFile = useSelector((state) => state.selectedFile);
    const dispatch = useDispatch();

    const writeToDB = () => {
        if (!stateTaskID && currentFile) {
            return new Promise((resolve, reject) => {
                console.log("RUN UPLOAD DATA");
                const db = firebase.database();
                const ref = db.ref("tasks/");
                const timeStamp = `${Date.now()}`;
                const taskID = timeStamp + ":" + uid;
                const csvSavePath = "data/" + taskID + "/" + currentFile.name;
                const out = {
                    status: "uploadingData",
                    modelName: modelInfo.modelName,
                    learningRate: modelInfo.learningRate,
                    epoch: modelInfo.epoch,
                    spendingTime: 0,
                    remainTime: 0,
                    csvPath: csvSavePath,
                };
                console.log("SETTED");
                ref.child(taskID).set(out);
                console.log("TASK ID >> ", taskID);
                dispatch(updateTaskID(taskID));
                setCsvPath(csvSavePath);
                resolve({ csvSavePath: csvSavePath, taskID: taskID });
            });
        }
    };

    const updateStatusToDB = (e) => {
        const ref = firebase.database().ref("tasks/" + e.taskID + "/status");
        ref.set(e.status);
    };

    const uploadToStorage = (resolvedData) => {
        if (resolvedData && currentFile) {
            console.log("UPLOAD >> ", resolvedData);
            const storageRef = firebase.storage().ref();
            const uploadTask = storageRef
                .child(resolvedData.csvSavePath)
                .put(currentFile);
            uploadTask.on(
                "state_changed",
                async (snapshot) => {
                    const progress =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log("Upload is " + progress + "% Done");
                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED:
                            console.log("UPLOAD IS PAUSED");
                            break;
                        case firebase.storage.TaskState.RUNNING:
                            console.log("UPLOAD IS RUNNING");
                            break;
                    }
                },
                (error) => {
                    console.log(error);
                },
                () => {
                    uploadTask.snapshot.ref.getDownloadURL().then((e) => {
                        console.log(e);
                        // dispatch(changeIsUpload());
                        // setFileUploadProgress(-1);
                    });
                    console.log("TASK ID >> ", resolvedData.taskID);
                    updateStatusToDB({
                        status: "uploadedData",
                        taskID: resolvedData.taskID,
                    });
                }
            );
        } else {
            console.log("YOU MUST UPLOAD!!");
        }
    };

    const uploadTasks = (e) => {
        setClickedButton(true);
        writeToDB().then((resolvedData) => {
            uploadToStorage(resolvedData);
            setSelectedFile(false);
        });
    };

    return (
        <>
            {clickedButton ? <div>waiting ... </div> : <button onClick={uploadTasks}>TrainButton</button>}
        </>
    );
};

export default TrainButton;
