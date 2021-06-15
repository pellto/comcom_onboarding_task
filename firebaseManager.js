import { useDispatch, useSelector } from "react-redux";
import firebase from "./firebaseConfig";
import { updateTaskID, setCSVPath } from "./reducers";

export const writeToDB = () => {
    console.log("RUN UPLOAD DATA")
    const modelInfo = useSelector((state) => state.modelParams);
    const csvPath = useSelector((state) => state.csvPath);
    const dispatch = useDispatch();
    const db = firebase.database();
    const ref = db.ref("tasks");
    const out = {
        status: "uploadingData",
        modelName: modelInfo.modelName,
        learningRate: modelInfo.learningRate,
        epoch: modelInfo.epoch,
        spendingTime: 0,
        remainTime: 0,
        csvPath: csvPath,
    };
    console.log("SETTED")
    const taskID = ref.push(out).getKey();
    console.log("TASK ID >> ", taskID);
    dispatch(updateTaskID(taskID));
    dispatch(setCSVPath(csvPath));
    console.log("DISPATCHED >> ", taskID, csvPath);
    db.ref(taskID).set(out);
};

const tempRender = () => {
    return (
        <>
        <button onClick={writeToDB}>UPLOAD DEBUG BUTTON</button>
        </>
    )
};

export default tempRender;