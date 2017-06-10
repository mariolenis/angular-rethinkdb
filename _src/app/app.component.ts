import {Component} from '@angular/core';
import {AngularRethinkDBService, AngularRethinkDBObservable, IRethinkDBQuery} from './rethink/angular-rethinkdb';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'Angular-RethinkDB works!';
    messages: AngularRethinkDBObservable<{id?: string, name: string, msg: string, date: Date}[]>;
    
    query$ = new BehaviorSubject<IRethinkDBQuery>(undefined);
    
    constructor(public ar: AngularRethinkDBService) {
        this.messages = this.ar.list('counter');
        
        this.initFilter('Mario');
        
        this.ar.list('counter', this.query$)
            .subscribe(res => console.log(res));
    }
    
    initFilter(name: string) {
        this.query$.next({
            filter: {
                nombre: name
            }
        });
    }
    
    sendMessage(msg: string): void {
        this.messages.push({
            name: 'visitor',
            msg: msg,
            date: new Date()
        }).subscribe(res => console.log(res))      
    }
}
