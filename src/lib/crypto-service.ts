
"use client";

import CryptoJS from 'crypto-js';

// These MUST match the key and IV in your ESP32 firmware.
const aesKey = CryptoJS.enc.Hex.parse('0123456789ABCDEF1032547698BADCFE');
const aesIv = CryptoJS.enc.Hex.parse('000102030405060708090A0B0C0D0E0F');

/**
 * Decrypts a Base64 encoded, AES-128-CBC encrypted string.
 * @param encryptedBase64 The Base64 encoded ciphertext from Firebase.
 * @returns The decrypted plaintext string, or an empty string if decryption fails.
 */
export function decryptData(encryptedBase64: string): string {
  try {
    const encryptedData = CryptoJS.enc.Base64.parse(encryptedBase64);
    
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encryptedData } as CryptoJS.lib.CipherParams,
      aesKey,
      {
        iv: aesIv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7, // ESP32 code uses PKCS7 padding implicitly
      }
    );

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    // The ESP32 code uses a custom padding which we need to remove.
    // The last byte of the decrypted data indicates the number of padding bytes.
    if (decryptedText.length > 0) {
      const lastChar = decryptedText.charCodeAt(decryptedText.length - 1);
      if (lastChar > 0 && lastChar <= 16) {
        // Check if all padding chars are the same
        let paddingIsValid = true;
        for (let i = 0; i < lastChar; i++) {
          if (decryptedText.charCodeAt(decryptedText.length - 1 - i) !== lastChar) {
            paddingIsValid = false;
            break;
          }
        }
        if (paddingIsValid) {
          return decryptedText.substring(0, decryptedText.length - lastChar);
        }
      }
    }
    
    // If custom padding removal fails, return the text as is (might have non-printable chars)
    return decryptedText.replace(/\x00/g, ''); // Also remove null characters
  } catch (e) {
    console.error("Decryption failed:", e);
    return ""; // Return an empty string or some error indicator
  }
}
