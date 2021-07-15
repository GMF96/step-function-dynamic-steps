const express = require('express');
const app = express();
const aws = require('aws-sdk');
const request = require('request');
const { v4: uuidv4 } = require('uuid');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(function (req, res, next) {
    res.setHeader("Content-Type", "application/json");
    next();
});

app.post('/start', (req, res) => {

    let customer_id = req.header("Customer_Id");
    let payload = req.body;
    let finalResponse = "";

    try {
        const workflow_id = uuidv4();
        startStepFunction(customer_id, payload, workflow_id);
        finalResponse = {
            statusCode: 200,
            body: JSON.stringify({
                message: `Workflow started: ${workflow_id}`
            })
        }
    } catch (e) {
        finalResponse = {
            statusCode: 500,
            body: JSON.stringify({
                message: 'There was an error'
            })
        }
        console.error(e);
    }
    
    res.send(finalResponse);
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});

async function startStepFunction(customer_id, payload, workflow_id) {

    let url = `http://localhost:8080/configuration/${customer_id}`;

    const configuration = await callConfig(url)

    let jsonConfig = JSON.parse(configuration);

    let internalSteps = jsonConfig.steps;

    payload.workflow["steps"] = internalSteps;
    payload.workflow["next_step"] = internalSteps[0];

    var params = {
        stateMachineArn: 'arn:aws:states:us-east-1:000000000000:stateMachine:DynamicSteps',
        name: workflow_id,
        input: JSON.stringify(payload)
    };

    console.log(params);

    var stepfunctions = new aws.StepFunctions({ region: 'us-east-1', endpoint: 'http://localhost:4566' })

    stepfunctions.startExecution(params, (err, data) => {
        if (err) {
            throw new Error(`Error invoking step function: ${err}`);
        } else {
            console.log(data);
        }
    });
}

function callConfig(url) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) {
                reject(error)
            };
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            resolve(body);
        });
    });
}