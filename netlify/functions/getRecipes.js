
import { getRecipesFromDatabase } from "../../src/backend/getRecipesFromDatabase";


export async function handler(event, context) {
  const recipes = await getRecipesFromDatabase();

  return {
    statusCode: 200,
    body: JSON.stringify(recipes),
  };
}
