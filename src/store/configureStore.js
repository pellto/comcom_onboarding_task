import { createWrapper } from 'next-redux-wrapper';
import { createStore } from 'redux';
import Reducer from './../reducers';

const configureStore = () => {
    const store = createStore(Reducer);
    return store;
};

const wrapper = createWrapper(configureStore, {
    debug: process.env.NODE_ENV === "development",
});

export default wrapper;