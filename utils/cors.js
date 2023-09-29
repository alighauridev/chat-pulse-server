const cors = require("cors");

const whiteList = [];

let corsOptionsDelegate = (req, callback) => {
    let corsOptions;
    if (whiteList.indexOf(req.header("Origin")) !== -1) {
        corsOptions = { origin: true };
    } else {
        corsOptions = { origin: false };
    }
    callback(null, corsOptions);
};

const corsAll = cors();
const corsWithOptions = cors(corsOptionsDelegate);

module.exports = {
    corsAll,
    corsWithOptions,
};
