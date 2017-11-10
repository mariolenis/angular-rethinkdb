import {NgModule, ModuleWithProviders } from '@angular/core';
import {AngularRethinkDBService, RethinkDBAPIConfig} from './RethinkDB.service';

export {AngularRethinkDBService} from './RethinkDB.service';
export {AngularRethinkDBObservable} from './RethinkDBObservable';

@NgModule({
    providers: [AngularRethinkDBService ]
})
export class AngularRethinkDBModule { 
    static forRoot(config: RethinkDBAPIConfig): ModuleWithProviders {
        return {
            ngModule: AngularRethinkDBModule,
            providers: [
                {provide: RethinkDBAPIConfig, useValue: config }
            ]
        };
    }
}
