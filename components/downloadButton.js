import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import firebase from "./../firebaseConfig";
import { setDownloadURL } from "./../reducers";

const DownLoadButton = () => {
    const modelLocation = useSelector((state) => state.modelLocation);
    const outputFileName = useSelector((state) => state.outputFileName)
    const downloadURL = useSelector((state) => state.downloadURL);
    const downloadDefaultZip = useSelector((state) => state.downloadDefaultZip);
    const dispatch = useDispatch();
    const downloadModels = useEffect(() => {
        console.log("RUN DOWNLOAD MODEL");
        if (modelLocation && outputFileName) {
            console.log("ENTERED MODEL LOCATION >>>> ", modelLocation);
            const ref = firebase.storage().ref();
            // const ref = storage.ref(modelLocation);
            ref.child(modelLocation + "/" + outputFileName).getDownloadURL().then((url) => {
                console.log("DOWNLOAD URL IS >>>", url);
                dispatch(setDownloadURL(url));
            });
        }
    }, [outputFileName]);

    const modelLocationDebugBTN = () => {
        console.log(modelLocation);
        console.log("DOWNLOAD URL >> ", downloadURL);
        console.log("downloadAPIpy >> ", downloadAPIpy);
        console.log("downloadDockefile >> ", downloadDockefile);
        console.log("downloadRequirement >> ", downloadRequirement);
    };

    return (
        <>
            {modelLocation && outputFileName && (
                <div>
                    {/* <button onClick={downloadModels}>DOWNLOAD BUTTON</button>
                    <button onClick={modelLocationDebugBTN}>
                        MODEL LOCATION DEBUG
                    </button> */}
                    <a href={downloadURL} download="output.zip">
                        <button>MODEL DOWNLOAD</button>
                    </a>
                    <br />

                    <div>
                        <br />
                        <br />
                        HOW TO USE ?<br />
                        1. MAKE working Directory
                        <br />
                        2. DOWNLOAD MODELS
                        <br />
                        3. UNZIP with python
                        <br />
                        ================================================
                        <br />
                        import zipfile
                        <br />
                        zipfile.ZipFile("./[YOUR OUTPUT ZIPFILE NAME].zip", 'r').extractall("./")
                        <br />
                        ================================================
                        <br />
                        4. BUILD DOCKER FILE
                        <br />
                        ================================================
                        <br />
                        docker build -t toy:latest .<br />
                        docker run -d -p 5000:5000 toy:latest
                        <br />
                        ================================================
                        <br />
                        <a href="http://127.0.0.1:5000"> 5. With Swagger </a>
                    </div>
                </div>
            )}
        </>
    );
};

export default DownLoadButton;
