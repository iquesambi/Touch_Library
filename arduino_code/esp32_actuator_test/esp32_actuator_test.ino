// Basic actuator test — no BLE, no OTA.
// 3 buttons, momentary (hold-to-run): B1 held = inflate, B2 held = deflate,
// B3 = everything off. Releasing B1/B2 stops the action.

const int valve1Pin = 19;
const int pump1Pin  = 18;
const int pump2Pin  = 17;
const int valve2Pin = 16;

const int button1Pin = 25; // inflate
const int button2Pin = 26; // deflate
const int button3Pin = 27; // all off

bool lastButton1 = false;
bool lastButton2 = false;
bool lastButton3 = false;

void allOff() {
  digitalWrite(valve1Pin, LOW);
  digitalWrite(valve2Pin, LOW);
  digitalWrite(pump1Pin, LOW);
  digitalWrite(pump2Pin, LOW);
  Serial.println("All OFF");
}

void inflate() {
  digitalWrite(valve1Pin, HIGH);
  digitalWrite(valve2Pin, HIGH);
  digitalWrite(pump1Pin, HIGH);
  digitalWrite(pump2Pin, LOW);
  Serial.println("Inflate");
}

void deflate() {
  digitalWrite(valve1Pin, LOW);
  digitalWrite(valve2Pin, LOW);
  digitalWrite(pump1Pin, LOW);
  digitalWrite(pump2Pin, HIGH);
  Serial.println("Deflate");
}

void setup() {
  Serial.begin(115200);

  pinMode(valve1Pin, OUTPUT);
  pinMode(valve2Pin, OUTPUT);
  pinMode(pump1Pin, OUTPUT);
  pinMode(pump2Pin, OUTPUT);
  allOff();

  pinMode(button1Pin, INPUT_PULLUP);
  pinMode(button2Pin, INPUT_PULLUP);
  pinMode(button3Pin, INPUT_PULLUP);
}

void loop() {
  bool currentButton1 = digitalRead(button1Pin) == LOW;
  bool currentButton2 = digitalRead(button2Pin) == LOW;
  bool currentButton3 = digitalRead(button3Pin) == LOW;

  // Only act (and print) on state changes, but the state itself is level-driven:
  // holding B1 keeps inflating, releasing it stops immediately.
  if (currentButton3 && !lastButton3) {
    allOff();
  } else if (currentButton1 && !lastButton1) {
    inflate();
  } else if (currentButton2 && !lastButton2) {
    deflate();
  } else if (!currentButton1 && lastButton1) {
    allOff();
  } else if (!currentButton2 && lastButton2) {
    allOff();
  }

  lastButton1 = currentButton1;
  lastButton2 = currentButton2;
  lastButton3 = currentButton3;

  delay(20); // simple debounce
}
