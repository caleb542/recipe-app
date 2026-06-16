export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { imageUrl } = JSON.parse(event.body);
    
    if (!imageUrl) {
      return { statusCode: 400, body: JSON.stringify({ error: 'imageUrl required' }) };
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { source: { imageUri: imageUrl } },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
          }]
        })
      }
    );

    const data = await response.json();
    console.log('Vision API response:', JSON.stringify(data, null, 2));
    const text = data.responses?.[0]?.fullTextAnnotation?.text || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}