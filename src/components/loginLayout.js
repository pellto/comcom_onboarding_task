import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import firebase from "../firebaseConfig";
import { loginAction, logoutAction } from "./../reducers";

const LoginLayout = () => {
    const dispatch = useDispatch();
    const isLoggedIn = useSelector((state) => state.isLoggedIn);
    const userInfo = useSelector((state) => state.userInfo);

    const getUserInfo = (_user) => {
        const out = {
            email: _user.email,
            name: _user.displayName,
            photoURL: _user.photoURL,
            uid: _user.uid,
        };
        return out;
    };

    const onLogOut = useCallback(() => {
        firebase
            .auth()
            .signOut()
            .then(
                function () {
                    console.log("LOGOUT!!!");
                    dispatch(logoutAction());
                    // dispatch(changeIsValidForm());
                    //setUserInfo(null);
                },
                function (error) {
                    throw error;
                }
            );
    }, [isLoggedIn]);

    const onLogIn = useCallback(() => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase
            .auth()
            .signInWithPopup(provider)
            .then((res) => {
                firebase
                    .auth()
                    .setPersistence(firebase.auth.Auth.Persistence.SESSION)
                    .then(() => {
                        const _user = res.user;
                        // console.log("CREDENTIAL", res.credential);
                        // console.log("USERINFO", res.user);
                        //setUserInfo(out);
                        // dispatch(loginAction(getUserInfo(_user)));
                        // dispatch(changeIsValidForm());
                    })
                    .catch((error) => {
                        alert(error);
                    });
            });
    }, [isLoggedIn]);

    useEffect(() => {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // console.log("IS LOGGED IN");
                // console.log(user);
                dispatch(loginAction(getUserInfo(user)))
            } else {
                console.log("NOT LOGGED IN");
            }
        });
    }, [isLoggedIn]);

    return (
        <>
            {isLoggedIn ? (
                <div>
                    <img src={userInfo.photoURL} />
                    <div>USER NAME : {userInfo.name}</div>
                    <div>USER EMAIL : {userInfo.email}</div>
                    <div>USER ID : {userInfo.uid}</div>
                    <button onClick={onLogOut}>Log Out</button>
                </div>
            ) : (
                <button onClick={onLogIn}>LogIN Button</button>
            )}
        </>
    );
};

export default LoginLayout;
