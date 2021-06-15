import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "@material-ui/core/Select";
import { MenuItem, TextField } from "@material-ui/core";
import firebase from "../firebaseConfig";
import {
    updateModelName,
    updateLearningRate,
    updateEpoch,
    setSelectedFile,
    setLogInfo,
    setModelLocation,
    setOutputFileName,
} from "./../reducers";
import TrainButton from "./trainButton";

const ModelLayout = () => {
    const modelParams = useSelector((state) => state.modelParams);
    const isLoggedIn = useSelector((state) => state.isLoggedIn);
    const selectedFile = useSelector((state) => state.selectedFile);
    const csvPath = useSelector((state) => state.csvPath);
    const taskID = useSelector((state) => state.taskID);
    const remainTime = useSelector((state) => state.remainTime);
    const spendingTime = useSelector((state) => state.spendingTime);
    // const readyToUpload = useSelector((state) => state.readyToUpload);
    const db = firebase.database();
    const [serviceModels, setServiceModels] = useState(null);
    const [readyToUpload, setReadyToUpload] = useState(null);
    const dispatch = useDispatch();

    const onLoadModelInfo = () => {
        const serviceModelRef = db.ref();
        serviceModelRef
            .child("modelName/")
            .get()
            .then((snapshot) => {
                setServiceModels(snapshot.val());
            });
    };

    if (isLoggedIn && !serviceModels) {
        onLoadModelInfo();
    }

    const debugBTN = () => {
        console.log(modelParams);
        console.log("RTU >> ", readyToUpload);
        console.log("FILES >> ", selectedFile);
        console.log("CSV FILE NAME >> ", csvPath ? csvPath : "NONO");
        console.log("TASK ID >>", taskID);
        console.log("REMAIN >> ", remainTime, "SPENDING >> ", spendingTime);
        console.log(firebase.auth().currentUser);
        console.log("LOGGED IN ?? >> ", isLoggedIn);
    };

    const onSelectFile = (file) => {
        console.log("FILE >>", file);
        dispatch(setSelectedFile(file));
    };

    useEffect(() => {
        setReadyToUpload(
            isLoggedIn &&
                modelParams.learningRateIsValid &&
                modelParams.epochIsValid &&
                modelParams.epoch &&
                modelParams.learningRate &&
                selectedFile
        );
    }, [isLoggedIn, modelParams, selectedFile]);

    // useEffect(() => {
    //     if (isLoggedIn) {
    //         const dbChild = db.ref().child("tasks/" + (taskID !== null ? taskID : ""))

    //         dbChild.on('value', (snap) => {
    //             const status =
    //         })
    //     }
    // })

    useEffect(() => {
        if (isLoggedIn) {
            const dbChild = db
                .ref()
                .child("tasks/" + (taskID !== null ? taskID : ""));

            dbChild.on("value", (snap) => {
                // console.log(snap);
                // console.log("log/" + (userInfo !== null ? userInfo.uid : ""));
                const log = snap.val();
                // console.log("LOG >>", log);
                // console.log("SNAP VALUE >> ", );
                if (log !== null && log.status === "training") {
                    dispatch(
                        setLogInfo({
                            spendingTime: log.spendingTime,
                            remainTime: log.remainTime,
                        })
                    );
                    const value = log.status;
                    // console.log(
                    //     "LOGGED RUNNING STATE>>",
                    //     log.status,
                    //     log.spendingTime,
                    //     log.remainTime,
                    //     spendingTime,
                    //     remainTime,
                    // );
                    // console.log("VALUE >>", value);
                    // // const task_id = log.
                    // const task_id = Object.keys(log);
                    // console.log("TASK >>", task_id);
                    // setSpendingTimeState(value["spendingTime"]);
                    // setRemainTimeState(value["remainTime"]);
                }
                if (log !== null && log.status === "settedDownload") {
                    console.log(
                        "MODEL LOCATION >>> ",
                        log.status,
                        log.modelLocation,
                        log.outputFileName
                    );
                    dispatch(setModelLocation(log.modelLocation));
                    dispatch(setOutputFileName(log.outputFileName));
                }
            });
        }
    }, [spendingTime, remainTime, isLoggedIn, taskID]);

    return (
        <>
            {isLoggedIn && (
                <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => onSelectFile(e.target.files[0])}
                />
            )}
            <button onClick={debugBTN}>DEBUG BUTTON</button>
            {isLoggedIn && (
                <div>
                    <div>MODEL NAME</div>
                    <div>
                        {serviceModels && (
                            <Select
                                onChange={(e) => {
                                    dispatch(updateModelName(e.target.value));
                                }}
                            >
                                {Object.keys(serviceModels).map(
                                    (key, index) => {
                                        return (
                                            <MenuItem key={key} value={key}>
                                                {key}
                                            </MenuItem>
                                        );
                                    }
                                )}
                            </Select>
                        )}
                    </div>
                    <div> Learning Rate</div>
                    <div
                        onChange={(e) =>
                            dispatch(updateLearningRate(Number(e.target.value)))
                        }
                    >
                        {modelParams.learningRateIsValid ? (
                            <TextField />
                        ) : (
                            <TextField error helperText="Must Enter Float!!!" />
                        )}
                    </div>
                    <div> Epoch</div>
                    <div
                        onChange={(e) =>
                            dispatch(updateEpoch(Number(e.target.value)))
                        }
                    >
                        {modelParams.epochIsValid ? (
                            <TextField />
                        ) : (
                            <TextField
                                error
                                helperText="Must Enter Positive Integer!!!"
                            />
                        )}
                    </div>
                </div>
            )}
            {readyToUpload && spendingTime == 0 && remainTime == 0 && (
                <TrainButton />
            )}
            {spendingTime > 0 && remainTime > 0 && (
                <div>
                    <div>
                        SPENDING >>   {spendingTime} sec | REMAINING >>   {remainTime} sec
                    </div>
                </div>
            )}
            {spendingTime > 0 && remainTime == 0 && <div>DONE!!</div>}
        </>
    );
};

export default ModelLayout;
