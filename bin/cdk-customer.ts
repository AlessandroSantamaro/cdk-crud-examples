#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { CdkCustomerStack } from '../lib/cdk-customer-stack';

const app = new cdk.App();
new CdkCustomerStack(app, 'CdkCustomerStack');
