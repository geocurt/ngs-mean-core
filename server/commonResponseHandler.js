const _ = require('lodash');
const utils = require('./utils');

function commonResponseHandler(req, res, requiredInputs, optionalInputs, executor) {

    try {

        let source = {};
        if (req.method == 'GET') {
            _.forEach(req.query, (v, k) => {
                source[k] = decodeURIComponent(v);
            });
        } else if (req.method == 'POST') {
            source = req.body
        } else {
            utils.errLogger(req.originalUrl, 'Bad Method');
            res.status(500).send(utils.returnMessaging(path, 'Bad Method'));
        }

        let validatedRequiredInputs = getInputs(requiredInputs, source);
        let validatedOptionalInputs = getInputs(optionalInputs, source);

        if (inputsWereValid(validatedRequiredInputs)) {
            executor(req, res, validatedRequiredInputs, validatedOptionalInputs).then(
                response => {
                    res.status(response.status).send(response.message);
                },
                err => {
                    let status = err.status ? err.status : 500;
                    res.status(status).send(err.message);
                }
            );
        } else {
            handleInvalidInputsMessage(req, res, validatedRequiredInputs);
        }

    } catch (e) {
        utils.errLogger(req.originalUrl, e.message);
        res.status(500).send(utils.returnMessaging(req.originalUrl, 'Internal Server Error', e.message));
    }
}

function getInputs(inputs, inputLocation) {

    if (utils.isNullOrEmpty(inputs)) {
        inputs = [];
    }
    if (!(inputs instanceof Array)) {
        inputs = [inputs]
    }

    const inputsVals = {};
    inputs.forEach((input) => {
        if (!utils.isNullorUndefined(inputLocation[input.name])) {
            var validator = utils.validateInputs[input.type];
            if (typeof(validator) == 'function') {
                inputsVals[input.name] = validator(inputLocation[input.name]);
                inputsVals[input.name].type = input.type;
            } else {
                utils.errLogger(`commonResponseHandler`, 'invalid input type', `${input.name}, ${input.type}`)
                inputsVals[input.name] = {
                    type: input.type,
                    valid: false
                }
            }
        } else {
            inputsVals[input.name] = {
                type: input.type,
                valid: false
            }
        }
    });
    return inputsVals;

}

function inputsWereValid(inputs) {
    let valid = true;
    _.forEach(inputs, (v, k) => {
        valid = valid && v.valid;
    });
    return valid;
}

function handleInvalidInputsMessage(req, res, inputs) {
    let message = '';
    _.forEach(inputs, (v, k) => {
        if (!v.valid) {
            message += ` ${k} - (${v.type}) parameter is required `;
        }
    });
    res.status(500).send(utils.returnMessaging(req.originalUrl, message));
}

function returnInvalidInputsMessage(req, inputs, optionals) {
    let response = {};
    let message = '';
    let andor = optionals ? ' or ' : ' and '
    let ind = 1;
    _.forEach(inputs, (v, k) => {
        if (!v.valid) {
            message += ` ${k} - (${v.type}) parameter is required `;
            if (ind < Object.keys(inputs).length) {
                message += andor;
                ind++;
            }
        }
    });
    response.status = 500;
    response.message = utils.returnMessaging(req.originalUrl, message);
    return response;
}

function requireOneInput(inputs) {
    let valid = false;
    _.forEach(inputs, (v, k) => {
        valid = valid || v.valid;
    });
    return valid;
}

module.exports = {
    commonResponseHandler,
    inputsWereValid,
    returnInvalidInputsMessage,
    requireOneInput
};