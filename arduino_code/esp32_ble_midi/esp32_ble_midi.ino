// ESP32 + MIDI over BLE, merged from three sources:
//   1. Pin mapping: taken from this board's actual schematic (U2 module -> ULN2803A driver).
//   2. Pump/valve orchestration logic: ported from a previously-tested BLE MIDI sketch for
//      this same kit (note 60 = inflate, 67 = deflate, 70 = stop).
//   3. Pressure sensing (MPRLS) + Wi-Fi/OTA: carried over from the other sketch — the
//      reference sketch in #2 didn't have a pressure sensor.
//
// Required libraries (Library Manager):
//   - "BLE-MIDI" by lathoub          (BLEMIDI_Transport + hardware/BLEMIDI_ESP32.h)
//   - "MIDI Library" by Forty Seven Effects (dependency of BLE-MIDI, provides the MIDI.* API)
//   - "Adafruit MPRLS Library" (+ Adafruit BusIO)
//   - "ArduinoOTA" ships with the ESP32 board package, no separate install needed.
//
// Board: any ESP32 (classic/WROOM/WROVER). Arduino-ESP32 core >= 3.0.
//
// I2C (Wire) uses the ESP32 defaults: SDA=21, SCL=22 — matches the schematic and does NOT
// collide with the valve/pump pins below (unlike an earlier draft that put a pump on GPIO21).
//
// OTA: the ESP32 runs Wi-Fi (station mode) and BLE at the same time — the radio is
// shared/time-multiplexed by the IDF coexistence layer, so this works, but expect
// brief MIDI jitter while Wi-Fi is transmitting (mainly during the OTA transfer
// itself, not during idle operation). If Wi-Fi isn't available at boot, the sketch
// times out and continues in BLE-MIDI-only mode instead of hanging — you can still
// upload OTA later once the network is reachable and the device is running this build.

#include <Wire.h>
#include <Adafruit_MPRLS.h>

#include <BLEMIDI_Transport.h>
#include <hardware/BLEMIDI_ESP32.h>

#include <WiFi.h>
#include <ESPmDNS.h>
#include <ArduinoOTA.h>

BLEMIDI_CREATE_INSTANCE("Touch Library", MIDI)

// --- OTA / Wi-Fi config ---
const char* otaHostname = "touch-library-esp32";
const char* wifiSsid = "Minúsculas Bobeiras";
const char* wifiPassword = "Bobeirinhas91";
const char* otaPassword = "admin"; // set to "" to disable auth (not recommended)
const unsigned long wifiConnectTimeoutMs = 8000;

// Pin mapping from the schematic: V1AM/V2AM/V3AM/V4AM -> ULN2803A -> VALVE1/PUMP1/PUMP2/VALVE2
const int valve1Pin = 19;
const int pump1Pin  = 18;
const int pump2Pin  = 17;
const int valve2Pin = 16;

bool bleConnected = false;

const int midiChannel = 1;
const byte noteInflate = 60;
const byte noteDeflate = 67;
const byte noteStop = 70;

// Notes for pressure data
const byte pressureIntNote = 10;
const byte pressureDecNote = 11;
const byte pressureIntNoteSeries = 20;
const byte pressureDecNoteSeries = 22;

Adafruit_MPRLS pressureSensor = Adafruit_MPRLS(-1, -1);

unsigned long lastPressureSendTime = 0;
const unsigned long pressureInterval = 50; // 20 Hz = every 50 ms

void sendMIDINoteOn(byte note, byte velocity) {
  MIDI.sendNoteOn(note, velocity, midiChannel);
}

void sendMIDINoteOff(byte note) {
  MIDI.sendNoteOff(note, 0, midiChannel);
}

void allActuatorsOff() {
  digitalWrite(valve1Pin, LOW);
  digitalWrite(valve2Pin, LOW);
  digitalWrite(pump1Pin, LOW);
  digitalWrite(pump2Pin, LOW);
}

void handleNoteOn(byte channel, byte note, byte velocity) {
  Serial.printf("Note on: channel %d, note %d, velocity %d\n", channel, note, velocity);

  if (note == noteInflate) {
    digitalWrite(valve1Pin, HIGH);
    digitalWrite(valve2Pin, HIGH);
    digitalWrite(pump1Pin, HIGH);
    digitalWrite(pump2Pin, LOW);
  } else if (note == noteDeflate) {
    digitalWrite(valve1Pin, LOW);
    digitalWrite(valve2Pin, LOW);
    digitalWrite(pump1Pin, LOW);
    digitalWrite(pump2Pin, HIGH);
  } else if (note == noteStop) {
    allActuatorsOff();
  }
}

void handleNoteOff(byte channel, byte note, byte velocity) {
  Serial.printf("Note off: channel %d, note %d, velocity %d\n", channel, note, velocity);

  if (note == noteInflate || note == noteDeflate) {
    digitalWrite(valve1Pin, HIGH);
    digitalWrite(valve2Pin, LOW);
    digitalWrite(pump1Pin, LOW);
    digitalWrite(pump2Pin, LOW);
  } else if (note == noteStop) {
    allActuatorsOff();
  }
}

void setup() {
  pinMode(valve1Pin, OUTPUT);
  pinMode(valve2Pin, OUTPUT);
  pinMode(pump1Pin, OUTPUT);
  pinMode(pump2Pin, OUTPUT);
  allActuatorsOff();

  Serial.begin(115200);
  Wire.begin();

  if (!pressureSensor.begin()) {
    while (1); // Halt if sensor not found
  }

  BLEMIDI.setHandleConnected([]() {
    bleConnected = true;
    Serial.println("BLE MIDI connected");
  });
  BLEMIDI.setHandleDisconnected([]() {
    bleConnected = false;
    Serial.println("BLE MIDI disconnected");
  });

  MIDI.begin();
  MIDI.setHandleNoteOn(handleNoteOn);
  MIDI.setHandleNoteOff(handleNoteOff);

  setupOTA();
}

void loop() {
  ArduinoOTA.handle();
  MIDI.read();

  // Send pressure data at 20Hz
  if (millis() - lastPressureSendTime >= pressureInterval) {
    sendContinuousPressure();
    lastPressureSendTime = millis();
  }

  delay(5); // small delay to avoid CPU overuse
}

void setupOTA() {
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false); // reduces Wi-Fi/BLE coexistence jitter
  WiFi.begin(wifiSsid, wifiPassword);

  Serial.print("Connecting to Wi-Fi for OTA");
  unsigned long connectStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - connectStart < wifiConnectTimeoutMs) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi not available — continuing in BLE-MIDI-only mode.");
    WiFi.mode(WIFI_OFF);
    return;
  }

  Serial.print("Wi-Fi connected, IP: ");
  Serial.println(WiFi.localIP());

  ArduinoOTA.setHostname(otaHostname);
  if (strlen(otaPassword) > 0) {
    ArduinoOTA.setPassword(otaPassword);
  }

  ArduinoOTA.onStart([]() {
    // Safety: make sure pumps/valves aren't left running mid-flash-write.
    allActuatorsOff();
    Serial.println("OTA update starting...");
  });
  ArduinoOTA.onEnd([]() {
    Serial.println("OTA update complete, rebooting...");
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("OTA progress: %u%%\r", (progress * 100) / total);
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("OTA error [%u]\n", error);
  });

  ArduinoOTA.begin();
  Serial.println("OTA ready.");
}

void sendContinuousPressure() {
  float p1 = pressureSensor.readPressure();
  float p2 = pressureSensor.readPressure();
  float pressure = (p1 + p2) / 2.0;
  float psi = pressure / 68.947572932;

  int intPart = constrain((int)psi, 0, 127);
  int decPart = constrain((int)((psi - intPart) * 100), 0, 99);

  // Send integer and decimal parts using notes 20 and 22 at 20 Hz
  sendMIDINoteOn(pressureIntNoteSeries, intPart);
  sendMIDINoteOn(pressureDecNoteSeries, decPart);
  delay(1);  // Brief delay
  sendMIDINoteOff(pressureIntNoteSeries);
  sendMIDINoteOff(pressureDecNoteSeries);
}
