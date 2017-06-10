import {Injectable} from '@angular/core';
import {AngularRethinkDBObservable} from './RethinkDBObservable';
import {IRethinkDBQuery, IRethinkDBAPIConfig} from './interfaces';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

export class RethinkDBAPIConfig implements IRethinkDBAPIConfig {
    api_key: string
    database: string
    host?: string 
    port?: number
}

@Injectable()
export class AngularRethinkDBService {
    
    constructor( private config: RethinkDBAPIConfig ) {}
    
    /**
     * @description Function to initialize event listening on db.table. 
     * 
     * @param <string> name of table
     * @param <Observable<IRethinkDBQuery>> query to be applied to db.table events, 
     * also will trigger a new query for every next value in query
     * 
     * @returns <AngularRethinkDBObservable<any[]>>
     */
    list(table: string, query$?: BehaviorSubject<IRethinkDBQuery>): AngularRethinkDBObservable<any[]> {        
        return new AngularRethinkDBObservable<any[]>(this.config, table, query$);
    }
}
