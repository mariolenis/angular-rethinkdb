import {Http, Response} from '@angular/http';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subscription} from 'rxjs/Subscription';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import * as io from 'socket.io-client';

import {IRethinkDBAPIConfig, IRethinkObject, IRethinkDBFilter, IRethinkResponse} from './interfaces'

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/mergeMap';

export class AngularRethinkDBObservable<T extends IRethinkObject> {
    
    private db: string;
    private db$ = new BehaviorSubject<T[]>([]);
    
    private API_URL: string;
    
    constructor(private config: IRethinkDBAPIConfig, private http$: Http, private table: string, filter$?: Observable<IRethinkDBFilter>) {
        
        this.db      = this.config.database;
        this.API_URL = (!!config.host ? config.host : '') + (!!config.port ? ':' + config.port : '');
        
        // Creates a namespace to listen events and populate db$ with new data triggered by filter observable
        this.initSocketIO(io(this.API_URL))
            .map(socket => this.listenFromBackend(socket, filter$).subscribe())
            .flatMap(() => this.queryDBObject(filter$))
            .subscribe(
                data => this.db$.next(data),
                err  => console.error(err)
            );
    }
    
    /**
     * @description Emits join message to room related with changes on db.table
     * @param new SocketIO
     * @returns Observable<Socket>
     * @throws Observable error if the request is unauthorized
     */
    //<editor-fold defaultstate="collapsed" desc="initSocketIO(socket: SocketIOClient.Socket): Observable<SocketIOClient.Socket>">
    private initSocketIO(socket: SocketIOClient.Socket): Observable<SocketIOClient.Socket> {        
        return new Observable((o: Observer<SocketIOClient.Socket>) => {
            // Connect de socket to the host and join to room according to db            
            socket.emit('join', JSON.stringify({ db: this.db, table: this.table, api_key: this.config.api_key }), (response: string) => {
                if (response.indexOf('err') > -1 )
                    o.error('Unauthorized api_key to ' + this.db);
                else
                    o.next(socket);
                o.complete();
            });            
        });
    }
    //</editor-fold>
    
    /**
     * @description function to query data from db; if filter$ is passed it will trigger a new query 
     * canceling (if it is still on) the previus query.
     * 
     * @param optional <Observable<IRethinkDBFilter>>filter : observable of filters over time
     * @returns Observable of T[]
     */
    //<editor-fold defaultstate="collapsed" desc="queryDBObject(filter$?: Observable<IRethinkDBFilter>): Observable<T[]>">
    private queryDBObject(filter$?: Observable<IRethinkDBFilter>): Observable<T[]> { 
        
        if (!!filter$) {
            // Every new value of filter will trigger a new query
            return filter$
                .map(filter => Object.assign({db: this.db, table: this.table, api_key: this.config.api_key}, {filter: filter}))
                .switchMap(queryBody => this.http$.post(this.API_URL + '/api/filter', queryBody))
                .map(res => res.json());
        } 
        else {
            return this.http$.post(this.API_URL + '/api/list', {db: this.db, table: this.table, api_key: this.config.api_key })
                .map(res => res.json());
        }
    }
    //</editor-fold>
    
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
    //<editor-fold defaultstate="collapsed" desc="subscribe(next?: (value: T[]) => void, error?: (error: any) => void, complete?: () => void ): Subscription">
    subscribe(next?: (value: T[]) => void, error?: (error: any) => void, complete?: () => void ): Subscription {
        return this.db$.asObservable().subscribe(next, error, complete);
    }
    //</editor-fold>
    
    /**
     * @description Function to listen events back from nodejs + socketio
     * @param socket: SocketIOClient.Socket
     * @returns Observable
     */
    //<editor-fold defaultstate="collapsed" desc="listenFromBackend(namespace: SocketIOClient.Socket, filter$: Observable<IRethinkDBFilter>): Observable">
    private listenFromBackend(namespace: SocketIOClient.Socket, filter$: Observable<IRethinkDBFilter>): Observable<string> {

        return new Observable((o: Observer<string>) => {
            
            namespace.on('disconnect', (disconnMsg: string) => {
                // Re join to room
                this.initSocketIO(namespace).subscribe();
            });
            
            namespace.on('err', (errorMessage: string) => {
                this.db$.error(errorMessage);
            });
            
            // Listen events fired to this.table
            namespace.on(this.table, (predata: string) => {

                o.next(predata);
                let data: {new_val: T, old_val: T} = JSON.parse(predata);
                
                // Current "state"
                let db = this.db$.value;

                // New data
                if (!data.old_val && !!data.new_val) 
                    this.db$.next([...db, data.new_val]);

                // Update data
                else if (!!data.old_val && !!data.new_val && db.filter(object => object.id === data.new_val.id).length > 0) {
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
                namespace.disconnect();
            }
        });
        
    }
    //</editor-fold>
}
