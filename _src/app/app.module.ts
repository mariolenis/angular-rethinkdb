import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import {AngularRethinkDBModule} from './rethink/angular-rethinkdb';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AngularRethinkDBModule.forRoot({
        api_key: 'AAAA-BBBBB-CCCCC',
        database: 'realtime',
        host: 'http://localhost:3200'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
