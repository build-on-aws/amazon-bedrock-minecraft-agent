import * as fs from 'fs';
import * as path from 'path';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { TextDecoder } from "util";
import { Vec3 } from 'vec3';

/**
 * Represents a block in the Minecraft world used in the blueprint.
 */
interface Block {
  x: number;
  y: number;
  z: number;
  type: string;
}

/**
 * Represents a blueprint for a structure for the Minecraft world.
 */
interface Blueprint {
  structure: Block[];
}

const config = {
  modelIds: {
    default: "anthropic.claude-3-sonnet-20240229-v1:0",
    // other model IDs
  },
  region: "us-west-2"
};

/**
 * Handles the action of building a structure in the Minecraft world.
 */
class ActionBuild {
  private readonly logger: Console;

  constructor() {
    this.logger = console;
  }

  /**
   * Prepares a block for placement in the Minecraft world.
   * This places the block in the hand of the bot.
   * @param mcBot - The Minecraft bot instance.
   * @param blockName - The name of the block to prepare.
   */
  async prepareBlock(mcBot: any, blockName: string): Promise<void> {
    this.logger.info(`Preparing block: ${blockName}`);
    const Item = require("prismarine-item")(mcBot.version);

    const blockInfo = mcBot.registry.itemsByName[blockName];
    this.logger.info(`Block info: ${blockInfo.name}`);

    const blockItem = new Item(blockInfo.id, 1);
    this.logger.info(`Block item: ${blockItem.name}`);

    await mcBot.creative.setInventorySlot(36, blockItem);
  }

  /**
   * Builds a structure in the Minecraft world based on a blueprint.
   * @param mcBot - The Minecraft bot instance.
   * @param mcData - The Minecraft data instance.
   * @param blueprint - The blueprint for the structure to be built.
   */
  async buildStructureFromBlueprint(mcBot: any, mcData: any, blueprint: Blueprint): Promise<void> {
    // We build at the position of the bot.
    const startBotPosition = mcBot.entity.position.floored();
    const startPosition = mcBot.blockAt(startBotPosition)?.position;

    if (!startPosition) {
      throw new Error("Unable to determine starting position.");
    }

    this.logger.info('Building structure...');

    // For each block in the Blueprint, place the block in the world.
    for (const block of blueprint.structure) {
      const { x, y, z, type } = block;
      const blockPosition = startPosition.offset(x, y, z);
      await this.placeBlock(mcBot, mcData, blockPosition, type);
    }

    this.logger.info('Structure built successfully!');
    mcBot.creative.stopFlying();
  }

  /**
   * Places a block in the Minecraft world at the specified position.
   * This includes determaining which adjoining face of a neighbouring 
   * block to use.
   * @param mcBot - The Minecraft bot instance.
   * @param mcData - The Minecraft data instance.
   * @param blockPosition - The position where the block should be placed.
   * @param blockName - The name of the block to be placed.
   */
  async placeBlock(mcBot: any, mcData: any, blockPosition: Vec3, blockName: string): Promise<void> {
    this.logger.info(`Attempting to place block: ${blockName} at ${blockPosition}`);

    try {
      // If we can't find the block, we default to 'glass'
      var blockType = mcData.itemsByName[blockName] || 'stone';

      this.logger.debug(`Block type: ${blockType.id}`);

      await this.prepareBlock(mcBot, blockName);
      // Flying above the target location keeps the bot out of the 
      // way while we build. 
      await mcBot.creative.flyTo(blockPosition.offset(0, 3, 0));

      // Is there a block already in this position? target is not air
      const currentBlock = mcBot.blockAt(blockPosition);
      if (currentBlock && currentBlock.name !== 'air') {
        this.logger.warn(`Block already exists at ${blockPosition}, attempting to destory the block.`);
        await mcBot.dig(currentBlock);
      }

      const result = this.getFace(mcBot, blockPosition);

      this.logger.debug(`Result: ${result}`);

      if (result) {
        const { faceBlock, direction } = result;
        const invFace = direction.scale(-1);

        this.logger.debug(`Using faceBlock: ${faceBlock.position} with face ${direction}`);
        this.logger.debug(`Using faceBlock name: ${faceBlock.name}`);

        await mcBot.placeBlock(faceBlock, invFace);
        this.logger.info(`Placed block: ${blockName} at ${blockPosition}`);
      } else {
        this.logger.warn('No suitable block found. Trying to move block down.');
        await this.placeBlock(mcBot, mcData, blockPosition.offset(0, -1, 0), blockName);
      }
    } catch (err) {
      this.logger.error(`Failed to place block: ${err}`);
    }
  }

  /**
   * Finds a suitable block face to place a block on.
   * @param mcBot - The Minecraft bot instance.
   * @param blockPosition - The position where the block should be placed.
   * @returns The face block and the direction to place the block, or null if no suitable block is found.
   */
  getFace(mcBot: any, blockPosition: Vec3): { faceBlock: any, direction: Vec3 } | null {
    const block = mcBot.blockAt(blockPosition);

    if (block && block.name === 'air') {
      const directions = [
        new Vec3(0, 1, 0),  // up
        new Vec3(0, -1, 0),  // down
        new Vec3(0, 0, -1), // north
        new Vec3(0, 0, 1),  // south
        new Vec3(1, 0, 0),  // east
        new Vec3(-1, 0, 0), // west
      ];

      for (const direction of directions) {
        const faceBlock = mcBot.blockAt(blockPosition.plus(direction));

        if (faceBlock && faceBlock.boundingBox !== 'empty') {
          return { faceBlock, direction };
        }
      }
    } else {
      this.logger.info('Block is not air');
    }

    return null;
  }

  /**
   * Generates a prompt for the language model based on a template and a structure description.
   * @param templatePath - The path to the template file.
   * @param structureDescription - The description of the structure to be built.
   * @returns The generated prompt.
   */
  async generatePrompt(templatePath: string, structureDescription: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(templatePath, 'utf8', (err, templateContent) => {
        if (err) {
          reject(err);
          return;
        }

        const prompt = templateContent.replace('{{ structure_description }}', structureDescription);
        resolve(prompt);
      });
    });
  }

  /**
   * Invokes the language model with the provided prompt.
   * @param prompt - The prompt to be used for the language model.
   * @param modelId - The ID of the language model to be used.
   * @param retryCount - The number of retries in case of an error.
   * @returns The response from the language model.
   */
  async invokeModel(prompt: string, modelId: string, retryCount = 0): Promise<string> {
    const client = new BedrockRuntimeClient({ region: config.region });

    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 100000,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
    };

    const command = new InvokeModelCommand({
      contentType: "application/json",
      body: JSON.stringify(payload),
      modelId,
    });

    try {
      const apiResponse = await client.send(command);
      const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
      const responseBody = JSON.parse(decodedResponseBody);
      return responseBody.content[0].text;
    } catch (err) {
      this.logger.error(`API call failed. Error: ${err}`);
      throw err;
    }
  }

  /**
   * Extracts the last occurrence of the <OUTPUT> tag content from the input string.
   * @param input - The input string to search for the <OUTPUT> tag.
   * @returns The content within the last <OUTPUT> tag, or null if not found.
   */
  extractLastOutputTagContent(input: string): string | null {
    const regex = /<OUTPUT>(.*?)<\/OUTPUT>/gs;
    let match;
    let lastMatch = null;

    while ((match = regex.exec(input)) !== null) {
      lastMatch = match[1];
    }

    return lastMatch;
  }

  /**
   * Strips JSON comments from the input string.
   * @param jsonString - The JSON string to be stripped of comments.
   * @returns The JSON string with comments removed.
   */
  stripJsonComments(jsonString: string): string {
    return jsonString.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
  }

  /**
   * Parses a JSON string into a JavaScript object.
   * @param jsonString - The JSON string to be parsed.
   * @returns The parsed JavaScript object, or null if an error occurs.
   */
  parseJsonString(jsonString: string): any {
    try {
      const dataObject = JSON.parse(jsonString);
      return dataObject;
    } catch (error) {
      this.logger.error("Error parsing JSON string:", error);
      return null;
    }
  }

  /**
   * Executes the 'build' action, which generates a blueprint for a structure and builds it in the Minecraft world.
   * @param mcBot - The Minecraft bot instance.
   * @param mcData - The Minecraft data instance.
   * @param parameters - The parameters for the 'build' action, including the structure description.
   * @returns An array containing the response body and the response state.
   */
  async action_build(mcBot: any, mcData: any, parameters: any): Promise<[any, any]> {
    const { structure_description } = parameters;

    const templateFilePath = path.join(__dirname, 'build_prompt.txt');
    let message = "";

    mcBot.chat("Let me think on this, I am going to try and design a " + structure_description);

    try {
      const prompt = await this.generatePrompt(templateFilePath, structure_description);
      this.logger.info(`Generated prompt: ${prompt}`);

      mcBot.chat("Hmmm, let me see...");

      const modelId = config.modelIds.default;
      const response = await this.invokeModel(prompt, modelId);
      const generated_text: string = response;
      this.logger.info('Generated Text:');
      this.logger.info(generated_text);

      const jsonString = this.extractLastOutputTagContent(generated_text);

      if (jsonString !== null) {
        mcBot.chat("Okay, I have a design...");

        const dataObject = this.parseJsonString(this.stripJsonComments(jsonString));

        if (dataObject !== null) {
          this.logger.info("Parsed data object:", dataObject);

          mcBot.chat("Let's try building...");
          await this.buildStructureFromBlueprint(mcBot, mcData, dataObject);
          message = "Done. Note that this is experimental and might not look perfect!";
        }
      } else {
        this.logger.error("No <OUTPUT> tag found.");
        message = "No <OUTPUT> tag found.";
      }
    } catch (err) {
      this.logger.error('Error:', err);
      message = "An error occurred.";
    }

    const responseBody = { "message": message };
    const responseState = 'REPROMPT';
    return [responseBody, responseState];
  }
}

// Usage
const actionBuild = new ActionBuild();
export async function action_build(mcBot: any, mcData: any, parameters: any): Promise<[any, any]> {
  return actionBuild.action_build(mcBot, mcData, parameters);
}
