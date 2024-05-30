"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockBot = void 0;
const client_bedrock_agent_runtime_1 = require("@aws-sdk/client-bedrock-agent-runtime");
/**
 * Class representing a Bedrock bot.
 */
class BedrockBot {
    /**
     * Creates a new instance of the BedrockBot class.
     * @param functionHandler The function handler instance.
     */
    constructor(functionHandler, config) {
        // this.logger = new Logger();
        this.logger = console;
        this.bedrockAgentRuntimeClient = new client_bedrock_agent_runtime_1.BedrockAgentRuntimeClient({ region: 'us-west-2' });
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
    setChatCallback(callback) {
        this.chatCallback = callback;
    }
    /**
     * Sets the session ID.
     * @param sessionId The session ID.
     */
    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }
    /**
     * Chats with the agent using the given prompt.
     * @param prompt The prompt to send to the agent.
     * @returns A promise that resolves to a boolean indicating the success of the operation.
     */
    chatWithAgent(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('chatWithAgent');
            this.logger.info(`PROMPT: ${prompt}`);
            const response = yield this.invokeAgent(prompt);
            return response;
        });
    }
    /**
     * Invokes the agent with the given input text and session state.
     * @param inputText The input text to send to the agent (optional).
     * @param sessionState The session state to pass to the agent (optional).
     * @returns A promise that resolves to a boolean indicating the success of the operation.
     */
    invokeAgent(inputText, sessionState) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('invokeAgent');
            try {
                const input = {
                    agentId: this.agentId,
                    agentAliasId: this.agentAliasId,
                    sessionId: this.sessionId,
                    inputText: inputText,
                    sessionState: sessionState,
                };
                this.logger.info('INPUT: ', input);
                const command = new client_bedrock_agent_runtime_1.InvokeAgentCommand(input);
                this.logger.info('COMMAND: ', command);
                const response = yield this.bedrockAgentRuntimeClient.send(command);
                this.logger.info('RESPONSE: ', response);
                const processedResponse = yield this.processResponse(response);
                return processedResponse;
            }
            catch (error) {
                console.error('Error invoking agent:', error);
                // Add additional error handling logic here, such as retrying the operation or providing a fallback response
                return false;
            }
        });
    }
    /**
     * Processes the response from the agent.
     * @param response The response received from the agent.
     * @returns A promise that resolves to a boolean indicating the success of the operation.
     */
    processResponse(response) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            this.logger.info('processResponse');
            let completion = '';
            let returnControlData = null;
            const processEvent = (event) => {
                if ('chunk' in event && event.chunk) {
                    const chunk = event.chunk;
                    if ('bytes' in chunk) {
                        completion += new TextDecoder().decode(chunk.bytes);
                    }
                }
                if ('returnControl' in event) {
                    returnControlData = event.returnControl;
                }
            };
            const readable = response.completion;
            try {
                for (var _d = true, readable_1 = __asyncValues(readable), readable_1_1; readable_1_1 = yield readable_1.next(), _a = readable_1_1.done, !_a; _d = true) {
                    _c = readable_1_1.value;
                    _d = false;
                    const event = _c;
                    processEvent(event);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = readable_1.return)) yield _b.call(readable_1);
                }
                finally { if (e_1) throw e_1.error; }
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
                yield this.handleReturnControl(processed.returnControlData);
            }
            return true;
        });
    }
    /**
     * Handles the return control data received from the agent.
     * @param returnControlData The return control data to handle.
     * @returns A promise that resolves to a boolean indicating the success of the operation.
     */
    handleReturnControl(returnControlData) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('handleReturnControl');
            this.logger.info(`return_control_data: ${JSON.stringify(returnControlData, null, 2)}`);
            const functionInvocationInput = returnControlData.invocationInputs[0].functionInvocationInput;
            const actionGroup = functionInvocationInput.actionGroup;
            const functionName = functionInvocationInput.function;
            const parameters = functionInvocationInput.parameters;
            const [result, responseState] = yield this.functionHandler.callFunction(functionName, parameters);
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
            return yield this.invokeAgent(undefined, sessionState);
        });
    }
}
exports.BedrockBot = BedrockBot;
