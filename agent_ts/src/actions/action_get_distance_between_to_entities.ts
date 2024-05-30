export async function action_get_distance_between_to_entities(mcBot: any, mcData: any, parameters: any): Promise<[any, any]> {
  console.log("Getting the distance between two entities.");
  console.log(parameters);

  try {
    const location_1 = JSON.parse(parameters.location_1);
    const location_2 = JSON.parse(parameters.location_2);

    if (!Array.isArray(location_1) || location_1.length !== 3 || !Array.isArray(location_2) || location_2.length !== 3) {
      throw new Error("Invalid location format");
    }

    const [x1, y1, z1] = location_1;
    const [x2, y2, z2] = location_2;
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));

    console.log(distance);
    return [{ distance }, "REPROMPT"];
  } catch (error) {
    console.log("Error getting distance between entities:", error);
    return [{ error: "Invalid JSON list" }, "REPROMPT"];
  }
}
