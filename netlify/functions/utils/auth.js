import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token, 
      getKey, 
      { 
        audience: process.env.AUTH0_AUDIENCE,  // ← Add this
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,  // ← Add this
        algorithms: ["RS256"] 
      }, 
      (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      }
    );
  });
}

export function requireAuth(handler) {
  return async (event, context) => {
    const token = event.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return { 
        statusCode: 401, 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: "No token provided" })
      };
    }
    
    try {
      const user = await verifyToken(token);
      // Pass the decoded user into your handler
      return handler(event, context, user);
    } catch (err) {
      return { 
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: "Invalid token" })
      };
    }
  };
}

// Helper to get token from headers
export function getTokenFromHeader(headers) {
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Standard CORS headers
export const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};