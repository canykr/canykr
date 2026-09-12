/**
 * Testler yalnızca saf mantık katmanını (src/lib, src/services) kapsar;
 * React Native bileşenleri için native bir çalışma ortamı gerekmediğinden
 * düz Node ortamında hızlıca çalışır.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          target: 'es2021',
          lib: ['es2021'],
          strict: true,
          types: ['jest', 'node'],
          esModuleInterop: true,
          moduleResolution: 'node',
          skipLibCheck: true,
        },
      },
    ],
  },
};
