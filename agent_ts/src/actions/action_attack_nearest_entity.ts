export async function action_attack_nearest_entity(mcBot: any, mcData: any, parameters: any): Promise<[any, any]> {
  const { entity_name } = parameters;

  // Update the type definition for the entity parameter
  const found = mcBot.nearestEntity((entity: { name: string; }) => entity.name.toLowerCase() === entity_name.toLowerCase());

  let responseBody;

  if (found) {
    await mcBot.attack(found, true);
    responseBody = { "message": `Attacking ${found.name}.` };
  } else {
    responseBody = { "message": `No entity called ${entity_name} found.` };
  }

  const responseState = 'REPROMPT';
  return [responseBody, responseState];
}
