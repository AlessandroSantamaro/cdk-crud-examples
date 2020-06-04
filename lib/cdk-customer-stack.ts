import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
const AWS = require('aws-sdk');

export class CdkUserStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Set region
    const dynamoDbRegion = 'eu-west-1';
    AWS.config.region = dynamoDbRegion;

    // Set common layer
    const layer = new lambda.LayerVersion(this, 'CommonsLayer', {
      code: lambda.Code.fromAsset('layer/CommonsLayer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_12_X],
      license: 'Apache-2.0',
      description: 'A layer to test',
    });

    // Set table
    const table = new dynamodb.Table(this, 'CDK_CUSTOMER', {
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING }
    });

    // Define GET api
    const getNodeItem = new lambda.Function(this, 'GetLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'get-item.handler',
      layers: [layer],
      environment: {
        dynamoDbRegion,
        USER_TABLE_NAME: table.tableName
      }
    });

    const getApi = new apigw.LambdaRestApi(this, 'user', {
      handler: getNodeItem,
      proxy: false
    });

    const users = getApi.root.addResource('users');
    const username = users.addResource('{username}');
    username.addMethod('GET'); // GET /users/{username}

    table.grantReadData(getNodeItem);

    // Define PUT api
    const putNodeItem = new lambda.Function(this, 'PutLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'put-item.handler',
      layers: [layer],
      environment: {
        dynamoDbRegion,
        USER_TABLE_NAME: table.tableName
      }
    });

    const putApi = new apigw.LambdaRestApi(this, 'add', {
      handler: putNodeItem,
      proxy: false
    });

    const add = putApi.root.addResource('add');
    add.addMethod('POST');  //POST /add
    table.grantFullAccess(putNodeItem);

    // Define DELETE api
    const deleteNodeItem = new lambda.Function(this, 'DeleteLambdaHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'delete-item.handler',
      layers: [layer],
      environment: {
        dynamoDbRegion,
        USER_TABLE_NAME: table.tableName
      }
    });

    const deleteApi = new apigw.LambdaRestApi(this, 'delete', {
      handler: deleteNodeItem,
      proxy: false
    });

    const deletePath = deleteApi.root.addResource('delete');
    deletePath.addMethod('DELETE');
    const deleteResource = deletePath
      .addResource('{username}')
      .addMethod('DELETE'); // DELETE /delete/{username}

    table.grantFullAccess(deleteNodeItem);
  }
}

