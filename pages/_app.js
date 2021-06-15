import React from "react";
import { PropTypes } from "prop-types"
import wrapper from "./../store/configureStore";

const ToyProject = ({ Component }) => {
    return (
        <Component/>
        // <html>
        //     <head>
        //         <meta charSet="utf-8" />
        //         <title>ToyProject</title>
        //     </head>
        //     <body>
        //         <div>TP APP</div>
        //         <Component/>
        //     </body>
        // </html>
    );
};

ToyProject.prototype = {
    Component: PropTypes.elementType.isRequired,
}

export default wrapper.withRedux(ToyProject);
