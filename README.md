# Beta - Amazon Bedrock Minecraft Agent (TypeScript)

    Note: This project is in beta, so expect glitches to be found and improvements to be made! We have released this code now in response to the huge amount of interest in this project.  Thank you and please continue to send your feedback and suggestions.

This project is a Minecraft bot built using the Agents for Amazon Bedrock framework, written in TypeScript. It demonstrates how to create an agent that can interact with the Minecraft world using the Return Control Agents.

![Rocky the Amazon Bedrock Minecraft Agent](images/rocky.png)

## Introduction

The Amazon Bedrock Minecraft Agent is a TypeScript implementation of an agent that can be used to automate tasks and interactions within the Minecraft world. It leverages the [Mineflayer](https://github.com/PrismarineJS/mineflayer) library, which provides a high-level interface for interacting with the Minecraft game engine.

## As Seen On 
- AWS Developers Live Stream: https://www.youtube.com/live/sn5cUf022ek?si=aukSxnQRbliT5jjS&t=8656

## Installation and Usage

To install this solution in it's current (beta) state, it's recommended that you have some knowledge of:  
- Amazon Bedrock
- AWS CloudFormation
- AWS Cloud Development Kit (CDK) - If hosting in ECS.

Additionally you will require a Minecraft client, with version `1.20.1`, and an account to play.

Steps to deploy: 
- Working in us-west-2 (Oregon)
- From the Amazon Bedrock console page, enable access to Claude 3 Haiku, and Sonnet models.
- Using AWS CloudFormation, deploy the template `agent_cfn/amazon-bedrock-minecraft-agent-roc.yaml` to a stack.
- Note the outputs from the deployed stack `agentId` and `agentAliasId`.

### Using the agent is local dev and test:

Usage:
- Launch Minecraft v1.20.1, start a single player (local) game and in the game, use "Open to LAN" and set the port to `25565`.
- From the `agent_ts/` folder, open a terminal, install the node packages as required `npm install`.
- Update the config, either by setting environment variables, OR editing `agent_ts/.env` OR by editing `agent_ts/config.ts`.  Set the `agentId` and the `agentAliasId` to values output from the agent CloudFormation stack.
- Run the TypeScript code in `agent_ts/` with `npm run start:dev`
- Interact with Rocky in game by using the in game chat, pressing `t`.  Try "hello", "come to me" and "dig a 2 by 2 hole".  Watch the debug output in the terminal you are running from. 

## Installation and Usage - Cloud Hosted (ECS)

This repo also contains a CDK stack that will deploy the agent client code to a task (container) within ECS. **You should only consider using this if you are familiar with the technology and running a Minecraft server.** Review the code carefully and at a minimum note:
- Security Risks: The Minecraft server deployed is publicly accessible, and since the server does not verify usernames, anyone can join with any username, including ones that are already taken by other players. This can lead to impersonation and griefing.
- Server Control: Currently the RCON port is not available on the server, so there is no admin access.  This will be addressed in the future. 

Steps to deploy: 
- From the `cdk/` folder, open a terminal, install the node packages as required `npm install`.
- Deploy the CDK project from `cdk/` using context variables `agentId` and `agentAliasId`, e.g.:

```
> cdk deploy --conetxt agentAliasID=ABC123 --context agentID=XYZ321
```

Usage:
- Launch Minecraft v1.20.1.
- Select `Multiplayer` and select `Add Server`.
- Enter the address of the Network LoadBalancer that was deployed by CDK, using port `:25565`. 
- Interact with Rocky in game by using the in game chat, pressing `t`.  Try "hello", "come to me" and "dig a 2 by 2 hole".  Watch the debug output in the terminal you are running from. 

# A Bit about the Technology 

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