import { getMongoClient } from './utils/mongoClient.js';

const CUISINE_SEED = [
  // Africa & Middle East
  { slug: 'afghan', name: 'Afghan', group: 'Cuisine', order: 100, active: true },
  { slug: 'african', name: 'African', group: 'Cuisine', order: 101, active: true },
  { slug: 'algerian', name: 'Algerian', group: 'Cuisine', order: 102, active: true },
  { slug: 'arabic', name: 'Arabic', group: 'Cuisine', order: 103, active: true },
  { slug: 'egyptian', name: 'Egyptian', group: 'Cuisine', order: 104, active: true },
  { slug: 'ethiopian', name: 'Ethiopian', group: 'Cuisine', order: 105, active: true },
  { slug: 'iranian', name: 'Iranian', group: 'Cuisine', order: 106, active: true },
  { slug: 'lebanese', name: 'Lebanese', group: 'Cuisine', order: 107, active: true },
  { slug: 'middle-eastern', name: 'Middle Eastern', group: 'Cuisine', order: 108, active: true },
  { slug: 'moroccan', name: 'Moroccan', group: 'Cuisine', order: 109, active: true },
  { slug: 'persian', name: 'Persian', group: 'Cuisine', order: 110, active: true },
  { slug: 'turkish', name: 'Turkish', group: 'Cuisine', order: 111, active: true },

  // Asia & Pacific
  { slug: 'burmese', name: 'Burmese', group: 'Cuisine', order: 200, active: true },
  { slug: 'chinese', name: 'Chinese', group: 'Cuisine', order: 201, active: true },
  { slug: 'filipino', name: 'Filipino', group: 'Cuisine', order: 202, active: true },
  { slug: 'indian', name: 'Indian', group: 'Cuisine', order: 203, active: true },
  { slug: 'indonesian', name: 'Indonesian', group: 'Cuisine', order: 204, active: true },
  { slug: 'japanese', name: 'Japanese', group: 'Cuisine', order: 205, active: true },
  { slug: 'korean', name: 'Korean', group: 'Cuisine', order: 206, active: true },
  { slug: 'malaysian', name: 'Malaysian', group: 'Cuisine', order: 207, active: true },
  { slug: 'pakistani', name: 'Pakistani', group: 'Cuisine', order: 208, active: true },
  { slug: 'sri-lankan', name: 'Sri Lankan', group: 'Cuisine', order: 209, active: true },
  { slug: 'thai', name: 'Thai', group: 'Cuisine', order: 210, active: true },
  { slug: 'vietnamese', name: 'Vietnamese', group: 'Cuisine', order: 211, active: true },

  // Europe (keeping existing, adding more)
  { slug: 'armenian', name: 'Armenian', group: 'Cuisine', order: 300, active: true },
  { slug: 'austrian', name: 'Austrian', group: 'Cuisine', order: 301, active: true },
  { slug: 'british', name: 'British', group: 'Cuisine', order: 302, active: true },
  { slug: 'danish', name: 'Danish', group: 'Cuisine', order: 303, active: true },
  { slug: 'eastern-european', name: 'Eastern European', group: 'Cuisine', order: 304, active: true },
  { slug: 'finnish', name: 'Finnish', group: 'Cuisine', order: 305, active: true },
  { slug: 'german', name: 'German', group: 'Cuisine', order: 306, active: true },
  { slug: 'greek', name: 'Greek', group: 'Cuisine', order: 307, active: true },
  { slug: 'hungarian', name: 'Hungarian', group: 'Cuisine', order: 308, active: true },
  { slug: 'norwegian', name: 'Norwegian', group: 'Cuisine', order: 309, active: true },
  { slug: 'portuguese', name: 'Portuguese', group: 'Cuisine', order: 310, active: true },
  { slug: 'romanian', name: 'Romanian', group: 'Cuisine', order: 311, active: true },
  { slug: 'russian', name: 'Russian', group: 'Cuisine', order: 312, active: true },
  { slug: 'scottish', name: 'Scottish', group: 'Cuisine', order: 313, active: true },
  { slug: 'spanish', name: 'Spanish', group: 'Cuisine', order: 314, active: true },
  { slug: 'swedish', name: 'Swedish', group: 'Cuisine', order: 315, active: true },
  { slug: 'swiss', name: 'Swiss', group: 'Cuisine', order: 316, active: true },
  { slug: 'ukrainian', name: 'Ukrainian', group: 'Cuisine', order: 317, active: true },
  { slug: 'welsh', name: 'Welsh', group: 'Cuisine', order: 318, active: true },

  // Non-Regional
  { slug: 'jewish', name: 'Jewish', group: 'Cuisine', order: 400, active: true },
  { slug: 'sephardic', name: 'Sephardic', group: 'Cuisine', order: 401, active: true },

  // Americas
  { slug: 'american-southern', name: 'American Southern', group: 'Cuisine', order: 500, active: true },
  { slug: 'amish', name: 'Amish', group: 'Cuisine', order: 501, active: true },
  { slug: 'argentinian', name: 'Argentinian', group: 'Cuisine', order: 502, active: true },
  { slug: 'brazilian', name: 'Brazilian', group: 'Cuisine', order: 503, active: true },
  { slug: 'cajun', name: 'Cajun', group: 'Cuisine', order: 504, active: true },
  { slug: 'canadian', name: 'Canadian', group: 'Cuisine', order: 505, active: true },
  { slug: 'caribbean', name: 'Caribbean', group: 'Cuisine', order: 506, active: true },
  { slug: 'chilean', name: 'Chilean', group: 'Cuisine', order: 507, active: true },
  { slug: 'colombian', name: 'Colombian', group: 'Cuisine', order: 508, active: true },
  { slug: 'creole', name: 'Creole', group: 'Cuisine', order: 509, active: true },
  { slug: 'cuban', name: 'Cuban', group: 'Cuisine', order: 510, active: true },
  { slug: 'hawaiian', name: 'Hawaiian', group: 'Cuisine', order: 511, active: true },
  { slug: 'jamaican', name: 'Jamaican', group: 'Cuisine', order: 512, active: true },
  { slug: 'peruvian', name: 'Peruvian', group: 'Cuisine', order: 513, active: true },
];

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const client = await getMongoClient();

  try {
    const db = client.db('recipe-me-db');
    const collection = db.collection('categories');

    const results = { inserted: [], skipped: [] };

    for (const cuisine of CUISINE_SEED) {
      const existing = await collection.findOne({ slug: cuisine.slug });
      if (!existing) {
        await collection.insertOne({
          ...cuisine,
          createdAt: new Date(),
          recipeCount: 0,
          description: '',
          sectionTitle: '',
          image: null
        });
        results.inserted.push(cuisine.slug);
      } else {
        results.skipped.push(cuisine.slug);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Cuisine seed complete',
        inserted: results.inserted.length,
        skipped: results.skipped.length,
        details: results
      })
    };

  } catch (error) {
    console.error('Seed error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};