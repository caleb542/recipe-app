const VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

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
      `${VISION_ENDPOINT}?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { source: { imageUri: imageUrl } },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
            imageContext: { languageHints: ['en'] }
          }]
        })
      }
    );

    const data = await response.json();
    const result = data.responses?.[0];

    // Vision returns HTTP 200 with a nested error object on failure.
    if (result?.error) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: result.error.message })
      };
    }

    const annotation = result?.fullTextAnnotation;
    const text = annotation?.text || '';
    const { tokens, page } = extractTokens(annotation);

    console.log(`OCR: ${tokens.length} tokens, medianHeight ${page.medianHeight}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, tokens, page })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}

// Flattens Vision's block → paragraph → word tree into a positioned token array.
function extractTokens(annotation) {
  const empty = { tokens: [], page: { width: 0, height: 0, medianHeight: 0 } };
  if (!annotation?.pages?.length) return empty;

  const visionPage = annotation.pages[0];

  // blockType is absent on older responses; treat absent as TEXT.
  const blocks = (visionPage.blocks || []).filter(
    block => !block.blockType || block.blockType === 'TEXT'
  );

  const tokens = [];

  blocks.forEach((block, blockIndex) => {
    for (const paragraph of block.paragraphs || []) {
      for (const word of paragraph.words || []) {
        const wordText = (word.symbols || []).map(symbol => symbol.text).join('');
        if (!wordText) continue;

        const box = boundsOf(word.boundingBox);
        if (!box) continue;

        tokens.push({
          text: wordText,
          block: blockIndex,
          x0: box.x0,
          x1: box.x1,
          y0: box.y0,
          y1: box.y1,
          yCenter: Math.round((box.y0 + box.y1) / 2),
          height: box.y1 - box.y0,
          conf: word.confidence != null
            ? Math.round(word.confidence * 100) / 100
            : null
        });
      }
    }
  });

  return {
    tokens,
    page: {
      width: visionPage.width || 0,
      height: visionPage.height || 0,
      medianHeight: median(tokens.map(token => token.height))
    }
  };
}

// Vertices are four corners in arbitrary order, so take min/max rather than [0] and [2].
function boundsOf(boundingBox) {
  const vertices = boundingBox?.vertices;
  if (!vertices?.length) return null;

  // Vision omits x or y entirely when the value is 0.
  const xs = vertices.map(vertex => vertex.x || 0);
  const ys = vertices.map(vertex => vertex.y || 0);

  return {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys),
    y1: Math.max(...ys)
  };
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}