#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CraterAwsCdkStack } from '../lib/crater-aws-cdk-stack';

const app = new cdk.App();
new CraterAwsCdkStack(app, 'CraterAwsCdkStack', {
    env: {
        account: "676592238803",
        region: "eu-west-1",
    }
});
