import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AzureCommunicationUserCredential, isCallingApplication, isCommunicationUser, isPhoneNumber } from '@azure/communication-common';
import { createClientLogger, setLogLevel } from '@azure/logger';
import { CallClient } from '@azure/communication-calling';
import { AcsService } from './acs.service';
import { AcsCallAgentService } from './acs-call-agent.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public state: any;
  public callClient: any;
  public callAgent: any;
  public destinationGroup: string;
  public defaultMeetingGroup: string;
  recordResult: boolean = false;
  isMuted: boolean = false;
  interval: any;
  time: number = 0;
  display: string;
  recordTime: number = 0;
  recorderInterval: any;
  recorderTimer: string;
  recordStatus: string = "";
  isRecordStarted: boolean = false;
  isCallStarted: boolean = false;
  status: string;
  callId: string = '';
  groupId = null;
  callerId: any;
  phqAssessment: string = '';
  gadAssessment: string = '';
  phqValue: number;
  gadValue: number;
  microphoneStatus: string = '';
  messageStatus: string='';
  acsBotStatus:string='';
  constructor(
    private activatedRoute: ActivatedRoute,
    private acsService: AcsService,
    private acsCallAgentService: AcsCallAgentService) {
    this.state = {
      showSpinner: false,
      call: undefined,
      id: undefined,
      token: "",
      streams: [],
      videoOn: true,
      micOn: true,
      onHold: false,
      screenShareOn: false,
      cameraDeviceOptions: [],
      speakerDeviceOptions: [],
      microphoneDeviceOptions: [],
      loggedIn: false,
      showCallSampleCode: false,
      showMuteUnmuteSampleCode: false,
      showHoldUnholdCallSampleCode: false,
      selectedCameraDeviceId: null,
      selectedSpeakerDeviceId: null,
      selectedMicrophoneDeviceId: null,
      showCameraNotFoundWarning: false,
      showSpeakerNotFoundWarning: false,
      showMicrophoneNotFoundWarning: false,
      showLocalVideo: true,
      showSettings: false,
    };

  }

  ngOnInit() {
    this.time = 0;
    this.acsBotStatus="Initializing bot...";
    this.activatedRoute.paramMap.subscribe(paramMap => {
      this.groupId = paramMap.get('groupId');
      console.log(this.groupId);
    });
    this.provisionNewUser();
  }

  startPHQ() {
    console.log("started");
    this.isRecordStarted = true;
    this.recordStatus = "PHQ/GAD recording started :";
    this.acsService.startRecording(this.callerId).subscribe(data => {
      console.log(data);
    });
    this.startRecorderTimer();
  }
  endPHQ() {
    console.log("stopped");
    this.isRecordStarted = false;
    this.recordStatus = "PHQ/GAD recording ended :";
    clearInterval(this.recorderInterval);
    let participantUserId = this.state.call.remoteParticipants[0].displayName.startsWith('28:acs:') ? this.state.call.remoteParticipants[1].identifier.communicationUserId.replace('8:acs:', '') : this.state.call.remoteParticipants[0].displayName.toString().replace('8:acs:', '');
    if(participantUserId===undefined || participantUserId===null){
      participantUserId="p2p_"+this.callerId;
    }
    this.acsService.stopRecording(this.callerId, participantUserId).subscribe(response => {
      console.log("Kintsgui API response:", response);
      if (response.toString() !== 'Internal Error') {
        this.recordResult = true;
        this.phqValue = JSON.parse(response.toString()).data.phq
        this.gadValue = JSON.parse(response.toString()).data.gad;
        this.assessPHQ(this.phqValue);
        this.assessGAD(this.gadValue);
      }
    },error=>{
      this.recordResult = true;
      this.phqAssessment="Connection error.";
      this.gadAssessment ="Connection error.";
    });
  }

  assessPHQ(phqValue: number) {
    if (phqValue >= 0 && phqValue <= 4) {
      this.phqAssessment = "Minimal Depression"
      document.getElementById('phqResponse').style.color = 'green';
    } else if (phqValue >= 5 && phqValue <= 9) {
      this.phqAssessment = "Mild Depression"
      document.getElementById('phqResponse').style.color = 'lightgreen';
    } else if (phqValue >= 10 && phqValue <= 14) {
      this.phqAssessment = "Moderate Depression"
      document.getElementById('phqResponse').style.color = '#C25608';
    } else if (phqValue >= 15 && phqValue <= 19) {
      this.phqAssessment = "Moderately severe Depression"
      document.getElementById('phqResponse').style.color = 'orangered';
    } else {
      this.phqAssessment = "Severe Depression"
      document.getElementById('phqResponse').style.color = 'red';
    }
  }

  assessGAD(gadValue: number) {
    if (gadValue >= 0 && gadValue <= 4) {
      this.gadAssessment = "Minimal Anxiety"
      document.getElementById('gadResponse').style.color = 'green';
    } else if (gadValue >= 5 && gadValue <= 9) {
      this.gadAssessment = "Mild Anxiety"
      document.getElementById('gadResponse').style.color = 'lightgreen';
    } else if (gadValue >= 10 && gadValue <= 14) {
      this.gadAssessment = "Moderate Anxiety"
      document.getElementById('gadResponse').style.color = '#C25608';
    } else {
      this.gadAssessment = "Severe Anxiety"
      document.getElementById('gadResponse').style.color = 'red';
    }
  }

  muteClicked() {
    if (this.isMuted) {
      this.isMuted = false;
      this.state.call.unmute();
      this.microphoneStatus = "Microphone is unmuted";
      console.log("Audio Unmuted..");
    }
    else {
      this.isMuted = true;
      this.state.call.mute();
      this.microphoneStatus = "Microphone is muted";
      console.log("Audio muted..");
    }
  }
  endCallClicked() {      
    this.microphoneStatus = "";
    this.state.call.hangUp({ forEveryone: false }).catch((e: any) => console.error(e));
    console.log("Call ended..");
  }
  startRecorderTimer() {
    this.recordTime = 0;
    this.recorderInterval = setInterval(() => {
      if (this.recordTime === 0) {
        this.recordTime++;
      } else {
        this.recordTime++;
      }
      this.recorderTimer = this.transform(this.recordTime)
    }, 1000);
  }
  startTimer() {
    this.time = 0;
    this.interval = setInterval(() => {
      if (this.time === 0) {
        this.time++;
      } else {
        this.time++;
      }
      this.display = this.transform(this.time)
    }, 1000);
  }
  transform(value: number): string {
    const minutes: number = Math.floor(value / 60);
    let finalTimer: string = "";
    if (minutes.toString().length > 1) {
      finalTimer = minutes.toString();
    }
    else {
      finalTimer = "0" + minutes.toString();
    }
    let seconds = value - minutes * 60;
    if (seconds.toString().length > 1) {
      finalTimer = finalTimer + ':' + seconds.toString();
    }
    else {
      finalTimer = finalTimer + ':0' + seconds.toString();
    }
    return finalTimer;
  }

  provisionNewUser(): void {
    this.acsService.provisionNewUserFromLocal()
      .then(async (response) => {
        this.state.id = this.getIdentifierText(response);
        this.state.token = this.getToken(response);
        console.log("calling handleLogin");
        this.handleLogIn({ id: this.state.id, token: this.state.token }).then(async ()=>{
          console.log("Handle login result completed");          
          this.acsBotStatus="Connecting to bot...";
          if (!this.groupId) {
            this.acsService.makeCall(this.state.id).subscribe(data => {                        
              this.acsBotStatus="Incoming from bot...";
              this.callerId = data;
              console.log("CallId from bot makeCall: " + this.callerId);
            },error=>{
              console.log("Bot connection error.",error);
              this.acsBotStatus="Bot connection error.";
            });
          }
          if (this.groupId) {
            this.acsService.addParticipant(this.state.id, this.groupId).subscribe(data => {                                    
              this.acsBotStatus="Connected to bot.";
            },error=>{
              console.log("Bot connection error.",error);
              this.acsBotStatus="Bot connection error.";
            });
          }
        });
        
        this.state.showSpinner = false;
        this.state.loggedIn = true;
      });
  }

  getToken = (response: any) => {
    return response.Token;
  }

  getIdentifierText = (identifier: any) => {
    identifier = identifier.User;
    console.log("identifier ", identifier);
    if (isCommunicationUser(identifier)) {
      return identifier.communicationUserId;
    } else if (isPhoneNumber(identifier)) {
      return identifier.phoneNumber;
    } else if (isCallingApplication(identifier)) {
      return identifier.callingApplicationId;
    } else {
      return 'Unknwon Identifier';
    }
  }

  handleLogIn = async (userDetails: any) => {
    if (userDetails) {
      try {
        const tokenCredential = new AzureCommunicationUserCredential(userDetails.token);
        const logger = createClientLogger('ACS');
        setLogLevel("verbose");
        logger.info((...args: any) => { console.info(...args); });
                logger.verbose.log = (...args) => { console.log(...args); };
                logger.warning.log = (...args) => { console.warn(...args); };
                logger.error.log = (...args) => { console.error(...args); };

        const options = { logger: logger };
        this.callClient = new CallClient(options);
        this.callAgent = await this.callClient.createCallAgent(tokenCredential);
        this.state.deviceManager = await this.callClient.getDeviceManager();
        await this.state.deviceManager.askDevicePermission(true, false);
        this.callAgent.updateDisplayName(userDetails.id);
        this.acsCallAgentService.acsCallAgent = this.callAgent;
        this.callAgent.on('callsUpdated', (e: { added: any[]; removed: any[]; }) => {
          console.log("call update event", e);
          console.log(`callsUpdated, added=${e.added}, removed=${e.removed}`);
          e.added.forEach(call => {
            console.log("Call event for added mobile",call);
            if (call.isIncoming) {
              console.log("Call is accepted...");
              const speakerDevice = this.state.deviceManager.getSpeakerList()[0];
              if (!speakerDevice || speakerDevice.id === 'speaker:') {
              } else if (speakerDevice) {
                this.state.deviceManager.setSpeaker(speakerDevice);
              }

              const microphoneDevice = this.state.deviceManager.getMicrophoneList()[0];
              if (!microphoneDevice || microphoneDevice.id === 'microphone:') {
              } else {
                this.state.deviceManager.setMicrophone(microphoneDevice);
              }
              call.accept({audioOptions:this.state.audioOptions}).catch((e) => console.error("Call accept error",e));        
              this.acsBotStatus="Connected to bot.";
              // if(!this.groupId)
              //   this.messageStatus="Sending message...";
            }
            else if (this.state.call === 'Disconnected') {
              this.isCallStarted = false;
              clearInterval(this.interval);
              clearInterval(this.recorderInterval);
              this.status = "Call Ended.";
              this.microphoneStatus = "";
            }
            this.state.call = call;
            this.state.callEndReason = undefined;
          });

          e.removed.forEach((call: any) => {
            if (this.state.call && this.state.call === call) {
              this.state.callEndReason = this.state.call.callEndReason;
              this.isCallStarted = false;
              clearInterval(this.interval);
              clearInterval(this.recorderInterval);
              this.status = "Call ended.";
              this.microphoneStatus = "";
              this.callAgent.dispose();
              console.log("Call agent disposed after agent removed.");
            }
          });
          this.state.deviceManager.on('audioDevicesUpdated', e => {
            e.added.forEach(audioDevice => {
              if (audioDevice.deviceType === 'Speaker') {
                this.state.speakerDeviceOptions.push({ key: audioDevice.id, text: audioDevice.name });

              } else if (audioDevice.deviceType === 'Microphone') {
                this.state.microphoneDeviceOptions.push({ key: audioDevice.id, text: audioDevice.name });
              }
            });

            e.removed.forEach(removedAudioDevice => {
              if (removedAudioDevice.deviceType === 'Speaker') {
                this.state.speakerDeviceOptions.forEach((value, index) => {
                  if (value.key === removedAudioDevice.id) {
                    this.state.speakerDeviceOptions.splice(index, 1);
                    if (removedAudioDevice.id === this.state.selectedSpeakerDeviceId) {
                      const speakerDevice = this.state.deviceManager.getSpeakerList()[0];
                      this.state.deviceManager.setSpeaker(speakerDevice);
                    }
                  }
                });
              } else if (removedAudioDevice.deviceType === 'Microphone') {
                this.state.microphoneDeviceOptions.forEach((value, index) => {
                  if (value.key === removedAudioDevice.id) {
                    this.state.microphoneDeviceOptions.splice(index, 1);
                    if (removedAudioDevice.id === this.state.selectedMicrophoneDeviceId) {
                      const microphoneDevice = this.state.deviceManager.getMicrophoneList()[0];
                      this.state.deviceManager.setMicrophone(microphoneDevice);
                    }
                  }
                });
              }
            });
          });
          this.state.call.remoteParticipants.forEach(rp => this.subscribeToRemoteParticipant(rp));
          this.state.call.on('remoteParticipantsUpdated', (re: { added: any[]; removed: any[]; }) => {
            console.log("remote participant event", re);
            console.log(`Call=${this.state.call.callId}, remoteParticipantsUpdated, added=${re.added}, removed=${re.removed}`);
            if (this.state.call.remoteParticipants.length > 1) {
              this.status = "Call Connected.";
              this.startTimer();
              this.isCallStarted = true;
            }
            re.added.forEach(p => {
              console.log('participantAdded', p);              
              this.subscribeToRemoteParticipant(p);
                this.state.call.remoteParticipants = [...this.state.call.remoteParticipants.values()];
            });
            re.removed.forEach(p => {
              console.log('participantRemoved');
              this.isCallStarted = false;
              clearInterval(this.interval);
              clearInterval(this.recorderInterval);
              this.status = "Call ended.";
              this.microphoneStatus = "";
              this.callAgent.dispose();
              console.log("Call agent disposed after participant removed.");
              this.state.call.remoteParticipants = [...this.state.call.remoteParticipants.values()];
            });
          });      
          const onCallStateChanged = () => {
            console.log('callStateChanged', this.state.call.state, this.state.call.remoteParticipants);
            if(this.state.call.state==="Connected" &&this.state.call.remoteParticipants.length===1 && this.state.call.remoteParticipants[0].displayName.startsWith("28:acs:")){
              let identitiesToCall = [];
              let phoneNumberId = { phoneNumber: "+14075367154" };
              console.log("Starting call to: ", phoneNumberId);
              console.log("Call state before addPartcipant",this.state.call, "Remote Participant",this.state.call.remoteParticipants);
              let remotePResp=this.state.call.addParticipant(phoneNumberId,{alternateCallerId:"+18883151731"});
              console.log("Remote Participants resposne:",remotePResp);
              console.log("Call state after addPartcipant",this.state.call.status, "Remote Participant",this.state.call.remoteParticipants);
              
            }
            else if(this.state.call.state==="Ringing" &&this.state.call.remoteParticipants[0].identifier.phoneNumber!==null){
              this.status = "Ringing...";
            }
            else if(this.state.call.state==="Connected" &&this.state.call.remoteParticipants[0].identifier.phoneNumber!==null){
              this.acsBotStatus="Bot connected.";
              this.status = "Call Connected.";
              this.startTimer();
              this.isCallStarted = true;
            }
  
            if (this.state.call.state !== 'None' &&
                this.state.call.state !== 'Connecting' &&
                this.state.call.state !== 'Incoming') {
            }
            if (this.state.call.state === 'Incoming') {
              console.log("call state chanegd event incoming...");
            }
        }
        onCallStateChanged();
        this.state.call.on('callStateChanged', onCallStateChanged);
        this.state.call.on('callIdChanged', () => {
        });              
        });
        
        this.state.loggedIn = true;
      } catch (error) {
        console.log(error);
      }
    }
  }

  getCallOptions() {
    let callOptions = {
      alternateCallerId:undefined,
      videoOptions: {
        localVideoStreams: undefined
      },
      audioOptions: {
        muted: false
      }
    };

    const speakerDevice = this.state.deviceManager.getSpeakerList()[0];
    if (!speakerDevice || speakerDevice.id === 'speaker:') {
      //this.setShowSpeakerNotFoundWarning(true);
      this.state.showSpeakerNotFoundWarning = true;
    } else if (speakerDevice) {
      this.state.selectedSpeakerDeviceId = speakerDevice.id;
      this.state.deviceManager.setSpeaker(speakerDevice);
    }

    const microphoneDevice = this.state.deviceManager.getMicrophoneList()[0];
    if (!microphoneDevice || microphoneDevice.id === 'microphone:') {
      this.setShowMicrophoneNotFoundWarning(true);
    } else {
      this.state.selectedMicrophoneDeviceId = microphoneDevice.id;
      this.state.deviceManager.setMicrophone(microphoneDevice);
    }

    return callOptions;
  }
  subscribeToRemoteParticipant(participant: any) {
    participant.on('participantStateChanged', () => {
        console.log('participantStateChanged', participant.identifier.communicationUserId,participant.identifier.callingApplicationId, participant.state);
        this.state.call.remoteParticipants = [...this.state.call.remoteParticipants.values()];
    });
  }
  setShowMicrophoneNotFoundWarning(show: boolean) {
    this.state.showMicrophoneNotFoundWarning = show;
  }

  setShowSpeakerFoundWarning(show: boolean) {
    this.state.showSpeakerNotFoundWarning = show;
  }

}
