import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommunicationIdentityClient } from '@azure/communication-administration';

@Injectable({
  providedIn: 'root'
})
export class AcsService {

  constructor(private http: HttpClient) { }

  sendSms(phoneNumber, messageText) {
    return this.http.get("nclite/v1/sms?phone=+1" + phoneNumber + "&message=" + messageText,
      {
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token")
        }
      }
    );
  }

  sendEmail(email, messageText) {
    if(email != null && email != '' && email != undefined){
      email = email
    }else{
      email = ["amar_vankayalapati@optum.com", "srinivasrao_karnati@optum.com"];
    }
    return this.http.post("nclite/v1/notifications", {
      "notification_type": "email",
      "recipients": ['kalyana_swamy@optum.com'],
      "text": messageText
    },
      {
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token")
        }
      }
    );
  }

  makeCall(acsId) {
    return this.http.post("https://ovc-acsbot-poc.optum.com/api/makeCall",{
      "ACSId": acsId
    }     
    );
  }

  addParticipant(acsId, groupId){
    return this.http.post(`https://ovc-acsbot-poc.optum.com/api/calls/${groupId}/addParticipant`,{
      "ACSId": acsId
    }     
    );
    
  }

  

  async provisionNewUser():  Promise<string> {
    let response = await fetch('https://dev-ecp-commhubacs-function-app-79ec.azurewebsites.net/api/getACSAccessToken', {
        method: 'GET',
        headers: {
            'x-functions-key': 'aY3xaHvcdK04OYXgLkiJnggHaOPDnuEtICZi7Ox9e7JZKdi0CX7FzA==',
            'Content-Type': 'application/json'
        }
    })
    .catch((error) => {
       console.log("Error fetching token..", error);
     })

    if (response)
    {
        return await response.json();
    }
    return null;
    //throw new Error('Invalid token response');
  }

  provisionNewUserFromLocal = async ()  => {

    const connectionString = "endpoint=https://ovcp-acs.communication.azure.com/;accesskey=FCaLaOqAsK/JKPKuQ6gCB+uQWT4LiZHZT3uyRfuatck2kcbmaNOZEnfaIWUGKA4ow1qhkJWG/X2Bxr/mXeC+HA==";

    const tokenClient = new CommunicationIdentityClient(connectionString);

    const user = await tokenClient.createUser();

    const userToken = await tokenClient.issueToken(user, ["voip"]);

    return {
        "User" : userToken.user,
        "Token": userToken.token,
        "ExpiresOn": userToken.expiresOn
    }

  }

  startRecording(groupId){
    return this.http.post(`https://ovc-acsbot-poc.optum.com/api/calls/${groupId}/startPHQ`,{});
  }

  stopRecording(groupId,acsId){
    return this.http.post(`https://ovc-acsbot-poc.optum.com/api/calls/${groupId}/endPHQ/${acsId}`,{});
  }
  endAudioCall(groupId){
    return this.http.delete(`https://ovc-acsbot-poc.optum.com/api/calls/${groupId}`,{});
  }
  
}
