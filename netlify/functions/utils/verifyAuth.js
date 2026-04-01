// netlify/functions/utils/verifyAuth.js
import jwt from 'jsonwebtoken'; 
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export const verifyToken = (token, isIdToken = false) => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        // ✅ ID tokens use client ID as audience, access tokens use API audience
        audience: isIdToken 
          ? process.env.AUTH0_CLIENT_ID 
          : process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256']
      },
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      }
    );
  });
};

export const getTokenFromHeader = (headers) => {
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

export const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// ✅ Helper: Verify authentication from event headers
// Combines getTokenFromHeader + verifyToken into one call
export const verifyAuth = async (event) => {
  try {
    console.log("TRYING")
    const token = getTokenFromHeader(event.headers);
    console.log("TOKERN", token);
    if (!token) return null;
    
    // ✅ DEBUG: Log what we're using
    console.log('🔍 AUTH0_CLIENT_ID:', process.env.AUTH0_CLIENT_ID);
    console.log('🔍 AUTH0_AUDIENCE:', process.env.AUTH0_AUDIENCE);
    console.log('🔍 AUTH0_DOMAIN:', process.env.AUTH0_DOMAIN);
    
    // ✅ Try as ID token first (has email), fallback to access token
    try {
      console.log('Trying ID token verification...');
      const decoded = await verifyToken(token, true);
      console.log('✅ ID token worked!');
      return {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        email_verified: decoded.email_verified,
        ...decoded
      };
    } catch (idTokenError) {
      console.log('❌ ID token failed:', idTokenError.message);
      // If ID token fails, try as access token
      console.log('Trying access token verification...');
      const decoded = await verifyToken(token, false);
      console.log('✅ Access token worked!');
      return {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        email_verified: decoded.email_verified,
        ...decoded
      };
    }
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
};