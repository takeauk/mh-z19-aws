#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { GreengrassStack } from '../lib/greengrass-stack';
import { GreengrassLambdaStack } from '../lib/greengrass-lambda-stack';
import { CloudWatchStack } from '../lib/cloud-watch-stack';

const app = new cdk.App();

const lambdaStack = new GreengrassLambdaStack(app, 'GreengrassLambdaStack');

new GreengrassStack(app, 'GreengrassStack', {
  greengrassLambdaAlias: lambdaStack.greengrassLambdaAlias,
  greengrassCoreCertArn: process.env.GREENGRASS_CORE_CERT_ARN!
});

const cloudWatchStack = new CloudWatchStack(app, 'CloudWatchStack', {
  notificationSlackWorkspaceId: process.env.NOTIFICATION_SLACK_WORKSPACE_ID!,
  notificationSlackChannelId: process.env.NOTIFICATION_SLACK_CHANNEL_ID!
});