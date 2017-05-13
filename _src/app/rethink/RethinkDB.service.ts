import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {AngularRethinkDBObservable} from './RethinkDBObservable';
import {IRethinkDBFilter, IRethinkDBAPIConfig} from './interfaces';
import {Observable} from 'rxjs/Observable';

export class RethinkDBAPIConfig implements IRethinkDBAPIConfig {
    api_key: string
    database: string
    host?: string 
    port?: number
}

@Injectable()
export class AngularRethinkDBService {
    
    private r: {db: string, table: string, ngRDB: Object}[] = [];

    constructor( private config: RethinkDBAPIConfig, private http$: Http ) {}
    
    /**
     * @description Function to initialize event listening on db.table. This function also
     * stores a collection in memory every AngularRethinkDBObservable to avoid multiple creation 
     * of listeners for db.table 
     * 
     * @param <string> table: name of table
     * @param <Observable<IRethinkDBFilter>> filter$ : Filter to be applied to db.table events, 
     * also will trigger a new query for every next value on filter$
     * 
     * @returns AngularRethinkDBObservable
     */
    list(table: string, filter$?: Observable<IRethinkDBFilter>): AngularRethinkDBObservable<any[]> {
        
        let ngRethinkDBObjects = this.r.filter(r => r.db === this.config.database && r.table === table)
        if (ngRethinkDBObjects.length === 0) { 
                       
            let ngRethinkDBObject = new AngularRethinkDBObservable<any[]>(this.config, this.http$, table, filter$);
            this.r.push({
                db: this.config.database,
                table: table,
                ngRDB: ngRethinkDBObject
            });
            return ngRethinkDBObject;
            
        } else 
            return ngRethinkDBObjects.pop().ngRDB as AngularRethinkDBObservable<any[]>;
    }
}
