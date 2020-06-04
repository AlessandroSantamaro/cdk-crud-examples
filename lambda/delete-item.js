const commonFunctions = require('commons');

exports.handler = async function (event, context, callback) {
    const username = ((event || {}).pathParameters || {}).username;
    if (!username) {
        console.log("No username");
        const myErrorObj = {
            errorType: "UnprocessableEntity",
            httpStatus: 422,
            requestId: context.awsRequestId,
            trace: {
                "function": "handler()",
                "file": "delete-item.js"
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
    let isUserEmpty;
    await commonFunctions.getItemById(params, process.env.dynamoDbRegion, async (data) => {
        if (data && data.data && (data.data.user || data.data.user === null)) {
            isUserEmpty = Object.keys(data.data.user).length === 0;
            if (isUserEmpty) {
                const bodyResponse = {
                    message: username + " doesn't exists"
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

    if (!isUserEmpty) {
        const params = {
            Key: {
                'username': {
                    S: username
                }
            },
            TableName: process.env.USER_TABLE_NAME
        };
        await commonFunctions.deleteItemById(params, process.env.dynamoDbRegion, (data) => {
            if (data && data.data && data.data.isDeleted) {
                const bodyResponse = {
                    message: username + " is deleted"
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
                    "function": "deleteUserCallbackhandler()",
                    "file": "delete-item.js"
                },
                message: data && data.errors && data.errors.message ? data.errors.message : "Generic error"
            }
            callback(JSON.stringify(myErrorObj));
        });
    }

}
