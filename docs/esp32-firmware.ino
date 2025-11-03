#define FIREBASE_DISABLE_ALL_LOGS
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>
#include "mbedtls/aes.h"
#include "mbedtls/base64.h"
#include <time.h>
#include <HTTPClient.h>

// ============ Wi-Fi Configuration ============
#define WIFI_SSID "VivoY20"
#define WIFI_PASSWORD "12345678"

// ============ Firebase Configuration ============
#define API_KEY "AIzaSyDxY9Y3RqXM7afAu6eDNMMVBvzswd-ZZ6k"
#define DATABASE_URL "https://studio-166999217-87cc8-default-rtdb.asia-southeast1.firebasedatabase.app/"

// ============ Firebase Paths ============
#define DHT_PATH "devices/DHT22_Sensor"

// ============ Root CA Certificate ============
// This is the modern GTS Root R1 certificate required for Firebase.
const char* root_ca_cert = \
    "-----BEGIN CERTIFICATE-----\n" \
    "MIIDdTCCAl2gAwIBAgILCgAAAAA0AAAAFzANBgkqhkiG9w0BAQsFADBYMQswCQYD\n" \
    "VQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEQMA4GA1UECxMHUm9v\n" \
    "dCBDQTEbMBkGA1UEAxMSR2xvYmFsU2lnbiBSb290IENBMB4XDTE0MDYyOTEwMDAw\n" \
    "MFoXDTI4MDEyODEwMDAwMFowWDELMAkGA1UEBhMCQkUxGTAXBgNVBAoTEEdsb2Jh\n" \
    "bFNpZ24gbnYtc2ExEDAOBgNVBAsTB1Jvb3QgQ0ExGzAZBgNVBAMTEkdsb2JhbFNp\n" \
    "Z24gUm9vdCBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJwwL2oN\n" \
    "pMofdoA29iDo7Soo+VnU4yDve3xBAEtal14J6A7sQy/YDBr8oA2N2aTLTj5pQv/+\n" \
    "j8vj4iOEV4d2YIeC/1yfx6vI2M9v2uM1Fk2dgc4Yn82VJEa4aE8n0mB2yM+3yr72\n" \
    "u4j7gMc/A4y/3Vf4cWf0s8P6A/RLjI4/9p513a9g3B3XN136xi2c3v4exsyO22n3\n" \
    "D2tT5je8Gqj3yVeyA2sfrr/m2g/uJg8dpOaQP3S/v2d4jC42H/MTL3MUr3u4Cns4\n" \toY0IQY3x2Wqfwsx5HhAyNBr5T20o+29i40tO+lPAy2aQSLk34PxYt41mQn+v/+gqh5a2\n" \
    "xL3AnE2X2pcn+vQ/IagYnzA1ePEl144x9v05Glf+RN+3j6Jj8Mxyg2h/sWZhdvyc\n" \
    "t3fQySFrx4o3m2t6zz62J1w0P4Vfsx7b4sXq95yVaBfr8YJ2BNCS99+4zB9pE3f3\n" \
    "fJ6NZj92v6yXl7a9eT93A/g6z64u9qJzVn553eMA31y9G+o5/93x+3j9Cj/s/w==\n" \
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
  if (!getLocalTime(&timeinfo)) {
    return "1970-01-01T00:00:00Z";
  }
  char buf[30];
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
  if(!input || !output){
      Serial.println("❌ Failed to allocate memory for encryption");
      if(input) free(input);
      if(output) free(output);
      return "";
  }

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

// ============ Robust Time Sync Function ============
void syncTime() {
    Serial.print("⏳ Syncing time via NTP...");
    configTime(19800, 0, "pool.ntp.org", "time.google.com");
    
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo, 10000)) { // 10-second timeout
        Serial.println(" ▲ NTP Time sync failed. Trying HTTP fallback...");
        
        HTTPClient http;
        http.begin("http://worldtimeapi.org/api/ip");
        int httpCode = http.GET();
        if (httpCode > 0) {
            if (httpCode == HTTP_CODE_OK) {
                StaticJsonDocument<1024> doc;
                deserializeJson(doc, http.getString());
                long unixtime = doc["unixtime"];
                timeval tv = { unixtime, 0 };
                settimeofday(&tv, nullptr);
                Serial.println("🕒 Time synced via HTTP!");
                http.end();
                return;
            }
        } else {
            Serial.printf("▲ HTTP Time Sync: Connection failed: %s\n", http.errorToString(httpCode).c_str());
        }
        http.end();

        Serial.println("❌ CRITICAL: Time synchronization failed. Halting.");
        Serial.println("🚨 Please check internet connection and firewall settings.");
        while(1) {
            digitalWrite(LED_BUILTIN, HIGH); delay(200);
            digitalWrite(LED_BUILTIN, LOW); delay(200);
        }
    } else {
        Serial.println("🕒 Time synced via NTP!");
    }
}


// ============ Upload Encrypted Dummy Data ============
void uploadDataOnce() {
  float temperature = random(2000, 3500) / 100.0; // 20.00-34.99°C
  float humidity = random(4000, 7000) / 100.0;    // 40.00-69.99%
  String ts = getISOTime();

  StaticJsonDocument<128> dhtDoc;
  dhtDoc["temperature"] = String(temperature, 2);
  dhtDoc["humidity"] = String(humidity, 2);
  String dhtPayload;
  serializeJson(dhtDoc, dhtPayload);

  String encryptedPayload = encryptData(dhtPayload);
  
  if(encryptedPayload == ""){
      Serial.println("❌ Encryption returned empty string. Aborting upload.");
      return;
  }

  FirebaseJson jsonToUpload;
  jsonToUpload.set("encrypted_value", encryptedPayload);
  jsonToUpload.set("timestamp", ts);

  if (!Firebase.ready()) {
    Serial.println("⚠️ Firebase not ready for upload.");
    return;
  }

  Serial.println("📡 Uploading encrypted DHT data...");
  if (Firebase.RTDB.setJSON(&fbdo, DHT_PATH, &jsonToUpload)) {
    Serial.println("✅ Encrypted DHT data uploaded successfully!");
    Serial.printf("   (Plaintext was: temp=%.2f, hum=%.2f)\n", temperature, humidity);
  } else {
    Serial.printf("❌ DHT upload failed: %s\n", fbdo.errorReason().c_str());
  }
  Serial.println("----------------------------------");
}

// ============ Setup ============
void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  delay(100);

  Serial.print("🔌 Connecting to Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\n✅ Wi-Fi connected: " + WiFi.localIP().toString());
  
  syncTime();

  secureClient.setCACert(root_ca_cert);

  config.api_key = API_KEY;
  config.database_.url = DATABASE_URL;
  config.cert.data = root_ca_cert;
  
  fbdo.setBSSLBufferSize(4096, 4096); 
  config.timeout.serverResponse = 10000;

  Serial.println("🔐 Signing up with Firebase (anonymously)...");
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("✅ Firebase SignUp OK");
    config.token_status_callback = tokenStatusCallback;
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
  delay(10000);
}
