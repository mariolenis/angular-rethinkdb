import {Http, Response} from '@angular/http';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subscription} from 'rxjs/Subscription';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import * as io from 'socket.io-client';

import {IRethinkDBAPIConfig, IRethinkObject, IRethinkFilter, IRethinkResponse} from './interfaces'

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/mergeMap';

export class AngularRethinkDBObservable<T extends IRethinkObject> {
    
    private http$: Http;
    private table: string;
    private db: string;
    private db$ = new BehaviorSubject<T[]>([]);
    
    private API_URL: string;
    
    constructor(config: IRethinkDBAPIConfig, http: Http, table: string, filter?: IRethinkFilter) {
        
        this.http$  = http;        
        this.table  = table;
        this.db     = config.database;
        this.API_URL = (!!config.host ? config.host : '') + (!!config.port ? ':' + config.port : '');
        
        // Initialize object and creates the namespace
        this.initDBObject()
            .map(data => this.db$.next(data))
            .flatMap(() => this.initSocketIO())
            .flatMap(socket => this.listenFromBackend(socket))
            .subscribe();
    }
    
    private initDBObject(): Observable<T[]> {        
        // TODO: query table with filter
        return this.http$.post(this.API_URL + '/api/list', {db: this.db, table: this.table})
            .map(res => res.json());
    }
    
    private initSocketIO(): Observable<SocketIOClient.Socket> {        
        return new Observable((o: Observer<SocketIOClient.Socket>) => {
            // Connect de socket to the host and join to room according to db
            let socket = io(this.API_URL);            
            socket.emit('join', JSON.stringify({db: this.db, table: this.table}));
            o.next(socket);
            o.complete();
        });
    }
    
    push(newObject: T): Observable<IRethinkResponse> {
        // TODO: push data to db
        return new Observable();
    }
    
    remove(index: {indexName: string, indexValue: string}): Observable<IRethinkResponse> {
        // TODO: remove data at db
        return new Observable();
    }
    
    update(object: T): Observable<IRethinkResponse> {
        // TODO: update data at db        
        return new Observable();
    }
    
    /**
     * @description Subscribe to BehaviorSubject passing the observer to subscription
     * @param next?: (value: T[]) => void
     * @param error?: (error: any) => void
     * @param complete?: () => void
     * @returns Subscription
     */
    subscribe(next?: (value: T[]) => void, error?: (error: any) => void, complete?: () => void ): Subscription {
        return this.db$.asObservable().subscribe(next, error, complete);
    }
    
    /**
     * @description Function to listen events back from nodejs + socketio
     * @param socket: SocketIOClient.Socket
     * @returns Observable
     */
    //<editor-fold defaultstate="collapsed" desc="private listenFromBackend ()">
    private listenFromBackend(socket: SocketIOClient.Socket): Observable<string> {

        console.log(socket)
        return new Observable((o: Observer<string>) => {
            
            socket.on('disconnect', data => {
                // Re join to room
                socket.emit('join', JSON.stringify({db: this.db, table: this.table}));
            })
            
            // Listen events fired to this.table
            socket.on(this.table, (predata: string) => {

                o.next(predata);
                let data: {new_val: T, old_val: T} = JSON.parse(predata);
                
                // Current "state"
                let db = this.db$.value;

                // New
                if (!data.old_val && !!data.new_val) 
                    this.db$.next([...db, data.new_val]);

                // Update
                else if (!!data.old_val && !!data.new_val) {
                    this.db$.next([
                        ...db.filter(object => object.id !== data.old_val.id),
                        data.new_val
                        ]
                    );
                }

                // Delete
                else if (!!data.old_val && !data.new_val) {
                    this.db$.next([
                        ...db.filter(object => object.id !== data.old_val.id)
                    ])
                }
            });
            return () => {
                socket.disconnect();
            }
        });
        
        
    }
    //</editor-fold>
}
