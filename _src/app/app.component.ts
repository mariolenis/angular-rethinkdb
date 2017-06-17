import {Component} from '@angular/core';
import {AngularRethinkDBService, AngularRethinkDBObservable, IRethinkDBQuery} from './rethink/angular-rethinkdb';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import * as Hashids from 'Hashids';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    autor: string = "";
    hashids: { encode: (x: number, y: number, z: number) => string };
    
    title = 'Angular-RethinkDB works!';
    messages: AngularRethinkDBObservable<{id?: string, name: string, msg: string, date: Date}[]>;
    
    query$ = new BehaviorSubject<IRethinkDBQuery>(undefined);
    
    constructor(public ar: AngularRethinkDBService) {
        
        // Create a visitor id
        this.hashids = new Hashids('Angular-RethinkDB', 6, 'abcdefghijklmnopqrstuvwxyz123456789');
        this.autor = 'visitor-' + this.hashids.encode(Math.round(Math.random() * 10), Math.round(Math.random() * 10), Math.round(Math.random() * 10));
        
        // Create an object attached to table 'chat'
        this.messages = this.ar.list('chat', this.query$);
        
        // Filter | Order | limit
        this.query$.next({
            orderBy: 'date'
        });
    }
    
    sendMessage(msg: string): void {
        this.messages.push({
            name: this.autor,
            msg: msg,
            date: new Date()
        }).subscribe(res => console.log(res))      
    }
}
