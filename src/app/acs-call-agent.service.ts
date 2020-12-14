import { Injectable } from '@angular/core';

@Injectable()
export class AcsCallAgentService{
    acsCallAgent:any;
    constructor() { }
    get data(): any{
        return this.acsCallAgent;
      }
    
    set data(val: any){
        this.acsCallAgent = val;
      }
}