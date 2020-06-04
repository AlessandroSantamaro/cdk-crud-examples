const commonFunctions = require('commons');

exports.handler = async function (event, context, callback) {
    let username;
    if (event.body) {
        body = JSON.parse(event.body)
        if (body.username)
            username = body.username;
    }
    if (!username) {
        console.log("No username");
        const myErrorObj = {
            errorType: "UnprocessableEntity",
            httpStatus: 422,
            requestId: context.awsRequestId,
            trace: {
                "function": "handler()",
                "file": "put-item.js"
            },
            message: "No username"
        }
        callback(JSON.stringify(myErrorObj));
    }

    const params = {
        Key: {
            username: {
                S: username
            }
        },
        TableName: process.env.USER_TABLE_NAME
    };
    let isUserExist;
    const dynamoDbRegion = process.env.dynamoDbRegion;
    await commonFunctions.getItemById(params, dynamoDbRegion, async (data) => {
        if (data && data.data && (data.data.user || data.data.user === null)) {
            isUserExist = Object.keys(data.data.user).length !== 0;
            if (isUserExist) {
                const bodyResponse = {
                    message: username + " already exist"
                }
                callback(null, {
                    "statusCode": 200,
                    "body": JSON.stringify(bodyResponse)
                });

            }

        } else {
            const myErrorObj = {
                errorType: "InternalServerError",
                httpStatus: 500,
                requestId: context.awsRequestId,
                trace: {
                    "function": "putCallback()",
                    "file": "put-item.js"
                },
                message: data && data.errors && data.errors.message ? data.errors.message : "Generic error"
            }
            callback(JSON.stringify(myErrorObj));
        }
    });

    if (!isUserExist) {
        const params = {
            TableName: process.env.USER_TABLE_NAME,
            Item: {
                'username': {
                    S: username
                }
            }
        };
        await commonFunctions.addItemById(params, dynamoDbRegion, (data) => {
            if (data && data.data && data.data.isAdded) {
                const bodyResponse = {
                    message: username + " is added"
                }
                callback(null, {
                    "statusCode": 200,
                    "body": JSON.stringify(bodyResponse)
                });
            }

            const myErrorObj = {
                errorType: "InternalServerError",
                httpStatus: 500,
                requestId: context.awsRequestId,
                trace: {
                    "function": "putCallback()",
                    "file": "put-item.js"
                },
                message: data && data.errors && data.errors.message ? data.errors.message : "Generic error"
            }
            callback(JSON.stringify(myErrorObj));
        });
    }
}
