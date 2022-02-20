#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { GreengrassStack } from '../lib/greengrass-stack';
import { GreengrassLambdaStack } from '../lib/greengrass-lambda-stack';

const app = new cdk.App();

const lambdaStack = new GreengrassLambdaStack(app, 'GreengrassLambdaStack');
new GreengrassStack(app, 'GreengrassStack', {
  greengrassLambdaAlias: lambdaStack.greengrassLambdaAlias,
  greengrassCoreCertArn: process.env.GREENGRASS_CORE_CERT_ARN!
});
