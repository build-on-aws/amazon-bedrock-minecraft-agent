#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServerStack } from '../lib/server-stack';
//import { AgentStack } from '../lib/agent-stack';

const app = new cdk.App();
const serverStack = new ServerStack(app, 'ServerStack', {
});

//const agentStack = new AgentStack(app, 'AgentStack', {
 // inject props here 

//});