import { AngularRethinkdbPage } from './app.po';

describe('angular-rethinkdb App', () => {
  let page: AngularRethinkdbPage;

  beforeEach(() => {
    page = new AngularRethinkdbPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
