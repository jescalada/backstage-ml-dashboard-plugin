import { myCustomPlugin } from './plugin';

describe('my-custom', () => {
  it('should export plugin', () => {
    expect(myCustomPlugin).toBeDefined();
  });
});
