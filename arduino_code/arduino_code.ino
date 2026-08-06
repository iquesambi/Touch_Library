#include <Wire.h>
#include <Adafruit_MPRLS.h>
#include <MIDIUSB.h>

int enA = 6;
int enB = 9;
int valve1 = 8;
int valve2 = 7;
const int buttonPin1 = 10;
const int buttonPin2 = 16;
const int buttonPin3 = 14;
const int potPin = A0;

bool lastButton1 = false;
bool lastButton2 = false;
bool lastButton3 = false;

const int midiChannel = 1;
const byte middleC = 60;
const byte middleG = 67;
const byte middleB = 71;

// Notes for pressure data
const byte pressureIntNote = 10;
const byte pressureDecNote = 11;
const byte pressureIntNoteSeries = 20;
const byte pressureDecNoteSeries = 22;

Adafruit_MPRLS pressureSensor = Adafruit_MPRLS(-1, -1);

unsigned long lastPressureSendTime = 0;
const unsigned long pressureInterval = 50; // 20 Hz = every 50 ms

void sendMIDINoteOn(byte note, byte velocity) {
  midiEventPacket_t noteOn = {0x09, 0x90 | ((midiChannel - 1) & 0x0F), note, velocity};
  MidiUSB.sendMIDI(noteOn);
  MidiUSB.flush();
}

void sendMIDINoteOff(byte note) {
  midiEventPacket_t noteOff = {0x08, 0x80 | ((midiChannel - 1) & 0x0F), note, 0};
  MidiUSB.sendMIDI(noteOff);
  MidiUSB.flush();
}

void setup() {
  pinMode(enA, OUTPUT);
  pinMode(enB, OUTPUT);
  pinMode(valve1, OUTPUT);
  pinMode(valve2, OUTPUT);
  pinMode(buttonPin1, INPUT_PULLUP);
  pinMode(buttonPin2, INPUT_PULLUP);
  pinMode(buttonPin3, INPUT_PULLUP);

  Serial.begin(9600);
  Wire.begin();

  if (!pressureSensor.begin()) {
    while (1); // Halt if sensor not found
  }
}

void loop() {
  checkIncomingMIDI();
  checkButtons();

  // Send pressure data at 20Hz
  if (millis() - lastPressureSendTime >= pressureInterval) {
    sendContinuousPressure();
    lastPressureSendTime = millis();
  }

  delay(5); // small delay to avoid CPU overuse
}

void checkButtons() {
  bool currentButton1 = digitalRead(buttonPin1) == LOW;
  bool currentButton2 = digitalRead(buttonPin2) == LOW;
  bool currentButton3 = digitalRead(buttonPin3) == LOW;
  int potValue = map(analogRead(potPin), 0, 1023, 0, 255);

  if (currentButton1 && !lastButton1) {
    startMotorAndMIDI(1, potValue);
  } else if (!currentButton1 && lastButton1) {
    stopMotorAndMIDI(1);
  }

  if (currentButton2 && !lastButton2) {
    startMotorAndMIDI(2, potValue);
  } else if (!currentButton2 && lastButton2) {
    stopMotorAndMIDI(2);
  }

  if (currentButton3 && !lastButton3) {
    startMotorAndMIDI(3, potValue);
  } else if (!currentButton3 && lastButton3) {
    stopMotorAndMIDI(3);
  }

  lastButton1 = currentButton1;
  lastButton2 = currentButton2;
  lastButton3 = currentButton3;
}

void startMotorAndMIDI(int buttonNumber, int potValue) {
  byte note = 0;

  if (buttonNumber == 1) {
     Serial.print("test");
    Serial.println(potValue);
    analogWrite(enB,potValue);
    //analogWrite(enB, potValue);
    digitalWrite(valve1, HIGH);
    digitalWrite(valve2, HIGH);
    note = middleC;
  } else if (buttonNumber == 2) {
    analogWrite(enA, potValue);
    digitalWrite(valve1, LOW);
    digitalWrite(valve2, LOW);
    note = middleG;
  } else if (buttonNumber == 3) {
    analogWrite(enA, 0);
    digitalWrite(valve1, LOW);
    digitalWrite(valve2, LOW);
    note = middleB;
  }

  sendMIDINoteOn(note, map(potValue, 0, 255, 0, 127));
}

void stopMotorAndMIDI(int buttonNumber) {
  byte note = 0;

  if (buttonNumber == 1) {
    analogWrite(enB, 0);
    note = middleC;
  } else if (buttonNumber == 2) {
    analogWrite(enA, 0);
    digitalWrite(valve1, LOW);
    digitalWrite(valve2, HIGH);
    note = middleG;
  } else if (buttonNumber == 3) {
    digitalWrite(valve1, LOW);
    digitalWrite(valve2, LOW);
    note = middleB;
  }

  // Wait for the motor/valve to settle without starving the incoming MIDI
  // queue — a plain delay(200) here used to block MidiUSB.read() long enough
  // that queued note-on messages got lost during a replay burst.
  unsigned long waitStart = millis();
  while (millis() - waitStart < 200) {
    checkIncomingMIDI();
  }

  // Read the pressure after motor action
  float p1 = pressureSensor.readPressure();
  delay(2);  // Small delay between reads
  float p2 = pressureSensor.readPressure();
  float pressure = (p1 + p2) / 2.0;
  float psi = pressure / 68.947572932;

  sendMIDINoteOff(note);

  // Send integer and decimal pressure as separate MIDI notes (10 and 11)
  int intPart = constrain((int)psi, 0, 127);
  int decPart = constrain((int)((psi - intPart) * 100), 0, 99);

  sendMIDINoteOn(pressureIntNote, intPart);
  sendMIDINoteOn(pressureDecNote, decPart);
  delay(5);  // Short delay to avoid message collision
  sendMIDINoteOff(pressureIntNote);
  sendMIDINoteOff(pressureDecNote);

  // Output for debugging
  Serial.print("Pressure (PSI): ");
  Serial.println(psi, 2);
  Serial.print("MIDI Int: ");
  Serial.print(intPart);
  Serial.print(", Dec: ");
  Serial.println(decPart);
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

void checkIncomingMIDI() {
  midiEventPacket_t rx;
  while ((rx = MidiUSB.read()).header != 0) {
    if (rx.byte1 == 0x90 && rx.byte2 == middleC && rx.byte3 > 0) {
      startMotorAndMIDI(1, map(rx.byte3, 0, 127, 0, 255));
    } else if (rx.byte1 == 0x90 && rx.byte2 == middleG && rx.byte3 > 0) {
      startMotorAndMIDI(2, map(rx.byte3, 0, 127, 0, 255));
    }

    if (rx.byte1 == 0x80 && rx.byte2 == middleC) {
      stopMotorAndMIDI(1);
    } else if (rx.byte1 == 0x80 && rx.byte2 == middleG) {
      stopMotorAndMIDI(2);
    }
  }
}
