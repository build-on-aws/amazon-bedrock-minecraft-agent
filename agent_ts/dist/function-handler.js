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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyFunctionHandler = void 0;
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder');
const { Vec3 } = require('vec3');
class MyFunctionHandler {
    constructor(mcBot) {
        this.mcBot = mcBot;
    }
    callFunction(functionName, parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            const unpackedParams = {};
            for (const param of parameters) {
                const { name, type, value } = param;
                switch (type) {
                    case 'number':
                        unpackedParams[name] = Number(value);
                        break;
                    case 'string':
                        unpackedParams[name] = value;
                        break;
                    // Add more cases for other types if needed
                    default:
                        throw new Error(`Unsupported parameter type: ${type}`);
                }
            }
            switch (functionName) {
                case 'action_get_time':
                    return this.action_get_time(unpackedParams);
                case 'action_jump':
                    return this.action_jump(unpackedParams);
                case 'action_dig':
                    return yield this.action_dig(unpackedParams);
                case 'action_is_raining':
                    return this.action_is_raining(unpackedParams);
                case 'action_get_player_location':
                    return this.action_get_player_location(unpackedParams);
                case 'action_move_to_location':
                    return yield this.action_move_to_location(unpackedParams);
                case 'action_get_distance_between_to_entities':
                    return this.action_get_distance_between_to_entities(unpackedParams);
                default:
                    throw new Error(`Unknown function: ${functionName}`);
            }
        });
    }
    /*
    This function is used to get the time.
    It takes in the name parameter and uses it to determine the time.
    */
    action_get_time(parameters) {
        // get server time as string:
        const time = new Date().toLocaleTimeString();
        const responseBody = { "time": time };
        const responseState = 'REPROMPT';
        return [responseBody, responseState];
    }
    /*
    This function is used to jump the bot.
    It takes in the name parameter and uses it to determine the jump height.
    */
    action_jump(parameters) {
        this.mcBot.setControlState('jump', true);
        setTimeout(() => {
            this.mcBot.setControlState('jump', false);
        }, 1000);
        const responseBody = { "message": "Jumping" };
        const responseState = 'REPROMPT';
        return [responseBody, responseState];
    }
    /*
    This function is used to dig a circle with a specified radius and depth.
    It takes in the radius and depth as parameters and uses them to create a circular hole.
    It then digs the blocks within the circular area.
    */
    action_dig(parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { depth, width } = parameters;
            console.log('Depth:', depth);
            console.log('Width:', width);
            this.mcBot.entity.pitch = -1; // Look down...
            const block = this.mcBot.blockAtCursor(256); // Retrieve the block that the bot is currently targeting
            // console.log('Target block:', block.name);
            try {
                // Loop to dig a circular hole with a specified radius and depth
                for (let y = 0; y > -depth; y--) {
                    for (let x = -width; x <= width; x++) {
                        for (let z = -width; z <= width; z++) {
                            if (x * x + z * z <= width * width) { // Check if the block is within the circular area
                                const targetBlock = this.mcBot.blockAt(block.position.offset(x, y, z));
                                console.log('Target block:', targetBlock.position);
                                if (targetBlock && targetBlock.diggable) {
                                    yield this.mcBot.dig(targetBlock);
                                }
                                else {
                                    console.log('Block not found or not diggable:', targetBlock.name);
                                }
                            }
                        }
                    }
                }
            }
            catch (err) {
                console.error('Error during circle digging operation:', err);
            }
            const responseBody = { "message": "Done digging." };
            const responseState = 'REPROMPT';
            return [responseBody, responseState];
        });
    }
    action_is_raining(parameters) {
        const result = this.mcBot.isRaining;
        const responseBody = { "isRaining": result };
        const responseState = 'REPROMPT';
        return [responseBody, responseState];
    }
    /*
    This function is used to get the location of a player.
    It takes in the name parameter and uses it to determine the player's location.
    */
    action_get_player_location(parameters) {
        console.log('Getting player (player_name) location.');
        // console.log(parameters);
        const playerName = parameters.player_name;
        const player = this.mcBot.players[playerName];
        // console.log('Player:', player);
        const pos = player.entity.position;
        // console.log('Player location:', pos);
        const responseBody = { "location": { "x": pos.x, "y": pos.y, "z": pos.z } };
        const responseState = 'REPROMPT';
        return [responseBody, responseState];
    }
    /*
    This function is used to move the bot to a specified location.
    It takes in the x, y, and z parameters and uses them to determine the target location.
    */
    action_move_to_location(parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { location_x, location_y, location_z } = parameters;
            // console.log('location_x:', location_x);
            // console.log('location_y:', location_y);
            // console.log('location_z:', location_z);
            yield this.mcBot.pathfinder.setGoal(new GoalNear(location_x, location_y, location_z, 1));
            const responseBody = { "message": "Moving to location, please wait." };
            const responseState = 'REPROMPT';
            return [responseBody, responseState];
        });
    }
    /*
    This function is used to get the distance between two entities.
    It takes in the location_1 and location_2 parameters and uses them to determine the distance.
    */
    action_get_distance_between_to_entities(parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Getting the distance between two entities.");
            console.log(parameters);
            try {
                // Parse location from JSON string
                const location_1 = JSON.parse(parameters.location_1); // [x, y, z]
                const location_2 = JSON.parse(parameters.location_2); // [x, y, z]
                // Check if location_1 and location_2 are arrays with 3 elements
                if (!Array.isArray(location_1) || location_1.length !== 3 || !Array.isArray(location_2) || location_2.length !== 3) {
                    throw new Error("Invalid location format");
                }
                // Calculate the Euclidean distance between the two entities
                const [x1, y1, z1] = location_1;
                const [x2, y2, z2] = location_2;
                const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
                console.log(distance);
                return [{ distance }, "REPROMPT"];
            }
            catch (error) {
                console.log("Error getting distance between entities:", error);
                return [{ error: "Invalid JSON list" }, "REPROMPT"];
            }
        });
    }
}
exports.MyFunctionHandler = MyFunctionHandler;
