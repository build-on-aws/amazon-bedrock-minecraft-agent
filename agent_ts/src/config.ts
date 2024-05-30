/**
 * Agent Config 
 * 
 * Loads in config values from environment variables else uses default values
 * Also discovers the id of the latest agent alias given an Amazon Bedrock Agent.
 * 
 */

import { BedrockAgentClient, ListAgentAliasesCommand } from "@aws-sdk/client-bedrock-agent"; // ES Modules import

export interface Config {

    mcHost: string;
    mcUsername: string;
    mcAuth: string;
    mcPort: number;
    mcVersion: string;
  
    agentId: string;
    agentAliasId: string;
  
  }

  // NOT GETTING THE VALUES YOU EXPECT? SEE THE ORDER OF CONFIG LOAD:
  // 1. Environment variables
  // 2. .env file
  // 3. Default values here...

  export const loadConfig = async (): Promise<Config> => {
    const config: Config = {
      mcHost: process.env.MC_HOST || '127.0.0.1',
      mcUsername: process.env.MC_USERNAME || 'Rocky',
      mcAuth: process.env.MC_AUTH || 'offline',
      mcPort: parseInt(process.env.MC_PORT || '25565', 10),
      mcVersion: process.env.MC_VERSION || "1.20.1",
      agentId: process.env.AGENT_ID || "123123",
      agentAliasId: process.env.AGENT_ALIAS_ID || "123123"
    };
    
    return config;
  };

