import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AngularRethinkDBModule } from './ng-rethinkdb';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AngularRethinkDBModule.forRoot({
        api_key: 'AAAA-BBBBB-CCCCC',
        database: 'flownter',
        auth_table: 'usuario',
        host: 'http://192.168.10.139:3100'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
