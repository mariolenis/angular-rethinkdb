import {Component} from '@angular/core';
import {AngularRethinkDBService, AngularRethinkDBObservable, IRethinkDBQuery} from './rethink/angular-rethinkdb';
import {Subject} from 'rxjs/Subject';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'Angular-RethinkDB works!';
    messages: AngularRethinkDBObservable<{id: string, nombre: string, msg: string, fecha: Date}[]>;
    
    query$ = new Subject<IRethinkDBQuery>();
    filteredMessages: AngularRethinkDBObservable<{id: string, nombre: string, msg: string}[]>;
    
    constructor(public ar: AngularRethinkDBService) {
        this.messages = this.ar.list('counter');
        this.filteredMessages = this.ar.list('counter', this.query$.asObservable());
        
        this.filteredMessages.subscribe(res => console.log(res));
        
        setTimeout(() => this.initFilter('Mario'), 250);
    }
    
    initFilter(name: string) {
        this.query$.next({
            filter: {
                nombre: name
            }
        });
    }
}
