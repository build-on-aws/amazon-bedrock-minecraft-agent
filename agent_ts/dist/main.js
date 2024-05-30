"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bedrock_bot_1 = require("./bedrock-bot");
const function_handler_1 = require("./function-handler");
const config_1 = require("./config");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder');
const collectblock = require('mineflayer-collectblock').plugin;
function generateUuid() {
    // Generate a random hexadecimal string
    const randomHex = Math.random().toString(16).slice(2);
    // Construct the UUID pattern
    const uuid = `${randomHex.slice(0, 8)}-${randomHex.slice(8, 12)}-${randomHex.slice(12, 16)}-${randomHex.slice(16, 20)}-${randomHex.slice(20)}`;
    return uuid;
}
let mcBot;
let bedrockBot;
function startBot() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const config = yield (0, config_1.loadConfig)();
            console.log('Starting bot...', config);
            mcBot = mineflayer.createBot({
                host: config.mcHost,
                username: config.mcUsername,
                auth: config.mcAuth,
                port: config.mcPort,
                version: config.mcVersion
            });
            const functionHandler = new function_handler_1.MyFunctionHandler(mcBot);
            bedrockBot = new bedrock_bot_1.BedrockBot(functionHandler, config);
            // Set the chat callback
            bedrockBot.setChatCallback(handleChatMessage);
            // Set the session ID to a random GUID
            const uuid = generateUuid;
            bedrockBot.setSessionId(uuid());
            mcBot.once('spawn', initializeBot);
            mcBot.on('chat', handleChatCommands);
        }
        catch (error) {
            console.error('Error starting the bot:', error);
            // Handle the error appropriately
        }
    });
}
startBot();
// Chat callback implementation
function handleChatMessage(message) {
    console.log(`Received chat message: ${message}`);
    mcBot.chat(`${message}`);
}
function initializeBot() {
    mcBot.loadPlugin(pathfinder);
    mcBot.loadPlugin(collectblock);
    const defaultMove = new Movements(mcBot);
    defaultMove.allow1by1towers = true; // Do not build 1x1 towers when going up
    defaultMove.canDig = true; // Disable breaking of blocks when pathing 
    defaultMove.scafoldingBlocks.push(mcBot.registry.itemsByName['acacia_slab'].id); // Add nether rack to allowed scaffolding items
    mcBot.pathfinder.setMovements(defaultMove); // Update the movement instance pathfinder uses
    console.log('Bot spawned');
}
function handleChatCommands(username, message) {
    return __awaiter(this, void 0, void 0, function* () {
        mcBot.time = 6000;
        if (username === mcBot.username)
            return;
        switch (message) {
            case 'reset':
                const uuid = generateUuid;
                bedrockBot.setSessionId(uuid());
                mcBot.chat('Session reset');
                break;
            default:
                const prompt = `${username} says: ${message}`;
                yield bedrockBot.chatWithAgent(prompt);
        }
    });
}
