# angular-rethinkdb
This is a angular module for RethinkDB realtime using Observables and Socket.io-client

## Usage
```
@Component({
    ...
})
export class Component {
    ...
    constructor(private ar: AngularRethink) {
        this.ar.database('mydb').list('myTable')
            .subscribe((listObjects: AngularRethinkObservable<any[]>) => {
                console.log(listObjects);
            });
    }
}
```
Any change on ```myTable``` will be published on subscribe method