export function action_get_time(mcBot: any, mcData: any, parameters: any): [any, any] {
  const time = new Date().toLocaleTimeString();
  const responseBody = { "time": time };
  const responseState = 'REPROMPT';
  return [responseBody, responseState];
}
