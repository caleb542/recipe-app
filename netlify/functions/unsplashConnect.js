const { createApi } = require('unsplash-js');

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: (...args) => fetch(...args)
});

exports.handler = async function (event) {
  try {
    const query = event.queryStringParameters.query || 'food';
    const page = event.queryStringParameters.page || 1;

    const response = await unsplash.search.getPhotos({ query, page, perPage: 10 });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response.response.results)
    };
  } catch (error) {
    console.error('❌ Unsplash error:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to fetch Unsplash images',
        details: error.message || 'Unknown error'
      })
    };
  }
};
