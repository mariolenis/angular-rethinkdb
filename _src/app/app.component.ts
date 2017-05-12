import { Component } from '@angular/core';
import {AngularRethinkDBService, AngularRethinkDBObservable} from './rethink/angular-rethinkdb';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'Angular-RethinkDB works!';
    counter: AngularRethinkDBObservable<{id: string, nombre: string, msg: string}[]>;
    
    constructor(public ar: AngularRethinkDBService) {
        this.counter = this.ar.list('counter');
    }
}
