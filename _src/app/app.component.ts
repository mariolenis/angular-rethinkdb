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
    messages: AngularRethinkDBObservable<{id: string, nombre: string, msg: string, fecha: Date}[]>;
    
    query$ = new BehaviorSubject<IRethinkDBQuery>(undefined);
    
    constructor(public ar: AngularRethinkDBService) {
        this.messages = this.ar.list('counter');
        
        this.ar.list('counter', this.query$.asObservable())
            .subscribe(res => console.log(res));
        
        this.initFilter('Mario');
    }
    
    initFilter(name: string) {
        this.query$.next({
            filter: {
                nombre: name
            }
        });
    }
}
