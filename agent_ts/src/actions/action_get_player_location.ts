export function action_get_player_location(mcBot: any, mcData: any, parameters: any): [any, any] {
  console.log('Getting player (player_name) location.');
  console.log(parameters);

  const playerName = parameters.player_name;
  const player = mcBot.players[playerName];

  console.log('Player:', player);

  const pos = player.entity.position;

  console.log('Player location:', pos);

  const responseBody = { "location": { "x": pos.x, "y": pos.y, "z": pos.z } };
  const responseState = 'REPROMPT';
  return [responseBody, responseState];
}
