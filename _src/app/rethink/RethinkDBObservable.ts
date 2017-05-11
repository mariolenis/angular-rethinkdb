import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subscription} from 'rxjs/Subscription';
import {Observable} from 'rxjs/Observable';

interface IRethinkObject {
    id?: string
}

interface IRethinkResponse {
    inserted: number;
    replaced: number;
    unchanged: number;
    errors: number;
    deleted: number;
    skipped: number;
    first_error: Error;
    generated_keys: string[]; // only for insert
}

export class RethinkDBObservable<T extends IRethinkObject> {
    private dbSubscription: Subscription;
    private db$ = new BehaviorSubject<T[]>([]);
    
    constructor (public socket: SocketIOClient.Socket) {
        this.listenFromBackend();
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
     * @param obs: { next?: (value: T[]) => void, error?: (error: any) => void, complete?: () => void }
     */
    subscribe(obs: { next?: (value: T[]) => void, error?: (error: any) => void, complete?: () => void }): Subscription {                
        // Just to make sure
        this.unsubscribe();
        this.dbSubscription = this.db$.asObservable()
            .subscribe(
                nextValue => obs.next(nextValue),
                errValue  => obs.error(errValue),
                () => obs.complete()
            );
        return this.dbSubscription;
    }
    
    unsubscribe () {
        if (!!this.dbSubscription && !this.dbSubscription.closed)
            this.dbSubscription.unsubscribe();
    }
    
    /**
     * @description Function to listen events back from nodejs + socketio
     */
    //<editor-fold defaultstate="collapsed" desc="private listenFromBackend ()comment">
    private listenFromBackend () {
        this.socket.on('Connection', (socket: SocketIOClient.Socket) => {
            socket.on('update', (data: {new_data: T, old_data: T}) => {
                let db = this.db$.value;
                
                // New
                if (!data.old_data && !!data.new_data) 
                    this.db$.next([...db, data.new_data]);
                
                // Update
                else if (!!data.old_data && !!data.new_data) {
                    this.db$.next([
                        ...db.filter(object => object.id !== data.old_data.id),
                        data.new_data
                        ]
                    );
                }
                // Delete
                else if (!!data.old_data && !data.new_data) {
                    this.db$.next([
                        ...db.filter(object => object.id !== data.old_data.id)
                    ])
                }
            })
        })
    }
    //</editor-fold>
}
