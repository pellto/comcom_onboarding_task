import React from "react";
import { PropTypes } from "prop-types"
import wrapper from "./../store/configureStore";

const ToyProject = ({ Component }) => {
    return (
        <Component/>
    );
};

ToyProject.prototype = {
    Component: PropTypes.elementType.isRequired,
}

export default wrapper.withRedux(ToyProject);
