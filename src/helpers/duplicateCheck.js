// src/helpers/duplicateCheck.js

/**
 * Generate hash from file for duplicate detection
 * @param {File|Blob} file
 * @returns {Promise<string>} - Hash string
 */
export async function generateFileHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Check if image already uploaded
 * @param {File|Blob} file
 * @param {Array} existingImages - Recipe's images array
 * @returns {Promise<Object|null>} - Existing image if found, null otherwise
 */
export async function checkForDuplicate(file, existingImages) {
  if (!existingImages || existingImages.length === 0) {
    return null;
  }

  const fileHash = await generateFileHash(file);
  
  // Check if any existing image has this hash
  const duplicate = existingImages.find(img => img.fileHash === fileHash);
  
  return duplicate || null;
}

/**
 * Check by filename (simpler but less accurate)
 * @param {string} filename
 * @param {Array} existingImages
 * @returns {Object|null}
 */
export function checkDuplicateByFilename(filename, existingImages) {
  if (!existingImages || existingImages.length === 0) {
    return null;
  }

  // Normalize filename (remove path, spaces, special chars)
  const normalizedName = filename.toLowerCase().trim().replace(/\s+/g, '-');
  
  const duplicate = existingImages.find(img => {
    if (img.metadata?.originalFilename) {
      const existingName = img.metadata.originalFilename.toLowerCase().trim().replace(/\s+/g, '-');
      return existingName === normalizedName;
    }
    return false;
  });
  
  return duplicate || null;
}