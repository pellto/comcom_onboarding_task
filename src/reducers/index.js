import { HYDRATE } from "next-redux-wrapper";
import {
    LOGIN,
    UPDATE_USER,
    LOGOUT,
    UPDATE_MODEL_INFO,
    UPDATE_EPOCH,
    UPDATE_LEARNING_RATE,
    UPDATE_MODEL_NAME,
    SET_CSV_PATH,
    UPDATE_TASK_ID,
    SET_SELECTED_FILE,
    SET_LOG_INFO,
    SET_READY_TO_UPLOAD,
    SET_MODEL_LOCATION,
    SET_DOWNLOAD_URL,
    SET_DOWNLOAD_DEFAULT,
    SET_OUTPUT_FILE_NAME,
} from "./actions";
import firebase from "./../firebaseConfig";

const initialState = {
    user: "Pellto",
    isLoggedIn: firebase.auth().currentUser ? true : false,
    userInfo: {
        photoURL: null,
        name: null,
        email: null,
        uid: null,
    },
    modelParams: {
        modelName: null,
        learningRate: null,
        learningRateIsValid: true,
        epoch: null,
        epochIsValid: true,
    },
    csvPath: "",
    taskID: null,
    selectedFile: null,
    spendingTime: 0,
    readyToUpload: null,
    remainTime: 0,
    modelLocation: null,
    downloadURL: null,
    outputFileName: null,
};

const isFloat = (n) => {
    return Number(n) === n && n % 1 !== 0;
};

const isInt = (n) => {
    return n % 1 === 0;
};

export const setOutputFileName = (data) => {
    return {
        type: SET_OUTPUT_FILE_NAME,
        data: data,
    };
};

export const setDownloadDefaultZip = (data) => {
    return {
        type: SET_DOWNLOAD_DEFAULT,
        data: data,
    };
};

export const setDownloadURL = (data) => {
    return {
        type: SET_DOWNLOAD_URL,
        data: data,
    };
};

export const setReadyToUpload = (data) => {
    return {
        type: SET_READY_TO_UPLOAD,
        data: data,
    };
};

export const setModelLocation = (data) => {
    return {
        type: SET_MODEL_LOCATION,
        data: data,
    };
};

export const setLogInfo = (data) => {
    return {
        type: SET_LOG_INFO,
        data: data,
    };
};

export const setSelectedFile = (data) => {
    return {
        type: SET_SELECTED_FILE,
        data: data,
    };
};

export const setCSVPath = (data) => {
    console.log("first here");
    return {
        type: SET_CSV_PATH,
        data: data,
    };
};

export const updateTaskID = (data) => {
    return {
        type: UPDATE_TASK_ID,
        data: data,
    };
};

export const updateModelName = (data) => {
    return {
        type: UPDATE_MODEL_NAME,
        data: data,
    };
};

export const updateEpoch = (data) => {
    return {
        type: UPDATE_EPOCH,
        data: data,
    };
};

export const updateLearningRate = (data) => {
    return {
        type: UPDATE_LEARNING_RATE,
        data: data,
    };
};

export const updateModelInfo = (data) => {
    return {
        type: UPDATE_MODEL_INFO,
        data: data,
    };
};

export const changeUser = (data) => {
    return {
        type: UPDATE_USER,
        data: data,
    };
};

export const loginAction = (data) => {
    return {
        type: LOGIN,
        data: data,
    };
};

export const logoutAction = (data) => {
    return {
        type: LOGOUT,
    };
};

const rootReducer = (state = initialState, action) => {
    switch (action.type) {
        case HYDRATE:
            return { ...state, ...action };
        case UPDATE_USER:
            return {
                ...state,
                user: action.data,
            };
        case LOGIN:
            return {
                ...state,
                userInfo: action.data,
                isLoggedIn: true,
            };
        case LOGOUT:
            return {
                ...state,
                userInfo: {
                    photoURL: null,
                    name: null,
                    email: null,
                    uid: null,
                },
                isLoggedIn: false,
            };
        case UPDATE_MODEL_INFO:
            return {
                ...state,
                modelParams: action.data,
            };
        case UPDATE_LEARNING_RATE:
            const inputLR = action.data;
            if (isFloat(inputLR)) {
                return {
                    ...state,
                    modelParams: {
                        ...state.modelParams,
                        learningRate: inputLR,
                        learningRateIsValid: true,
                    },
                };
            } else {
                return {
                    ...state,
                    modelParams: {
                        ...state.modelParams,
                        learningRateIsValid: false,
                    },
                };
            }
        case UPDATE_EPOCH:
            const inputEpoch = action.data;
            if (isInt(inputEpoch)) {
                return {
                    ...state,
                    modelParams: {
                        ...state.modelParams,
                        epoch: inputEpoch,
                        epochIsValid: true,
                    },
                };
            } else {
                return {
                    ...state,
                    modelParams: {
                        ...state.modelParams,
                        epochIsValid: false,
                    },
                };
            }
        case UPDATE_MODEL_NAME:
            return {
                ...state,
                modelParams: {
                    ...state.modelParams,
                    modelName: action.data,
                },
            };
        case UPDATE_TASK_ID:
            return {
                ...state,
                taskID: action.data,
            };
        case SET_CSV_PATH:
            return {
                ...state,
                csvPath: action.data,
            };
        case SET_SELECTED_FILE:
            return {
                ...state,
                selectedFile: action.data,
            };
        case SET_LOG_INFO:
            return {
                ...state,
                spendingTime: action.data.spendingTime,
                remainTime: action.data.remainTime,
            };
        case SET_READY_TO_UPLOAD:
            return {
                ...state,
                readyToUpload: action.data,
            };
        case SET_MODEL_LOCATION:
            return {
                ...state,
                modelLocation: action.data,
            };
        case SET_DOWNLOAD_URL:
            return {
                ...state,
                downloadURL: action.data,
            };
        case SET_DOWNLOAD_DEFAULT:
            return {
                ...state,
                downloadDefaultZip: action.data,
            };
        case SET_OUTPUT_FILE_NAME:
            return {
                ...state,
                outputFileName: action.data,
            };
        default:
            return state;
    }
};

export default rootReducer;
