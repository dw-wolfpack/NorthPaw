const { execSync } = require('child_process');
const path = require('path');

describe('Screen Compilation & Type Safety Guard', () => {
  it('passes strict TypeScript type checking across all app screens with zero errors', () => {
    const projectRoot = path.resolve(__dirname, '../../');
    expect(() => {
      execSync('npx tsc --noEmit', { cwd: projectRoot, encoding: 'utf-8' });
    }).not.toThrow();
  });
});
