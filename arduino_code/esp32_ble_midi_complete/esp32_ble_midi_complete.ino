// ESP32 + BLE MIDI, complete but basic — no OTA.
//
// - 3 buttons (momentary, hold-to-run): B1 = inflate, B2 = deflate, B3 = all off.
//   Pressing a button both drives the actuators locally AND sends the matching
//   MIDI note (velocity comes from the potentiometer), so a connected DAW/app
//   sees the same thing a physical press does. Releasing B1/B2 (or the matching
//   MIDI note-off) doesn't fully stop — it enters hold(): inflate valve off,
//   deflate valve on, both pumps off. Only B3 / note 70 goes to allOff()
//   (both valves off, both pumps off).
// - Incoming MIDI notes 60/67/70 drive the exact same actuator actions, so it
//   works identically whether triggered by button or by BLE MIDI.
// - Pressure (MPRLS) is sent continuously at 20Hz regardless of button/MIDI state.
//
// Required libraries (Library Manager):
//   - "BLE-MIDI" by lathoub          (BLEMIDI_Transport + hardware/BLEMIDI_ESP32.h)
//   - "MIDI Library" by Forty Seven Effects (dependency of BLE-MIDI, provides the MIDI.* API)
//   - "Adafruit MPRLS Library" (+ Adafruit BusIO)
//
// Pin mapping from the schematic (U2 module -> ULN2803A driver), same as the other sketches.

#include <Wire.h>
#include <Adafruit_MPRLS.h>

#include <BLEMIDI_Transport.h>
#include <hardware/BLEMIDI_ESP32.h>

BLEMIDI_CREATE_INSTANCE("Touch Library IV", MIDI)

// --- Actuators ---
const int valve1Pin = 19;
const int pump1Pin  = 18;
const int pump2Pin  = 17;
const int valve2Pin = 16;

// --- Buttons (momentary) ---
const int button1Pin = 25; // inflate
const int button2Pin = 26; // deflate
const int button3Pin = 27; // all off

// --- Potentiometer (drives pump PWM power AND outgoing MIDI velocity) ---
const int potPin = 34;

// --- BLE connection status LED ---
const int bleLedPin = 4;

bool lastButton1 = false;
bool lastButton2 = false;
bool lastButton3 = false;

const int midiChannel = 1;
const byte noteInflate = 60;
const byte noteDeflate = 67;
const byte noteStop = 70;

// Notes for pressure data
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

int readPotPower() {
  return map(analogRead(potPin), 0, 4095, 0, 255);
}

int readPotVelocity() {
  return map(readPotPower(), 0, 255, 0, 127);
}

void allOff() {
  digitalWrite(valve1Pin, LOW);
  digitalWrite(valve2Pin, LOW);
  analogWrite(pump1Pin, 0);
  analogWrite(pump2Pin, 0);
  Serial.println("All OFF");
}

// Entered when an inflate/deflate button (or MIDI note) is released, before
// the explicit "off" trigger — seals the chamber: inflate valve closed,
// deflate valve open, both pumps off. Not the same as allOff(), which also
// closes the deflate valve.
void hold() {
  digitalWrite(valve1Pin, LOW);
  digitalWrite(valve2Pin, HIGH);
  analogWrite(pump1Pin, 0);
  analogWrite(pump2Pin, 0);
  Serial.println("Hold");
}

void inflate(int power) {
  digitalWrite(valve1Pin, HIGH);
  digitalWrite(valve2Pin, HIGH);
  analogWrite(pump1Pin, power);
  analogWrite(pump2Pin, 0);
  Serial.printf("Inflate (power=%d)\n", power);
}

void deflate(int power) {
  digitalWrite(valve1Pin, LOW);
  digitalWrite(valve2Pin, LOW);
  analogWrite(pump1Pin, 0);
  analogWrite(pump2Pin, power);
  Serial.printf("Deflate (power=%d)\n", power);
}

// --- Incoming MIDI -> same actions as the buttons ---

void handleNoteOn(byte channel, byte note, byte velocity) {
  Serial.printf("Note on: channel %d, note %d, velocity %d\n", channel, note, velocity);
  int power = map(velocity, 0, 127, 0, 255);

  if (note == noteInflate) {
    inflate(power);
  } else if (note == noteDeflate) {
    deflate(power);
  } else if (note == noteStop) {
    allOff();
  }
}

void handleNoteOff(byte channel, byte note, byte velocity) {
  Serial.printf("Note off: channel %d, note %d, velocity %d\n", channel, note, velocity);

  if (note == noteInflate || note == noteDeflate) {
    hold();
  }
}

// --- Buttons -> actuators + outgoing MIDI ---

void checkButtons() {
  bool currentButton1 = digitalRead(button1Pin) == LOW;
  bool currentButton2 = digitalRead(button2Pin) == LOW;
  bool currentButton3 = digitalRead(button3Pin) == LOW;
  int power = readPotPower();       // 0-255, drives pump PWM
  int velocity = readPotVelocity(); // 0-127, sent as MIDI velocity

  static unsigned long lastDebugPrint = 0;
  if (millis() - lastDebugPrint > 500) {
    Serial.printf("DEBUG pot raw=%d power=%d velocity=%d | B1=%d B2=%d B3=%d\n",
                  analogRead(potPin), power, velocity, currentButton1, currentButton2, currentButton3);
    lastDebugPrint = millis();
  }

  if (currentButton3 && !lastButton3) {
    allOff();
    sendMIDINoteOn(noteStop, velocity);
    sendMIDINoteOff(noteStop);
  } else if (currentButton1) {
    if (!lastButton1) sendMIDINoteOn(noteInflate, velocity);
    inflate(power); // re-applied every loop, so turning the pot while held updates speed live
  } else if (currentButton2) {
    if (!lastButton2) sendMIDINoteOn(noteDeflate, velocity);
    deflate(power);
  } else if (lastButton1) {
    hold();
    sendMIDINoteOff(noteInflate);
  } else if (lastButton2) {
    hold();
    sendMIDINoteOff(noteDeflate);
  }

  lastButton1 = currentButton1;
  lastButton2 = currentButton2;
  lastButton3 = currentButton3;
}

void sendContinuousPressure() {
  float p1 = pressureSensor.readPressure();
  float p2 = pressureSensor.readPressure();
  float pressure = (p1 + p2) / 2.0;
  float psi = pressure / 68.947572932;

  int intPart = constrain((int)psi, 0, 127);
  int decPart = constrain((int)((psi - intPart) * 100), 0, 99);

  sendMIDINoteOn(pressureIntNoteSeries, intPart);
  sendMIDINoteOn(pressureDecNoteSeries, decPart);
  delay(1);
  sendMIDINoteOff(pressureIntNoteSeries);
  sendMIDINoteOff(pressureDecNoteSeries);
}

void setup() {
  Serial.begin(115200);
  Wire.begin();

  pinMode(valve1Pin, OUTPUT);
  pinMode(valve2Pin, OUTPUT);
  pinMode(pump1Pin, OUTPUT);
  pinMode(pump2Pin, OUTPUT);
  allOff();

  pinMode(button1Pin, INPUT_PULLUP);
  pinMode(button2Pin, INPUT_PULLUP);
  pinMode(button3Pin, INPUT_PULLUP);

  pinMode(bleLedPin, OUTPUT);
  digitalWrite(bleLedPin, LOW);

  if (!pressureSensor.begin()) {
    while (1); // Halt if sensor not found
  }

  BLEMIDI.setHandleConnected([]() {
    digitalWrite(bleLedPin, HIGH);
    Serial.println("BLE MIDI connected");
  });
  BLEMIDI.setHandleDisconnected([]() {
    digitalWrite(bleLedPin, LOW);
    Serial.println("BLE MIDI disconnected");
  });

  MIDI.begin();
  MIDI.setHandleNoteOn(handleNoteOn);
  MIDI.setHandleNoteOff(handleNoteOff);
}

void loop() {
  MIDI.read();
  checkButtons();

  if (millis() - lastPressureSendTime >= pressureInterval) {
    sendContinuousPressure();
    lastPressureSendTime = millis();
  }

  delay(5);
}
