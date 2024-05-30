export function action_is_raining(mcBot: any, mcData: any, parameters: any): [any, any] {
  const result = mcBot.isRaining;
  const responseBody = { "isRaining": result };
  const responseState = 'REPROMPT';
  return [responseBody, responseState];
}
