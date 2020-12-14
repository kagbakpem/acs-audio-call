import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlSegment } from '@angular/router';

import { AppComponent } from './app.component';
import { CallInformationComponent } from './call-information/call-information.component';
import { AcsCallAgentService } from './acs-call-agent.service';
import { AcsService } from './acs.service';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    CallInformationComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot([])
  ],
  providers: [AcsService,AcsCallAgentService],
  bootstrap: [AppComponent]
})
export class AppModule { }
