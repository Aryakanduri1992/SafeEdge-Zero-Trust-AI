// -------------------------------------------------------------------------------- /
//  AuthStation - ESP32 Secure Sensor Data Uploader
//  - Uses dummy data for testing without hardware.
//  - Establishes a secure TLS connection using a Root CA certificate.
//  - Robust time synchronization with NTP and HTTP fallback.
//  - Halts on critical errors for easier debugging.
// -------------------------------------------------------------------------------- /

#define FIREBASE_DISABLE_ALL_LOGS
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <WiFiClientSecure.h>
#include "mbedtls/aes.h"
#include "mbedtls/base64.h"
#include <time.h>

// ============ Wi-Fi Configuration ============
#define WIFI_SSID "VivoY20"
#define WIFI_PASSWORD "12345678"

// ============ Firebase Configuration ============
#define API_KEY "AIzaSyDxY9Y3RqXM7afAu6eDNMMVBvzswd-ZZ6k"
#define DATABASE_URL "https://studio-166999217-87cc8-default-rtdb.asia-southeast1.firebasedatabase.app/"

// ============ Onboard LED for Error Indication ============
#define ONBOARD_LED 2

// ============ Firebase Paths ============
#define PIR_PATH "devices/PIR_Sensor"
#define DHT_PATH "devices/DHT22_Sensor"

// ============ Root CA Certificate ============
// Google's Global Trust Services (GTS) Root R1 certificate.
const char* root_ca_cert =
    "-----BEGIN CERTIFICATE-----\n"
    "MIIDdTCCAl2gAwIBAgILCgAAAAA0AAAAFzANBgkqhkiG9w0BAQsFADBYMQswCQYD\n"
    "VQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEQMA4GA1UECxMHUm9v\n"
    "dCBDQTEbMBkGA1UEAxMSR2xvYmFsU2lnbiBSb290IENBMB4XDTE0MDYyOTEwMDAw\n"
    "MFoXDTI4MDEyODEwMDAwMFowWDELMAkGA1UEBhMCQkUxGTAXBgNVBAoTEEdsb2Jh\n"
    "bFNpZ24gbnYtc2ExEDAOBgNVBAsTB1Jvb3QgQ0ExGzAZBgNVBAMTEkdsb2JhbFNp\n"
    "Z24gUm9vdCBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJwwL2oN\n"
    "pMofdoA29iDo7Soo+VnU4yDve3xBAEtal14J6A7sQy/YDBr8oA2N2aTLTj5pQv/+\n"
    "j8vj4iOEV4d2YIeC/1yfx6vI2M9v2uM1Fk2dgc4Yn82VJEa4aE8n0mB2yM+3yr72\n"
    "u4j7gMc/A4y/3Vf4cWf0s8P6A/RLjI4/9p513a9g3B3XN136xi2c3v4exsyO22n3\n"
    "D2tT5je8Gqj3yVeyA2sfrr/m2g/uJg8dpOaQP3S/v2d4jC42H/MTL3MUr3u4Cns4\n"
    "d2Q3jbfDNEPjIeuwnZpPco9o2v3GvGOM6Zl962NqLWAIIS/grUpZWcSGjnTKwIAy\n"
    "Xk9LPjP2g6p2KywH3iJvWd3nWNYVyA8T+CsKeJtTEiHWir8C12P/t9W2wo4a3GZo\n"
    "eEWdYDMcsDmt3J6p0+p8h9YT8I28u3Qf432t3d5cW0AnE/g/sC2gM1aYmXo5T8Ie\n"
    "w8wB3C3a+l/sZpL9ePGeJ25C/fKPg8VtzE5W757EBL20fCqK9sEy4lV1oAd4pI3d\n"
    "agVvS2yf8Xq7DVfM/I6M05v1eAFBwXg1VfHBhJ/pQDBVQy6C3rD6M7p3d5xK68fm\n"
    "gRe/Zn1aCgtg+pBAv5jG1V1YvU/0vRfqD321+MHasA0P82yJupVfyTjDAy8G9ks2\n"
    "v9DDtQpFkFNu4p3QcMyyC+g8o2C/Tpf47M/vA5F/eDqfT3jZeyIZzAjGfd8b2eS2\n"
    "c8v35p5TzQvfPU5qFMFnB1Pq0+3aP7J3qYI9wloJ7u4iC+ag1ql9Fz8m/3cbLqNL\n"
    "gGlU35OANep54v/0NV0t2yjwB9lJEcdaeEKgQd2Anz+0k9/5LIQ5071I8N2F+A/+\n"
    "w3wRfgfPs7l3yuzA28i1+6cQwns1tXv3+3d9gpprY2+Afv9gCT8qg8B47C5sC2o/\n"
    "oY0IQY3x2Wqfwsx5HhAyNBr5T20o+29i40tO+lPAy2aQSLk34PxYt41mQn+v/+gq\n"
    "h5a2xL3AnE2X2pcn+vQ/IagYnzA1ePEl144x9v05Glf+RN+3j6Jj8Mxyg2h/sWZh\n"
    "dvyct3fQySFrx4o3m2t6zz62J1w0P4Vfsx7b4sXq95yVaBfr8YJ2BNCS99+4zB9p\n"
    "E3f3fJ6NZj92v6yXl7a9eT93A/g6z64u9qJzVn553eMA31y9G+o5/93x+3j9Cj/s\n"
    "/w==\n"
    "-----END CERTIFICATE-----\n";

// ============ Firebase Objects ============
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
WiFiClientSecure secureClient;

// ============ AES Key & IV ============
static const unsigned char aes_key[16] = {
  0x01,0x23,0x45,0x67,0x89,0xAB,0xCD,0xEF,
  0x10,0x32,0x54,0x76,0x98,0xBA,0xDC,0xFE
};
static const unsigned char aes_iv[16] = {
  0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,
  0x08,0x09,0x0A,0x0B,0x0C,0x0D,0x0E,0x0F
};

// ============ Helper: ISO time ============
String getISOTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "1970-01-01T00:00:00Z";
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}

// ============ Helper: base64 ============
String base64Encode(const unsigned char *data, size_t len) {
  size_t outLen = 0;
  mbedtls_base64_encode(NULL, 0, &outLen, data, len);
  unsigned char *out = (unsigned char *)malloc(outLen + 1);
  if (!out) return "";
  mbedtls_base64_encode(out, outLen, &outLen, data, len);
  out[outLen] = '\0';
  String result = (char *)out;
  free(out);
  return result;
}

// ============ AES-CBC encrypt + base64 ============
String encryptData(String plainText) {
  mbedtls_aes_context aes;
  mbedtls_aes_init(&aes);
  mbedtls_aes_setkey_enc(&aes, aes_key, 128);

  size_t len = plainText.length();
  size_t paddedLen = ((len / 16) + 1) * 16;
  unsigned char *input = (unsigned char *)calloc(paddedLen, 1);
  unsigned char *output = (unsigned char *)calloc(paddedLen, 1);
  memcpy(input, plainText.c_str(), len);
  unsigned char pad = paddedLen - len;
  memset(input + len, pad, pad);

  unsigned char iv_copy[16];
  memcpy(iv_copy, aes_iv, 16);

  mbedtls_aes_crypt_cbc(&aes, MBEDTLS_AES_ENCRYPT, paddedLen, iv_copy, input, output);
  String encoded = base64Encode(output, paddedLen);

  free(input);
  free(output);
  mbedtls_aes_free(&aes);
  return encoded;
}

// ============ HTTP Fallback Time Sync ============
bool httpTimeSync() {
  Serial.println("🌐 NTP failed. Attempting HTTP-based time sync...");
  WiFiClientSecure client;
  client.setInsecure(); // We can be insecure here as we only need a rough time
  if (!client.connect("worldtimeapi.org", 443)) {
    Serial.println("⚠️ HTTP Time Sync: Connection failed.");
    return false;
  }

  client.println("GET /api/timezone/Etc/UTC HTTP/1.1");
  client.println("Host: worldtimeapi.org");
  client.println("Connection: close");
  client.println();

  unsigned long httpTimeout = millis();
  while (client.connected() == 0) {
    if (millis() - httpTimeout > 5000) {
        Serial.println("Error: HTTP connection timeout");
        client.stop();
        return false;
    }
  }
  
  while (client.available() == 0) {
    if (millis() - httpTimeout > 10000) {
      Serial.println("Error: HTTP response timeout");
      client.stop();
      return false;
    }
  }

  // Find the JSON body
  while(client.available()){
    String line = client.readStringUntil('\n');
    if(line == "\r"){
      break;
    }
  }

  // Parse unixtime from JSON
  while(client.available()){
    String line = client.readStringUntil('\n');
    int unixtime_ix = line.indexOf("\"unixtime\":");
    if(unixtime_ix != -1) {
      String unixtime_str = line.substring(unixtime_ix + 11);
      long unixtime = unixtime_str.toInt();
      
      struct timeval tv;
      tv.tv_sec = unixtime;
      tv.tv_usec = 0;
      settimeofday(&tv, NULL);
      
      Serial.printf("✅ Time synced via HTTP: %s\n", getISOTime().c_str());
      client.stop();
      return true;
    }
  }

  Serial.println("⚠️ HTTP Time Sync: Failed to parse time from response.");
  return false;
}

// ============ Robust NTP Sync ============
bool synchronizeTime() {
  Serial.print("⏳ Syncing time via NTP...");
  configTime(19800, 0, "pool.ntp.org", "time.google.com");
  
  time_t now = time(nullptr);
  int retries = 0;
  while (now < 1609459200 && retries < 20) { // Jan 1, 2021
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    retries++;
  }

  if (now < 1609459200) {
    Serial.println("\n⚠️ NTP Time sync failed. Trying HTTP fallback...");
    return httpTimeSync();
  }

  Serial.printf("\n🕒 Time synced via NTP: %s\n", getISOTime().c_str());
  return true;
}

// ============ Upload Encrypted Dummy Data ============
void uploadDataOnce() {
  int pirValue = random(0, 2);
  float temperature = random(20, 36);
  String ts = getISOTime();

  String encPIR = encryptData(String(pirValue));
  String encTemp = encryptData(String(temperature));

  FirebaseJson pirJson;
  pirJson.set("encrypted_value", encPIR);
  pirJson.set("timestamp", ts);

  FirebaseJson dhtJson;
  dhtJson.set("encrypted_value", encTemp);
  dhtJson.set("timestamp", ts);

  if (!Firebase.ready()) return;

  if (Firebase.RTDB.setJSON(&fbdo, PIR_PATH, &pirJson))
    Serial.println("✅ PIR encrypted data uploaded!");
  else
    Serial.printf("❌ PIR upload failed: %s\n", fbdo.errorReason().c_str());

  if (Firebase.RTDB.setJSON(&fbdo, DHT_PATH, &dhtJson))
    Serial.println("✅ DHT22 encrypted data uploaded!");
  else
    Serial.printf("❌ DHT upload failed: %s\n", fbdo.errorReason().c_str());

  Serial.println("⏰ Timestamp: " + ts);
  Serial.println("----------------------------------");
}

// ============ Critical Error Halt ============
void halt_with_error(const char* message) {
    Serial.println(message);
    Serial.println("🚨 System halted. Please check configuration and reset.");
    pinMode(ONBOARD_LED, OUTPUT);
    while(true) {
        digitalWrite(ONBOARD_LED, HIGH);
        delay(200);
        digitalWrite(ONBOARD_LED, LOW);
        delay(200);
    }
}

// ============ Setup ============
void setup() {
  Serial.begin(115200);
  delay(100);

  Serial.print("🔌 Connecting to Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int wifi_retries = 0;
  while (WiFi.status() != WL_CONNECTED && wifi_retries < 30) {
    Serial.print(".");
    delay(500);
    wifi_retries++;
  }

  if (WiFi.status() != WL_CONNECTED) {
      halt_with_error("❌ Wi-Fi connection failed.");
  }
  Serial.println("\n✅ Wi-Fi connected: " + WiFi.localIP().toString());
  
  if (!synchronizeTime()) {
      halt_with_error("❌ CRITICAL: Time synchronization failed. Cannot proceed.");
  }

  secureClient.setCACert(root_ca_cert);

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.cert.data = root_ca_cert;
  fbdo.setBSSLBufferSize(4096, 4096); 

  Serial.println("🔐 Signing up with Firebase (anonymously)...");
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("✅ Firebase SignUp OK");
  } else {
    Serial.printf("❌ Firebase sign-up failed: %s\n", config.signer.signupError.message.c_str());
  }
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Serial.println("🔥 Firebase initialized!");
}

// ============ Loop ============
void loop() {
  if (!Firebase.ready()) {
    Serial.println("⚠️ Firebase not ready — retrying...");
    delay(5000);
    return;
  }

  uploadDataOnce();
  delay(7000);
}
