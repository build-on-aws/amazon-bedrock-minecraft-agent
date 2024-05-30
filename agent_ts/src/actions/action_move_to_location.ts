const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder');

export async function action_move_to_location(mcBot: any, mcData: any, parameters: any): Promise<[any, any]> {
  const { location_x, location_y, location_z } = parameters;

  console.log('location_x:', location_x);
  console.log('location_y:', location_y);
  console.log('location_z:', location_z);

  mcBot.chat("On my way...")

  await mcBot.pathfinder.goto(new GoalNear(
    location_x,
    location_y,
    location_z,
    1
  ));

  console.log('isMoving:', mcBot.pathfinder.isMoving());

  const responseBody = { "message": "Arrived at location." };
  const responseState = 'REPROMPT';
  return [responseBody, responseState];
}
