import { act } from "react";

const model = {
    midiInputs: [],
    midiOutputs: [],
    selectedInput: null,
    selectedOutput: null,
    single_device: true,
    midiAuth: false,
    serialPort: null,
    writer: null,
    reader: null,
    readData: [],
    zones: 1,
    currentTouch: { touch: [], name: null, tube: null, date: "4/10" },
    receivedArray: [],
    testPersist: [],
    library: [{ touch: [], name: "dragon Touch", tube: null, date: "4/10", created: "Henrique", description: "a dragon touch" }, { touch: [], name: "dragon Touch II", tube: null, date: "4/10", created: "Henrique", description: "a dragon touch" },{ touch: [], name: "weird Touch", tube: null, date: "4/10", created: "Henrique", description: "a dragon touch" }, { touch: [], name: "eletric feeling", tube: null, date: "4/10", created: "Henrique", description: "a dragon touch" }],
    isSerialConnected: false,
    side: false,
    pot:49,
    touchName: undefined,
    isListening: false,
    pressureArray:[],
    multiZoneWiP:[],
    mZCurrent:  { pad: 0, time: 500, velocity: 80, action: 'Inflation' },

    addMZpad(pad){
        this.mZCurrent.pad=pad
    },

     addMZtime(time){
        this.mZCurrent.time=time
    },

    addMZvelocity(velocity){
        this.mZCurrent.velocity=velocity
    },

     addMZaction(action){
        this.mZCurrent.action=action
    },

appenMZ() {
  const newAction = { ...this.mZCurrent };
  const updated = [...this.multiZoneWiP, newAction];
  const grouped = updated.reduce((acc, action) => {
    if (!acc[action.pad]) acc[action.pad] = [];
    acc[action.pad].push(action);
    return acc;
  }, {});

  const ordered = Object.keys(grouped)
    .sort((a, b) => Number(a) - Number(b))
    .flatMap(pad => grouped[pad]);

  this.multiZoneWiP = ordered;
},

 performMultiZoneSequence(actions) {
  const result = {};

  this.multiZoneWiP.forEach(action => {
    const pad = action.pad;
    if (!result[pad]) {
      result[pad] = [];
    }
    result[pad].push(action);
  });

  console.log(result)
  this.performGroupedMIDISequences(result)
},

 performMultiZoneSequenceReplay(actions) {
  const result = {};

  actions.forEach(action => {
    const pad = action.pad;
    if (!result[pad]) {
      result[pad] = [];
    }
    result[pad].push(action);
  });

  console.log(result)
  this.performGroupedMIDISequences(result)
},



async performGroupedMIDISequences(groupedActions) {
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const padToNotes = {
    0: { inflate: 36, deflate: 37, full: 50 },
    1: { inflate: 38, deflate: 39, full: 51 },
    2: { inflate: 40, deflate: 41, full: 52 },
    3: { inflate: 42, deflate: 43, full: 53 },
    4: { inflate: 44, deflate: 45, full: 54 },
    5: { inflate: 46, deflate: 47, full: 55 },
    6: { inflate: 48, deflate: 49, full: 56 },
  };

  const padPromises = Object.values(groupedActions).map(async (actions) => {
    for (const act of actions) {
      const pad = act.pad;
      const time = act.time;
      const velocity = act.velocity;
      const actionType = act.action.toLowerCase();

      if (actionType === 'holding') {
        await sleep(time);
      } else if (actionType === 'inflation' || actionType === 'deflation') {
        const note = actionType === 'inflation'
          ? padToNotes[pad]?.inflate
          : padToNotes[pad]?.deflate;

        if (note === undefined) {
          console.error(`No MIDI note mapped for pad ${pad}`);
          continue;
        }

        this.buttonDownNote(note, velocity);
        await sleep(time);
        this.buttonUpNote(note);

      } else if (actionType === 'full deflation') {
        const fullNote = padToNotes[pad]?.full;

        if (fullNote === undefined) {
          console.error(`No full deflation note mapped for pad ${pad}`);
          continue;
        }

        this.buttonDownNote(fullNote, 100);
        await sleep(10);
        this.buttonUpNote(fullNote);
        await sleep(time);  // Optional: wait after full deflation before next action

      } else {
        console.error(`Unknown action type: ${act.action}`);
      }
    }
  });

  await Promise.all(padPromises);
  console.log("All pad sequences complete.");
},



async  old() {
  const sequencesByPad = {};

  // Group actions by pad
  for (const item of this.multiZoneWiP) {
    const pad = item.pad;
    if (!sequencesByPad[pad]) sequencesByPad[pad] = [];
    sequencesByPad[pad].push(item);
  }

  const actionMap = {
    'Inflation': 'inflate',
    'Deflation': 'deflate',
    'Holding': 'hold'
  };

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Launch one async sequence per pad
  const promises = Object.entries(sequencesByPad).map(async ([padStr, actions]) => {
    const pad = parseInt(padStr);
    const midiNote = 36 + (pad * 2);

    for (const action of actions) {
      const velocity = action.velocity;
      const duration = action.time;
      const actionType = actionMap[action.action];

      if (actionType === 'inflate' || actionType === 'deflate' || actionType === 'hold') {
        model.recordEvent(`${actionType}${pad}`, 'press', velocity);
        model.buttonDownNote(midiNote, velocity);
        await sleep(duration);
        model.buttonUpNote(midiNote);
      } else {
        // For unknown actions, just wait
        await sleep(duration);
      }
    }
  });

  await Promise.all(promises); // Wait for all zones to finish
},


    changeName(name){
        this.touchName = name
    },

    changePot(x){
        this.pot = x
    },

    midiRecording: [],  
    isRecording: false,  
    recordingStartTime: null, 

    recording:false,
    sequence:[],
    lastEventTime:null,

    // Function to toggle MIDI recording state
    toggleRecording() {
        this.isRecording = !this.isRecording;
        if (this.isRecording) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    },

    startRecording() {
        this.recording = true;
        this.sequence = [];
        this.lastEventTime = Date.now();
        console.log("Recording started...");
        this.startSerialRead()
      },
    
   
      recordEvent(button, type, pot, singleReadingPressure) {
        if (!this.recording) return;
    
        const now = Date.now();
        const timeSinceLast = this.lastEventTime ? now - this.lastEventTime : 0;
        this.lastEventTime = now;
    
        const event = {
            button,       
            type,         
            pot,                     // Velocity from potentiometer or MIDI
            singleReadingPressure,   // New value added here
            timestamp: now,
            interval: timeSinceLast,
        };
    
        this.sequence.push(event);
    
        console.log(event);
    },
    
    lastPressure:0,
    
    async startSerialRead() {
        if (!this.serialPort || this.reader) return; // Prevent multiple readers
    
        this.reader = this.serialPort.readable.getReader();
        console.log("Serial reading started...");
    
        while (this.recording) {  // Read only when recording is active
            try {
                const { value, done } = await this.reader.read();
                if (done) break;
    
                if (value) {
                    this.lastPressure = parseInt(value.trim()); // Save the latest pressure value
                    console.log("Updated pressure:", this.lastPressure);
                }
            } catch (error) {
                console.error("Error reading serial data:", error);
                break;
            }
        }
    
        // Release the reader when done
        this.reader.releaseLock();
        this.reader = null;
    },
    
      stopRecording() {
        this.recording = false;
        console.log("Recording stopped.");
        console.log("Recorded sequence:", this.sequence);
        return this.sequence;
      },
    
      getSequence() {
        return this.sequence;
      },
    

    userDisplay: "undefined",

    changeUser(){
        this.userDisplay = this.user.displayName
        console.log(this.userDisplay)
    },

   
   // startRecording() {
     //   this.midiRecording = [];  
       // this.recordingStartTime = performance.now(); 
    //    console.log("MIDI recording started.");
    //},

  
    stopRecording() {
        console.log("MIDI recording stopped.");
    },

    recordMIDIMessage(status, note, velocity) {
        if (!this.isRecording) return;

        const timestamp = performance.now() - this.recordingStartTime;
        this.midiRecording.push({
            status,
            note,
            velocity,
            timestamp
        });
        console.log(`Recorded MIDI message: [status: ${status}, note: ${note}, velocity: ${velocity}, time: ${timestamp}]`);
        console.log(this.midiRecording)
    },

    async playbackRecording() {
        if (!this.midiRecording.length) {
            console.log("No MIDI sequence recorded.");
            return;
        }

        let previousTimestamp = 0;

        for (let i = 0; i < this.midiRecording.length; i++) {
            const { status, note, velocity, timestamp } = this.midiRecording[i];
            const delay = timestamp - previousTimestamp;
            await new Promise(resolve => setTimeout(resolve, delay));
            this.sendMidiMessage(status, note, velocity); 
            previousTimestamp = timestamp;
        }

        console.log("MIDI playback completed.");
    },

    sendMidiMessage(status, note, velocity) {
        if (this.selectedOutput) {
            const midiMessage = [status, note, velocity];
            this.selectedOutput.send(midiMessage);
            console.log(`Sent MIDI message: [status: ${status}, note: ${note}, velocity: ${velocity}]`);
        } else {
            console.error("No MIDI output device selected.");
        }
    },

    async connectToSerialAndMIDI() {
        try {
            console.log("Connecting to Serial and MIDI...");
            await this.connectToSerial();
            await this.initializeMIDI();

            console.log("Successfully connected to both Serial and MIDI.");
        } catch (error) {
            console.error("Error connecting to Serial or MIDI:", error);
        }
    },

    async initializeMIDI() {
        try {
            const midiAccess = await navigator.requestMIDIAccess();
            this.midiInputs = Array.from(midiAccess.inputs.values());
            this.midiOutputs = Array.from(midiAccess.outputs.values());

            // Automatically select the first MIDI input and output
            if (this.midiInputs.length > 0) {
                this.selectedInput = this.midiInputs[0];
                console.log(`Selected MIDI Input: ${this.selectedInput.name}`);
            }

            if (this.midiOutputs.length > 0) {
                this.selectedOutput = this.midiOutputs[0];
                console.log(`Selected MIDI Output: ${this.selectedOutput.name}`);
            }

            // Set midiAuth to true if a device is selected
            if (this.selectedInput && this.selectedOutput) {
                this.midiAuth = true;
                console.log("MIDI devices authenticated.");

                // Listen for MIDI input (including note 127)
               // this.listenForMIDI();
            }
        } catch (error) {
            console.error('Web MIDI API not supported in this browser.', error);
        }
    },

    toggleMIDIListener() {
        if (this.isListening) {
            this.stopListeningForMIDI();
        } else {
            this.listenForMIDI();
        }
    },


    stopListeningForMIDI() {
        if (this.selectedInput) {
            this.isListening = false; // Set flag to false when listening stops
            this.selectedInput.onmidimessage = null; // Remove the MIDI event listener
            console.log("MIDI listener stopped.");
        }
    },


listenForMIDI() {
    if (this.selectedInput) {
        this.isListening = true;
        let pressureParts = {};       // For notes 20 and 22 (continuous readings)
        let singleParts = {};         // For notes 10 and 11 (single readings)
        this.pressureArray = [];      // Array to store pressure values
        let singleReadingPressure = null; // To store a single reading value from notes 10 and 11

        this.selectedInput.onmidimessage = (message) => {
            const [status, note, velocity] = message.data;
            const command = status & 0xf0;

            let type;
            if (command === 0x90 && velocity > 0) {
                type = 'press';
            } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
                type = 'release';
            } else {
                return; // Ignore other messages
            }

            // Handle continuous pressure from notes 20 & 22
            if (note === 20 || note === 22) {
                if (velocity === 0) {
                    delete pressureParts[note];
                    return;
                }

                pressureParts[note] = velocity;

                if (pressureParts[20] !== undefined && pressureParts[22] !== undefined) {
                    const intPart = pressureParts[20];
                    const decimalPart = pressureParts[22];
                    const pressureValue = parseFloat(`${intPart}.${decimalPart.toString().padStart(2, '0')}`);

                    if (pressureValue !== 0) {
                        this.pressureArray.push(pressureValue);
                    }

                    console.log("Pressure Array:", this.pressureArray);
                    pressureParts = {};
                }

                return;
            }

            // Handle single reading from notes 10 & 11
            if (note === 10 || note === 11) {
                if (velocity === 0) {
                    delete singleParts[note];
                    return;
                }

                singleParts[note] = velocity;

                if (singleParts[10] !== undefined && singleParts[11] !== undefined) {
                    const intPart = singleParts[10];
                    const decimalPart = singleParts[11];
                    singleReadingPressure = parseFloat(`${intPart}.${decimalPart.toString().padStart(2, '0')}`);

                    console.log("Single Reading Pressure:", singleReadingPressure);

                    singleParts = {};
                }

                return;
            }

            // Handle all other note messages
            let button;
            switch (note) {
                case 60:
                    button = 'inflate';
                    break;
                case 67:
                    button = 'deflate';
                    break;
                default:
                    button = `note-${note}`;
            }

            this.recordEvent(button, type, velocity, singleReadingPressure);
        };
    } else {
        console.error("No MIDI input selected for listening.");
    }
},

    
    
    
    async performMIDISequence(x) {
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        for (let i = 0; i < x.length; i += 4) {
            let action = parseInt(x[i]);   // Position 1: Action
            let time = parseInt(x[i + 1]); // Position 2: Time in milliseconds
            let velocity = parseInt(x[i + 2]); // Position 3: Velocity
    
            switch (action) {
                case 1:
                    model.buttonDownNote(67, velocity);  // Middle B
                    await sleep(time);
                    model.buttonUpNote(67);
                    break;
                case 2:
                    model.buttonDownNote(60, velocity);  // Middle C
                    await sleep(time);
                    model.buttonUpNote(60);
                    break;
                case 3:
                    model.buttonDownNote(71, velocity);  // Middle A
                    await sleep(time);
                    model.buttonUpNote(71);
                    break;
                case 4:
                    await sleep(time);  // Idle
                    break;
                default:
                    console.error(`Unknown action: ${action}`);
            }
        }
    },

    async connectToSerial() {
        try {
            // Request a port and open a connection
            this.serialPort = await navigator.serial.requestPort();
            await this.serialPort.open({ baudRate: 9600 });
            console.log("Serial port connected");

            this.isSerialConnected = true;  // Set isSerialConnected to true when connected
            this.writer = this.serialPort.writable.getWriter();
            this.reader = this.serialPort.readable.getReader();
            this.readSerialData();
        } catch (error) {
            console.error("Failed to connect to serial port:", error);
            this.isSerialConnected = false;
        }
    },

    addName(input) {
        this.currentTouch.name = input;
    },

    addAuthor(input) {
        this.currentTouch.created = input;
    },

    addCreator() {
        if (this.model.user) {
            this.currentTouch.created = this.model.user.displayName;
        } else {
            this.currentTouch.created = "unknown";
        }
    },

    addTube(input) {
        this.currentTouch.tube = input;
    },

    verifySaving() {
        if (this.currentTouch.name) {
            this.saveToLibrary();
        } else {
            console.log("it needs a name");
        }
    },

    saveToLibrary() {
        this.currentTouch.touch = this.receivedArray;
        this.testPersist = [...this.testPersist, this.currentTouch];
        this.currentTouch = { touch: [] };
    },

    addDescription(input) {
        this.currentTouch.description = input;
    },

    addArray() {
        this.currentTouch.touch.push(this.receivedArray);
    },

    increaseZone() {
        if (this.zones <= 5) {
            this.zones = this.zones + 1;
        }
    },

    addZones() {
        this.currentTouch.zones = this.zones;
    },

    decreaseZone() {
        if (this.zones > 1) {
            this.zones = this.zones - 1;
        }
    },

    setMidiInput(x) {
        this.selectedInput = this.midiInputs[x];
    },

    setMidiOutput(output) {
        this.selectedOutput = output;
    },

    getMidiInputs() {
        return this.midiInputs;
    },

    getMidiOutputs() {
        return this.midiOutputs;
    },

    selectArray() {
        console.log(this.testPersist[0].touch);
    },

    changeSingle() {
        this.single_device = !this.single_device;
    },

    sendMidiNote(note, velocity) {
        if (this.selectedOutput) {
            const noteOnMessage = [0x90, note, velocity];
            const noteOffMessage = [0x80, note, 0];
            this.selectedOutput.send(noteOnMessage);
            console.log(`MIDI Note ${note} sent with velocity ${velocity}`);
            setTimeout(() => {
                this.selectedOutput.send(noteOffMessage);
                console.log(`MIDI Note ${note} off`);
            }, 500);  // Note off after 500ms
        } else {
            console.error("No MIDI output device selected.");
        }
    },

    requestArray() {
        if (this.selectedOutput || this.serialPort) {
            this.sendMidiNote(127, 127);
        }
    },

    buttonDownNote(note, velocity) {
        if (this.selectedOutput) {
            const noteOnMessage = [0x90, note, velocity];
            this.selectedOutput.send(noteOnMessage);
            console.log(`MIDI Note ${note} button down with velocity ${velocity}`);
        }
    },

    buttonUpNote(note) {
        if (this.selectedOutput) {
            const noteOffMessage = [0x80, note, 0];
            this.selectedOutput.send(noteOffMessage);
            console.log(`MIDI Note ${note} button up`);
        }
    },

    toggleMenu(){
        if (this.side == true){
            this.side = false
        }else{
            this.side = true
        }
    },

    readSerialData: async function () {
        while (this.serialPort.readable) {
            try {
                const { value, done } = await this.reader.read();
                if (done) {
                    console.log('Serial port closed');
                    this.reader.releaseLock();
                    break;
                }
                if (value) {
                    this.readData.push(value);
                }
            } catch (error) {
                console.error('Error reading data:', error);
            }
        }
    },

    replaying: false, // Track replay state

    async playbackSequence() {
        if (!this.sequence.length) {
            console.log("No recorded sequence to play.");
            return;
        }
    
        if (this.replaying) {
            console.log("Already replaying...");
            return;
        }
    
        console.log("Starting playback...");
        this.replaying = true;
    
        for (let i = 0; i < this.sequence.length; i++) {
            if (!this.replaying) {
                console.log("Playback stopped.");
                return;
            }
    
            const { button, type, pot, interval } = this.sequence[i];
    
            await new Promise(resolve => setTimeout(resolve, interval));
    
            let note = button === "inflate" ? 60 : 67;
            let velocity = pot;
    
            if (type === "press") {
                this.buttonDownNote(note, velocity);
            } else if (type === "release") {
                this.buttonUpNote(note);
            }
    
            console.log(`Played: ${button} (${type}) with MIDI note ${note} and velocity ${velocity}`);
        }
    
        this.replaying = false;
        console.log("Playback complete.");
    },
    
    stopReplay() {
        if (!this.replaying) {
            console.log("No active replay to stop.");
            return;
        }
        console.log("Stopping replay...");
        this.replaying = false;
    }, 

    savesequence(sequence){
        this.sequence = sequence
    }
    
    
};

export {model}
