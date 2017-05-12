import {Http, Response} from '@angular/http';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subscription} from 'rxjs/Subscription';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import * as io from 'socket.io-client';

import {IRethinkDBAPIConfig, IRethinkObject, IRethinkFilter, IRethinkResponse} from './interfaces'

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/mergeMap';

export class AngularRethinkDBObservable<T extends IRethinkObject> {
    
    private db: string;
    private db$ = new BehaviorSubject<T[]>([]);
    
    private API_URL: string;
    
    constructor(private config: IRethinkDBAPIConfig, private http$: Http, private table: string, filter?: IRethinkFilter) {
        
        this.db      = this.config.database;
        this.API_URL = (!!config.host ? config.host : '') + (!!config.port ? ':' + config.port : '');
        
        // Initialize object and creates the namespace
        this.initDBObject()
            .map(data => this.db$.next(data))
            .map(() => io(this.API_URL))
            .flatMap(socket => this.initSocketIO(socket))
            .flatMap(socket => this.listenFromBackend(socket))
            .subscribe();
    }
    
    private initDBObject(): Observable<T[]> {        
        // TODO: query table with filter
        return this.http$.post(this.API_URL + '/api/list', {db: this.db, table: this.table, api_key: this.config.api_key })
            .map(res => res.json());
    }
    
    private initSocketIO(socket: SocketIOClient.Socket): Observable<SocketIOClient.Socket> {        
        return new Observable((o: Observer<SocketIOClient.Socket>) => {
            // Connect de socket to the host and join to room according to db            
            socket.emit('join', JSON.stringify({ db: this.db, table: this.table, api_key: this.config.api_key }));
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

        return new Observable((o: Observer<string>) => {
            
            socket.on('disconnect', (disconnMsg: string) => {
                // Re join to room
                this.initSocketIO(socket).subscribe();
            });
            
            socket.on('err', (errorMessage: string) => {
                this.db$.error(errorMessage);
            });
            
            // Listen events fired to this.table
            socket.on(this.table, (predata: string) => {

                o.next(predata);
                let data: {new_val: T, old_val: T} = JSON.parse(predata);
                
                // Current "state"
                let db = this.db$.value;

                // New data
                if (!data.old_val && !!data.new_val) 
                    this.db$.next([...db, data.new_val]);

                // Update data
                else if (!!data.old_val && !!data.new_val) {
                    this.db$.next([
                        ...db.filter(object => object.id !== data.old_val.id),
                        data.new_val
                        ]
                    );
                }

                // Delete data
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
