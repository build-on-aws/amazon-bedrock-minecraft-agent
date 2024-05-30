export function action_find_entity(mcBot: any, mcData: any, parameters: any): [any, any] {
  const { entity_name } = parameters;

  // Update the type definition for the entity parameter
  const found = mcBot.nearestEntity((entity: { name: string; }) => entity.name.toLowerCase() === entity_name.toLowerCase());

  var responseBody: any = { "message": "No entity found" };

  if (found) {
    const pos = found.position;
    const name = found.name;
    responseBody = { "found": name, "location": { "x": pos.x, "y": pos.y, "z": pos.z } };
  }

  const responseState = 'REPROMPT';
  return [responseBody, responseState];
}
