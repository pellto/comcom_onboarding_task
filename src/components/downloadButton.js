import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import firebase, { dockerURL } from "./../firebaseConfig";
import { setDownloadURL } from "./../reducers";

const DownLoadButton = () => {
    const modelLocation = useSelector((state) => state.modelLocation);
    const outputFileName = useSelector((state) => state.outputFileName);
    const downloadURL = useSelector((state) => state.downloadURL);
    const dispatch = useDispatch();
    
    useEffect(() => {
        // console.log("RUN DOWNLOAD MODEL");
        if (modelLocation && outputFileName) {
            // console.log("ENTERED MODEL LOCATION >>>> ", modelLocation);
            const ref = firebase.storage().ref();
            ref.child(modelLocation + "/" + outputFileName)
                .getDownloadURL()
                .then((url) => {
                    dispatch(setDownloadURL(url));
                });
        }
    }, [outputFileName]);

    return (
        <>
            {modelLocation && outputFileName && (
                <div>
                    <a href={downloadURL} download="output.zip">
                        <button>MODEL DOWNLOAD</button>
                    </a>
                    <br />
                    <div>Your DownloadURL : {downloadURL}</div>
                    <div>
                        <a href={dockerURL} download="Dockerfile">
                            <button>Download Sample Dockerfile</button>
                        </a>
                    </div>
                </div>
            )}
        </>
    );
};

export default DownLoadButton;
