/**
 * This code defines a BedrockBot class that interacts with the Amazon Bedrock Agent Runtime to
 * enable a Return Control functionality. The class handles invoking the agent, processing the
 * agent's responses, and managing the chat session. It also provides a way to set a chat
 * callback function to handle incoming chat messages. The class relies on a FunctionHandler
 * implementation to execute specific functions on behalf of the agent's Return Control messages.
 */

import { 
  BedrockAgentRuntimeClient, 
  InvokeAgentCommand, 
  InvokeAgentCommandInput, 
  InvokeAgentCommandOutput 
} from "@aws-sdk/client-bedrock-agent-runtime";
import { Readable } from 'stream';
import { MyFunctionHandler } from './action-handler';
import { Config } from './config';

/**
 * Interface representing a function handler.
 */
interface FunctionHandler {
  /**
   * Calls a function with the given name and parameters.
   * @param functionName The name of the function to call.
   * @param parameters The parameters to pass to the function.
   * @returns A tuple containing the result and response state.
   */
  callFunction(functionName: string, parameters: any): Promise<[any, any]>;
}

/**
 * Interface representing a chat callback function.
 */
interface ChatCallback {
  /**
   * Callback function for handling chat messages.
   * @param message The chat message to handle.
   */
  (message: string): void;
}

/**
 * Class representing a Bedrock bot.
 */
export class BedrockBot {
  // private readonly logger: Logger;
  private readonly logger: Console;
  private readonly bedrockAgentRuntimeClient: BedrockAgentRuntimeClient;
  private readonly agentAliasId: string;
  private readonly agentId: string;
  private readonly functionHandler: MyFunctionHandler;
  private sessionId: string | null;
  private chatCallback: ChatCallback | null;

  /**
   * Creates a new instance of the BedrockBot class.
   * @param functionHandler The function handler instance.
   */
  constructor(functionHandler: MyFunctionHandler, config: Config) {
    this.logger = console;
    this.bedrockAgentRuntimeClient = new BedrockAgentRuntimeClient({ region: 'us-west-2' });
    this.agentAliasId = config.agentAliasId;
    this.agentId = config.agentId;
    this.functionHandler = functionHandler;
    this.sessionId = null;
    this.chatCallback = null;
  }

  /**
   * Sets the chat callback function.
   * @param callback The chat callback function.
   */
  public setChatCallback(callback: ChatCallback): void {
    this.chatCallback = callback;
  }

  /**
   * Sets the session ID.
   * @param sessionId The session ID.
   */
  public setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Chats with the agent using the given prompt.
   * @param prompt The prompt to send to the agent.
   * @returns A promise that resolves to a boolean indicating the success of the operation.
   */
  public async chatWithAgent(prompt: string): Promise<boolean> {
    this.logger.info('chatWithAgent');
    this.logger.info(`PROMPT: ${prompt}`);

    const response = await this.invokeAgent(prompt);

    return response;
  }

  /**
   * Invokes the agent with the given input text and session state.
   * @param inputText The input text to send to the agent (optional).
   * @param sessionState The session state to pass to the agent (optional).
   * @returns A promise that resolves to a boolean indicating the success of the operation.
   */
  private async invokeAgent(inputText?: string, sessionState?: any): Promise<boolean> {

    this.logger.info('invokeAgent');

    try {
      const input: InvokeAgentCommandInput = {
        agentId: this.agentId,
        agentAliasId: this.agentAliasId,
        sessionId: this.sessionId as string,
        inputText: inputText,
        sessionState: sessionState,
      };

      this.logger.debug('INPUT: ', input);
  
      const command = new InvokeAgentCommand(input);
      this.logger.debug('COMMAND: ', command);

      const response: InvokeAgentCommandOutput = await this.bedrockAgentRuntimeClient.send(command);
      this.logger.debug('RESPONSE: ', response);

      const processedResponse = await this.processResponse(response);
      return processedResponse;

    } catch (error) {
      console.error('Error invoking agent:', error);
      // Add additional error handling logic here, such as retrying the operation or providing a fallback response
      return false;
    }
  }
  

  /**
   * Processes the response from the agent.
   * @param response The response received from the agent.
   * @returns A promise that resolves to a boolean indicating the success of the operation.
   */
  private async processResponse(response: InvokeAgentCommandOutput): Promise<boolean> {
    this.logger.info('processResponse');
  
    let completion = '';
    let returnControlData: any = null;
  
    const processEvent = (event: any) => {
      if ('chunk' in event && event.chunk) {
        const chunk = event.chunk;
        if ('bytes' in chunk) {
          completion += new TextDecoder().decode(chunk.bytes as Uint8Array);
        }
      }
      if ('returnControl' in event) {
        returnControlData = event.returnControl;
      }
    };
  
    const readable = response.completion as unknown as Readable;
  
    for await (const event of readable) {
      processEvent(event);
    }
  
    const processed = {
      streamedData: completion,
      returnControlData: returnControlData,
    };
  
    if (processed.streamedData && this.chatCallback) {
      this.logger.info(`chat_message: ${processed.streamedData}`);
      this.chatCallback(processed.streamedData);
    }
  
    if (processed.returnControlData) {
      this.logger.info(`return_control_data: ${JSON.stringify(processed.returnControlData, null, 2)}`);
      await this.handleReturnControl(processed.returnControlData);
    }
  
    return true;
  }

  /**
   * Handles the return control data received from the agent.
   * @param returnControlData The return control data to handle.
   * @returns A promise that resolves to a boolean indicating the success of the operation.
   */
  private async handleReturnControl(returnControlData: any): Promise<boolean> {
    this.logger.info('handleReturnControl');
    this.logger.info(`return_control_data: ${JSON.stringify(returnControlData, null, 2)}`);
  
    const functionInvocationInput = returnControlData.invocationInputs[0].functionInvocationInput;
  
    const actionGroup = functionInvocationInput.actionGroup;
    const functionName = functionInvocationInput.function;
    const parameters = functionInvocationInput.parameters;
  
    const [result, responseState] = await this.functionHandler.callFunction(functionName, parameters);
  
    const responseBody = {
      TEXT: {
        body: JSON.stringify(result),
      },
    };
  
    const sessionState = {
      invocationId: returnControlData.invocationId,
      returnControlInvocationResults: [
        {
          functionResult: {
            actionGroup: actionGroup,
            function: functionName,
            responseBody: responseBody,
            responseState: responseState,
          },
        },
      ],
    };
  
    this.logger.info(`Session state: ${JSON.stringify(sessionState, null, 2)}`);
  
    return await this.invokeAgent(undefined, sessionState);
  }
}