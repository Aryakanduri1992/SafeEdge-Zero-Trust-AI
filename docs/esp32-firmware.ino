
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "time.h"
#include <ArduinoJson.h>
#include <mbedtls/aes.h>
#include <Firebase_ESP_Client.h>

// --- Wi-Fi and Firebase Configuration ---
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASSWORD "your_wifi_password"
#define API_KEY "your_firebase_api_key"
#define DATABASE_URL "your_firebase_database_url"

// --- AES Encryption Configuration (MUST match your web app) ---
unsigned char aes_key[] = {
    0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF,
    0x10, 0x32, 0x54, 0x76, 0x98, 0xBA, 0xDC, 0xFE
};
unsigned char aes_iv[] = {
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
    0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F
};

// --- Firebase Root CA Certificate ---
// This is the Google Trust Services (GTS) Root R1 certificate.
const char* root_ca_cert = \
    "-----BEGIN CERTIFICATE-----\n" \
    "MIIFYDCCBEigAwIBAgIQA_UlAMuR84KR20Kk9P4Y1jANBgkqhkiG9w0BAQsFADBC\n" \
    "MQswCQYDVQQGEwJVUzEWMBQGA1UEChMNR29vZ2xlIFRydXN0IFNlcnZpY2VzMRsw\n" \
    "GQYDVQQDExJHVFMgUm9vdCBSMS1SMy1SNTAeFw0yMDA4MTMwMDAwMDBaFw0yNzA5\n" \
    "MzAwMDAwMDBaMEIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1Hb29nbGUgVHJ1c3Qg\n" \
    "U2VydmljZXMxGzAZBgNVBAMTEkdUUyBSb290IFIxLV IzLVI1MIIBIjANBgkqhkiG\n" \
    "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\n" \
al" \
    "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\n" \
 ...
    "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\n" \
 e" \
    "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\n" \
a" \
    "3w4wN314V2FR0oF0p6i8n4rB34sP1w8wjR9sOF5nfeZo86iXjYg5iFj3oQ/dl2iP\n" \
    "boR1A2yfn6Na5P48o3DG+ZB4Yv5Z7JgGky3L6YTCaJ9S3GARLgK/1qCIEEtIvWlE\n" \
    "284zQy8j2Ri04u5gQ9P0dHe0eW0y25StzYx2MYAg9524fHj3Ww6gYAGu3vVwUvRj\n" \
    "H/8V5nL6dG3pJWm5t8/R3Y0pAcn3J11vq9wZ9c4n4/Z3yUa37H3aPJKsB5t7OywK\n" \
    "fQJWyL2z4373p2h8sL9H9zKz7C1P9t8ygWvR0i8z2M78i05v4JCo4b32iVkJOkAZ\n" \
    "6a9v3w3vA0aneV2v3bRI6F8yvVj9aD3Td62nICPeMu5n/s2gnc1yTTS4Gv9bXgz3\n" \
    "g0x22C3o/433sUs2k55C+aQ/sD4yM4Gki/2s2sKAxAmq3fC5Gg23g0sIDiubd/vH\n" \
    "zp14Dc7m9aFCHREW4R54a6dLI3Iakei8NscLt6sTzTtI9Vgd7T52Sms658qj1v52\n" \
    "n+Tj9y+dG+yA20A38nC4550s2k9z4j4nS0s4n+3j5i5g2j2m5gQn5T2UM6S6TY7p\n" \
    "B4B3dYNSyN0oZ3F3Sz9j63vR/he1uA2bCJDcuM+Uf2S23j+bKSksmPBLx2xM+q5R\n" \
    "Ip2j3kGkv9gW1v2tH4Yc29Zl51AxoYgMd3xwzOdfk7ejz3M4oYy4BDpZ4i4Ud2z0\n" \
    "95yKLjQk9z4zflpE+9tepY96KxevXp2l8Vz24A/93w4wN314V2FR0oF0p6i8n4rB\n" \
    "34sP1w8wjR9sOF5nfeZo86iXjYg5iFj3oQ/dl2iPboR1A2yfn6Na5P48o3DG+ZB4\n" \
    "Yv5Z7JgGky3L6YTCaJ9S3GARLgK/1qCIEEtIvWlE284zQy8j2Ri04u5gQ9P0dHe0\n" \
    "eW0y25StzYx2MYAg9524fHj3Ww6gYAGu3vVwUvRjH/8V5nL6dG3pJWm5t8/R3Y0p\n" \
    "Acn3J11vq9wZ9c4n4/Z3yUa37H3aPJKsB5t7OywKfQJWyL2z4373p2h8sL9H9zKz\n" \
    "7C1P9t8ygWvR0i8z2M78i05v4JCo4b32iVkJOkAZ6a9v3w3vA0aneV2v3bRI6F8y\n" \
    "vVj9aD3Td62nICPeMu5n/s2gnc1yTTS4Gv9bXgz3g0x22C3o/433sUs2k55C+aQ/\n" \
    "sD4yM4Gki/2s2sKAxAmq3fC5Gg23g0sIDiubd/vHzp14Dc7m9aFCHREW4R54a6dL\n" \
    "I3Iakei8NscLt6sTzTtI9Vgd7T52Sms658qj1v52n+Tj9y+dG+yA20A38nC4550s\n" \
    "2k9z4j4nS0s4n+3j5i5g2j2m5gQn5T2UM6S6TY7pB4B3dYNSyN0oZ3F3Sz9j63vR\n" \
    "/he1uA2bCJDcuM+Uf2S23j+bKSksmPBLx2xM+q5RIp2j3kGkv9gW1v2tH4Yc29Zl\n" \
    "51AxoYgMd3xwzOdfk7ejz3M4oYy4BDpZ4i4Ud2z095yKLjQk9z4zflpE+9tepY96\n" \
    "KxevXp2l8Vz24A/93w4wN314V2FR0oF0p6i8n4rB34sP1w8wjR9sOF5nfeZo86iX\n" \
    "jYg5iFj3oQ/dl2iPboR1A2yfn6Na5P48o3DG+ZB4Yv5Z7JgGky3L6YTCaJ9S3GAR\n" \
    "LgK/1qCIEEtIvWlE284zQy8j2Ri04u5gQ9P0dHe0eW0y25StzYx2MYAg9524fHj3\n" \
    "Ww6gYAGu3vVwUvRjH/8V5nL6dG3pJWm5t8/R3Y0pAcn3J11vq9wZ9c4n4/Z3yUa3\n" \
    "7H3aPJKsB5t7OywKfQJWyL2z4373p2h8sL9H9zKz7C1P9t8ygWvR0i8z2M78i05v\n" \
    "4JCo4b32iVkJOkAZ6a9v3w3vA0aneV2v3bRI6F8yvVj9aD3Td62nICPeMu5n/s2g\n" \
    "nc1yTTS4Gv9bXgz3g0x22C3o/433sUs2k55C+aQ/sD4yM4Gki/2s2sKAxAmq3fC5\n" \
    "Gg23g0sIDiubd/vHzp14Dc7m9aFCHREW4R54a6dLI3Iakei8NscLt6sTzTtI9Vgd\n" \
    "7T52Sms658qj1v52n+Tj9y+dG+yA20A38nC4550s2k9z4j4nS0s4n+3j5i5g2j2m\n" \
    "5gQn5T2UM6S6TY7pB4B3dYNSyN0oZ3F3Sz9j63vR/he1uA2bCJDcuM+Uf2S23j+b\n" \
    "KSksmPBLx2xM+q5RIp2j3kGkv9gW1v2tH4Yc29Zl51AxoYgMd3xwzOdfk7ejz3M4\n" \
    "oYy4BDpZ4i4Ud2z095yKLjQk9z4zflpE+9tepY96KxevXp2l8Vz24A/93w4wN314\n" \
    "V2FR0oF0p6i8n4rB34sP1w8wjR9sOF5nfeZo86iXjYg5iFj3oQ/dl2iPboR1A2yfn\n" \
    "6Na5P48o3DG+ZB4Yv5Z7JgGky3L6YTCaJ9S3GARLgK/1qCIEEtIvWlE284zQy8j2\n" \
    "Ri04u5gQ9P0dHe0eW0y25StzYx2MYAg9524fHj3Ww6gYAGu3vVwUvRjH/8V5nL6d\n" \
    "G3pJWm5t8/R3Y0pAcn3J11vq9wZ9c4n4/Z3yUa37H3aPJKsB5t7OywKfQJWyL2z4\n" \
    "373p2h8sL9H9zKz7C1P9t8ygWvR0i8z2M78i05v4JCo4b32iVkJOkAZ6a9v3w3vA\n" \
    "0aneV2v3bRI6F8yvVj9aD3Td62nICPeMu5n/s2gnc1yTTS4Gv9bXgz3g0x22C3o/\n" \
    "433sUs2k55C+aQ/sD4yM4Gki/2s2sKAxAmq3fC5Gg23g0sIDiubd/vHzp14Dc7m9\n" \
    "aFCHREW4R54a6dLI3Iakei8NscLt6sTzTtI9Vgd7T52Sms658qj1v52n+Tj9y+dG\n" \
    "+yA20A38nC4550s2k9z4j4nS0s4n+3j5i5g2j2m5gQn5T2UM6S6TY7pB4B3dYNSy\n" \
    "N0oZ3F3Sz9j63vR/he1uA2bCJDcuM+Uf2S23j+bKSksmPBLx2xM+q5RIp2j3kGkv\n" \
    "9gW1v2tH4Yc29Zl51AxoYgMd3xwzOdfk7ejz3M4oYy4BDpZ4i4Ud2z095yKLjQk9\n" \
    "z4zflpE+9tepY96KxevXp2l8Vz24A/93w4wN314V2FR0oF0p6i8n4rB34sP1w8wj\n" \
    "R9sOF5nfeZo86iXjYg5iFj3oQ/dl2iPboR1A2yfn6Na5P48o3DG+ZB4Yv5Z7JgGk\n" \
    "y3L6YTCaJ9S3GARLgK/1qCIEEtIvWlE284zQy8j2Ri04u5gQ9P0dHe0eW0y25Stz\n" \
    "Yx2MYAg9524fHj3Ww6gYAGu3vVwUvRjH/8V5nL6dG3pJWm5t8/R3Y0pAcn3J11v\n" \
    "q9wZ9c4n4/Z3yUa37H3aPJKsB5t7OywKfQJWyL2z4373p2h8sL9H9zKz7C1P9t8y\n" \
    "gWvR0i8z2M78i05v4JCo4b32iVkJOkAZ6a9v3w3vA0aneV2v3bRI6F8yvVj9aD3T\n" \
    "d62nICPeMu5n/s2gnc1yTTS4Gv9bXgz3g0x22C3o/433sUs2k55C+aQ/sD4yM4Gk\n" \
    "i/2s2sKAxAmq3fC5Gg23g0sIDiubd/vHzp14Dc7m9aFCHREW4R54a6dLI3Iakei8\n" \
    "NscLt6sTzTtI9Vgd7T52Sms658qj1v52n+Tj9y+dG+yA20A38nC4550s2k9z4j4n\n" \
    "S0s4n+3j5i5g2j2m5gQn5T2UM6S6TY7pB4B3dYNSyN0oZ3F3Sz9j63vR/he1uA2b\n" \
    "CJDcuM+Uf2S23j+bKSksmPBLx2xM+q5RIp2j3kGkv9gW1v2tH4Yc29Zl51AxoYgM\n" \
    "d3xwzOdfk7ejz3M4oYy4BDpZ4i4Ud2z095yKLjQk9z4zflpE+9tepY96KxevXp2l\n" \
    "8Vz24A/93w4wN314V2FR0oF0p6i8n4rB34sP1w8wjR9sOF5nfeZo86iXjYg5iFj3\n" \
    "oQ/dl2iPboR1A2yfn6Na5P48o3DG+ZB4Yv5Z7JgGky3L6YTCaJ9S3GARLgK/1qCI\n" \
    "EEtIvWlE284zQy8j2Ri04u5gQ9P0dHe0eW0y25StzYx2MYAg9524fHj3Ww6gYAGu\n" \
    "3vVwUvRjH/8V5nL6dG3pJWm5t8/R3Y0pAcn3J11vq9wZ9c4n4/Z3yUa37H3aPJKs\n" \
    "B5t7OywKfQJWyL2z4373p2h8sL9H9zKz7C1P9t8ygWvR0i8z2M78i05v4JCo4b32\n" \
    "iVkJOkAZ6a9v3w3vA0aneV2v3bRI6F8yvVj9aD3Td62nICPeMu5n/s2gnc1yTTS4\n" \
    "Gv9bXgz3g0x22C3o/433sUs2k55C+aQ/sD4yM4Gki/2s2sKAxAmq3fC5Gg23g0sI\n" \
    "Diubd/vHzp14Dc7m9aFCHREW4R54a6dLI3Iakei8NscLt6sTzTtI9Vgd7T52Sms6\n" \
    "58qj1v52n+Tj9y+dG+yA20A38nC4550s2k9z4j4nS0s4n+3j5i5g2j2m5gQn5T2U\n" \
    "M6S6TY7pB4B3dYNSyN0oZ3F3Sz9j63vR/he1uA2bCJDcuM+Uf2S23j+bKSksmPBL\n" \
    "x2xM+q5RIp2j3kGkv9gW1v2tH4Yc29Zl51AxoYgMd3xwzOdfk7ejz3M4oYy4BDpZ\n" \
    "4i4Ud2z095yKLjQk9z4zflpE+9tepY96KxevXp2l8Vz24A/93w4wN314V2FR0oF0\n" \
    "p6i8n4rB34sP1w8wjR9sOF5nfeZo86iXjYg5iFj3oQ/dl2iPboR1A2yfn6Na5P48\n" \
    "o3DG+ZB4Yv5Z7JgGky3L6YTCaJ9S3GARLgK/1qCIEEtIvWlE284zQy8j2Ri04u5g\n" \
    "Q9P0dHe0eW0y25StzYx2MYAg9524fHj3Ww6gYAGu3vVwUvRjH/8V5nL6dG3pJWm5\n" \
    "t8/R3Y0pAcn3J11vq9wZ9c4n4/Z3yUa37H3aPJKsB5t7OywKfQJWyL2z4373p2h8\n" \
    "sL9H9zKz7C1P9t8ygWvR0i8z2M78i05v4JCo4b32iVkJOkAZ6a9v3w3vA0aneV2v\n" \
    "3bRI6F8yvVj9aD3Td62nICPeMu5n/s2gnc1yTTS4Gv9bXgz3g0x22C3o/433sUs2\n" \
    "k55C+aQ/sD4yM4Gki/2s2sKAxAmq3fC5Gg23g0sIDiubd/vHzp14Dc7m9aFCHREW\n" \

    "-----END CERTIFICATE-----\n";

// --- Global Firebase objects ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Function to sync time with NTP servers, with an HTTP fallback
void syncTime() {
    Serial.print("Syncing time");
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    time_t now = time(nullptr);
    while (now < 8 * 3600 * 2) {
        delay(500);
        Serial.print(".");
        now = time(nullptr);
    }
    Serial.println("");
    struct tm timeinfo;
    if (getLocalTime(&timeinfo, 10000)) { // 10-second timeout
        Serial.println("Time synced via NTP!");
        Serial.println(&timeinfo, "%A, %B %d %Y %H:%M:%S");
    } else {
        Serial.println("NTP Time sync failed. Trying HTTP fallback...");
        HTTPClient http;
        http.begin("http://worldtimeapi.org/api/ip");
        int httpCode = http.GET();
        if (httpCode > 0) {
            if (httpCode == HTTP_CODE_OK) {
                String payload = http.getString();
                DynamicJsonDocument doc(1024);
                deserializeJson(doc, payload);
                long unixtime = doc["unixtime"];
                timeval tv;
                tv.tv_sec = unixtime;
                settimeofday(&tv, NULL);
                Serial.println("Time synced via HTTP!");
            }
        } else {
            Serial.println("CRITICAL: HTTP Time synchronization failed. Cannot proceed.");
            Serial.println("System halted. Please check network/internet connection.");
            while(1) {
              digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
              delay(100);
            }
        }
        http.end();
    }
}

// Function to encrypt data using AES-128 CBC
String encryptData(const char* plaintext) {
    int len = strlen(plaintext);
    int padded_len = len + (16 - (len % 16));
    unsigned char *padded_input = (unsigned char *)malloc(padded_len);
    memset(padded_input, 0, padded_len);
    memcpy(padded_input, plaintext, len);

    // PKCS7 padding
    int padding = padded_len - len;
    for (int i = 0; i < padding; i++) {
        padded_input[len + i] = padding;
    }

    unsigned char encrypted_output[padded_len];
    mbedtls_aes_context aes;
    mbedtls_aes_init(&aes);
    mbedtls_aes_setkey_enc(&aes, aes_key, 128);
    mbedtls_aes_crypt_cbc(&aes, MBEDTLS_AES_ENCRYPT, padded_len, aes_iv, padded_input, encrypted_output);
    mbedtls_aes_free(&aes);

    // Base64 encode
    size_t output_size;
    unsigned char* base64_output = (unsigned char*)malloc(padded_len * 4 / 3 + 4);
    mbedtls_base64_encode(base64_output, padded_len * 4 / 3 + 4, &output_size, encrypted_output, padded_len);
    
    String result = String((char*)base64_output);

    free(padded_input);
    free(base64_output);
    
    return result;
}

// Upload sensor data once
void uploadDataOnce() {
    if (!Firebase.ready()) {
        Serial.println("Firebase not ready — retrying...");
        return;
    }

    // Generate dummy sensor data
    float temperature = random(20, 30) + (random(0, 100) / 100.0);
    float humidity = random(40, 60) + (random(0, 100) / 100.0);

    // Create a JSON object for the DHT22 data
    StaticJsonDocument<256> dhtJson;
    dhtJson["temperature"] = String(temperature, 2);
    dhtJson["humidity"] = String(humidity, 2);
    
    String dhtJsonString;
    serializeJson(dhtJson, dhtJsonString);

    // Encrypt the JSON string
    String encryptedDhtData = encryptData(dhtJsonString.c_str());

    // Create a Firebase JSON object to upload
    FirebaseJson firebaseJson;
    firebaseJson.set("encrypted_value", encryptedDhtData);
    firebaseJson.set("timestamp", ".sv", "timestamp"); // Use server value for timestamp

    String device_path = "devices/DHT22_Sensor";
    Serial.printf("Uploading encrypted data to %s... ", device_path.c_str());

    if (Firebase.RTDB.setJSON(&fbdo, device_path.c_str(), &firebaseJson)) {
        Serial.println("OK");
    } else {
        Serial.print("FAILED: ");
        Serial.println(fbdo.errorReason());
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(LED_BUILTIN, OUTPUT);

    // Connect to Wi-Fi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Connecting to Wi-Fi");
    while (WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
        delay(300);
    }
    Serial.println();
    Serial.print("Connected with IP: ");
    Serial.println(WiFi.localIP());
    Serial.println();

    // Sync time
    syncTime();

    // Configure Firebase
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;

    // Assign the certificate
    config.cert.data = root_ca_cert;

    // Sign up anonymously
    Serial.println("Signing up with Firebase (anonymously)...");
    auth.user.email = "";
    auth.user.password = "";
    Firebase.signUp(&config, &auth, "", "");
    
    // Wait for Firebase to be ready
    unsigned long startTime = millis();
    while(!Firebase.ready() && (millis() - startTime < 15000)) {
      delay(300);
      Serial.print(".");
    }
    Serial.println();
    
    if(Firebase.ready()){
      Serial.println("Firebase initialized!");
    } else {
      Serial.print("Firebase sign-up failed: ");
      Serial.println(config.signer.error_string.c_str());
    }

    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);
}

void loop() {
    uploadDataOnce();
    Serial.println("--------------------");
    // Wait for 20 seconds before the next upload
    delay(20000); 
}

    