import nodemon from 'nodemon';

nodemon({
  script: 'src/index.ts',
  ext: 'ts',
  exec: 'ts-node',
  watch: ['src'],
  ignore: ['src/**/*.test.ts', 'node_modules'],
});

nodemon
  .on('start', () => {
    console.log('🔄 Starting server...');
  })
  .on('quit', () => {
    console.log('👋 Server stopped');
    process.exit();
  })
  .on('restart', (files: string[]) => {
    console.log('🔄 Restarting due to changes in:', files);
  });
