# Beta - Amazon Bedrock Minecraft Agent (TypeScript)

This project is a Minecraft bot built using the Agents for Amazon Bedrock framework, written in TypeScript. It demonstrates how to create an agent that can interact with the Minecraft world using the Return Control Agents.

## Introduction

The Amazon Bedrock Minecraft Agent is a TypeScript implementation of an agent that can be used to automate tasks and interactions within the Minecraft world. It leverages the [Mineflayer](https://github.com/PrismarineJS/mineflayer) library, which provides a high-level interface for interacting with the Minecraft game engine.

## As Seen On 
- AWS Developers Live Stream: https://www.youtube.com/live/sn5cUf022ek?si=aukSxnQRbliT5jjS&t=8656

## Installation and Usage - Local Dev and Test

To install this solution in it's current state (beta) you should have knowledge of:  
- Amazon Bedrock
- AWS CloudFormation

Steps to deploy: 
- Working in us-west-2:
- In Amazon Bedrock, enable access to Claude 3 Haiku, and Sonnet.
- Deploy the CloudFormation stack `agent_cfn/amazon-bedrock-minecraft-agent-roc.yaml`.

Usage:
- You will require a Minecraft client, with version `1.20.1`.
- Launch Minecraft, start a local game and open the LAN port to `25565`
- Run the TypeScript code in `agent_ts/` with `npm run start:dev`
- Interact with Rocky in game.

## Installation and Usage - Fully Cloud Hosted

To install this solution in it's current state (beta) you should have knowledge of:  
- Amazon Bedrock
- AWS CloudFormation
- AWS Cloud Development Kit (CDK)

Steps to deploy: 
- Working in us-west-2:
- In Amazon Bedrock, enable access to Claude 3 Haiku, and Sonnet.
- Deploy the CloudFormation stack `agent_cfn/amazon-bedrock-minecraft-agent-roc.yaml`.
- Note the outputs from the deployed stack `agentId` and `agentAliasId`.
- Deploy the CDK project from `cdk/` using context variables `agentId` and `agentAliasId`, e.g.:
    - `cdk deploy --context agentAliasID=ABC123 --context agentID=XYZ321`

Usage:
- You will require a Minecraft client, with version `1.20.1`.
- Launch Minecraft, connect the client to the Network LoadBalancer deployed by CDK. 
- Interact with Rocky in game.

## Return Control
"Rather than sending the information that your agent has elicited from the user to a Lambda function for fulfillment, you can instead choose to return control to the agent developer by sending the information in the InvokeAgent response."


## Mineflayer Library

The Minelayer library is a powerful tool for building Minecraft agents and automating tasks within the game world. It provides a set of classes and functions that abstract away low-level details, making it easier to develop complex behaviors and interactions.

## Disclaimers

This project is a proof of concept and is not intended for production use. It is provided as an example of how to build return control agents using the Agents for Amazon Bedrock framework and the Minelayer library.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.