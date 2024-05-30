export function action_jump(mcBot: any, mcData: any, parameters: any): [any, any] {
  mcBot.setControlState('jump', true);
  setTimeout(() => {
    mcBot.setControlState('jump', false);
  }, 1000);
  const responseBody = { "message": "Jumping" };
  const responseState = 'REPROMPT';
  return [responseBody, responseState];
}
