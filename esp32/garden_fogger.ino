/*
 * ============================================================
 * Garden Fogger — ESP32 Arduino Sketch
 * ============================================================
 *
 * Required libraries (install via Arduino Library Manager):
 *   - "DHT sensor library" by Adafruit
 *   - "Adafruit Unified Sensor" by Adafruit
 *   - "ArduinoJson" by Benoit Blanchon
 *
 * Board setting: Tools > Board > ESP32 Dev Module
 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ── WiFi ─────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ── Your deployed Vercel URL (no trailing slash) ──────────────
const char* BASE_URL = "https://your-app.vercel.app";

// ── Must match ESP32_API_SECRET in your .env ──────────────────
const char* API_SECRET = "your-super-secret-key-here";

// ── Device ID — must match the row in the devices table ───────
const char* DEVICE_ID = "garden_1";

// ── DHT sensor ───────────────────────────────────────────────
#define DHT_PIN  4        // GPIO pin wired to DHT DATA
#define DHT_TYPE DHT22    // Change to DHT11 if that's your sensor
DHT dht(DHT_PIN, DHT_TYPE);

// ── Relay ─────────────────────────────────────────────────────
#define RELAY_PIN 5       // GPIO pin wired to relay IN

// Most relay modules are ACTIVE LOW:
//   LOW  → relay energised → fogger ON
//   HIGH → relay released  → fogger OFF
// If yours is active HIGH, swap the two lines below.
#define RELAY_ON  LOW
#define RELAY_OFF HIGH

// ── Polling intervals ─────────────────────────────────────────
const unsigned long SEND_INTERVAL_MS    = 5000;  // Send sensor data every 5 s
const unsigned long COMMAND_INTERVAL_MS = 3000;  // Fetch command every 3 s

unsigned long lastSendTime    = 0;
unsigned long lastCommandTime = 0;

// ─────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n🌿 Garden Fogger booting…");

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, RELAY_OFF);  // safe default: fogger OFF

  dht.begin();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Connected: " + WiFi.localIP().toString());
}

// ─────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;
    sendSensorData();
  }

  if (now - lastCommandTime >= COMMAND_INTERVAL_MS) {
    lastCommandTime = now;
    fetchAndApplyCommand();
  }
}

// ── Send temperature + humidity to Next.js API ────────────────
void sendSensorData() {
  float humidity    = dht.readHumidity();
  float temperature = dht.readTemperature();  // Celsius

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("⚠️  DHT read failed — skipping.");
    return;
  }

  Serial.printf("📊 Temp: %.1f°C  Humidity: %.1f%%\n", temperature, humidity);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi disconnected.");
    return;
  }

  HTTPClient http;
  String url = String(BASE_URL) + "/api/sensor-data";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-secret", API_SECRET);

  StaticJsonDocument<128> doc;
  doc["device_id"]   = DEVICE_ID;
  doc["temperature"] = temperature;
  doc["humidity"]    = humidity;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  if (code > 0) {
    Serial.printf("✅ POST /api/sensor-data → %d\n", code);
  } else {
    Serial.printf("❌ POST failed: %s\n", http.errorToString(code).c_str());
  }
  http.end();
}

// ── Fetch fogger command and apply to relay ───────────────────
void fetchAndApplyCommand() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(BASE_URL) + "/api/device-command?device_id=" + DEVICE_ID;
  http.begin(url);

  int code = http.GET();
  if (code == 200) {
    String payload = http.getString();
    Serial.println("📡 Command: " + payload);

    StaticJsonDocument<64> doc;
    DeserializationError err = deserializeJson(doc, payload);
    if (!err) {
      bool foggerOn = doc["fogger"].as<bool>();
      digitalWrite(RELAY_PIN, foggerOn ? RELAY_ON : RELAY_OFF);
      Serial.printf("🔧 Relay → %s\n", foggerOn ? "ON" : "OFF");
    }
  } else {
    Serial.printf("❌ GET /api/device-command → %d\n", code);
  }
  http.end();
}
