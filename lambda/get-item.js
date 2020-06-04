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
        "file": "get-item.js"
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
  await commonFunctions.getItemById(params, process.env.dynamoDbRegion, (data) => {
    if (data && data.data && (data.data.user || data.data.user === null)) {
      const isUserFull = Object.keys(data.data.user).length !== 0;
      const bodyResponse = {
        message: username + (isUserFull ? " already exist" : " is a new user"),
        data: isUserFull ? data.data.user : null
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
        "function": "callbackGet()",
        "file": "get-item.js"
      },
      message: data && data.errors && data.errors.message ? data.errors.message : "Generic error"
    }
    callback(JSON.stringify(myErrorObj));
  });
};
