const mineflayer = require('mineflayer');

import { action_get_time } from './actions/action_get_time';
import { action_jump } from './actions/action_jump';
import { action_dig } from './actions/action_dig';
import { action_is_raining } from './actions/action_is_raining';
import { action_get_player_location } from './actions/action_get_player_location';
import { action_move_to_location } from './actions/action_move_to_location';
import { action_get_distance_between_to_entities } from './actions/action_get_distance_between_to_entities';
import { action_collect_block } from './actions/action_collect_block';
import { action_find_entity } from './actions/action_find_entity';
import { action_attack_nearest_entity } from './actions/action_attack_nearest_entity';
import { action_build } from './actions/build/action_build';

export interface FunctionHandler {
  callFunction(functionName: string, parameters: any): Promise<[any, any]>;
}

export class MyFunctionHandler implements FunctionHandler {
  private readonly mcBot: typeof mineflayer;
  private readonly mcData: any;

  constructor(mcBot: typeof mineflayer, mcData: any) {
    this.mcBot = mcBot;
    this.mcData = mcData;
  }

  async callFunction(functionName: string, parameters: any): Promise<[any, any]> {
    const unpackedParams: { [key: string]: any } = {};
  
    /**
     * Unpacks the parameters from the return control call and formats them 
     * in to a generic payload for the function handler tools.
     */
    for (const param of parameters) {
      const { name, type, value } = param;
      
      switch (type) {

        case 'number':
          unpackedParams[name] = Number(value);
          break;
        case 'string':
          unpackedParams[name] = value;
          break;

        default:
          throw new Error(`Unsupported parameter type: ${type}`);
      }
    }

    // Which action(tool) is being called? 
    switch (functionName) {

      case 'action_get_time':
        return action_get_time(this.mcBot, this.mcData, unpackedParams);

      case 'action_jump':
        return action_jump(this.mcBot, this.mcData, unpackedParams);

      case 'action_dig':
        return await action_dig(this.mcBot, this.mcData, unpackedParams);

      case 'action_is_raining':
        return action_is_raining(this.mcBot, this.mcData, unpackedParams);

      case 'action_get_player_location':
        return action_get_player_location(this.mcBot, this.mcData, unpackedParams);

      case 'action_move_to_location':
        return await action_move_to_location(this.mcBot, this.mcData, unpackedParams);

      case 'action_get_distance_between_to_entities':
        return await action_get_distance_between_to_entities(this.mcBot, this.mcData, unpackedParams);

      case 'action_collect_block':
        return await action_collect_block(this.mcBot, this.mcData, unpackedParams);

      case 'action_find_entity':
        return await action_find_entity(this.mcBot, this.mcData, unpackedParams);

      case 'action_attack_nearest_entity':
        return await action_attack_nearest_entity(this.mcBot, this.mcData, unpackedParams);

      case 'action_build':
        return await action_build(this.mcBot, this.mcData, unpackedParams);

      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }
}
