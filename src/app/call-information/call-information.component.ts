import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-call-information',
  templateUrl: './call-information.component.html',
  styleUrls: ['./call-information.component.css']
})

export class CallInformationComponent implements OnInit {
  patientName = "";
  providerName = ""
  @Input() displayTimer: string = "";
  @Input() status: string = "";
  @Input() micStatus:string="";
  @Input() msgStatus:string='';
  @Input() botStatus:string='';
  constructor() {
   }

  ngOnInit() {
    this.patientName = localStorage.getItem("memberFirstName")!==null?localStorage.getItem("memberFirstName"):"You";
    let temp = localStorage.getItem("careuserName")!==null?localStorage.getItem("careuserName").split(',')[1]:"Provider";
    this.providerName = temp;
    this.displayTimer = "";
    this.micStatus="";
    this.msgStatus="";
    this.botStatus="Bot Initiated.";
  }

}
