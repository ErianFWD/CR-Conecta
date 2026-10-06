module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.cjs'],
  transform: { '^.+\\.[jt]sx?$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }], ['@babel/preset-react', { runtime: 'automatic' }]] }] },
  moduleNameMapper: { '^.*constants/config$': '<rootDir>/tests/config.cjs' },
  collectCoverageFrom: ['src/components/{CampaignProjection,ProjectionPdfInput,ProjectionResultModal,ProjectionNotifications,ProjectionHistory,ConfirmationDialog}.jsx', 'src/pages/{Panel,Needs,RequestsAdmin}.jsx'],
  coverageDirectory: 'coverage/jest',
  clearMocks: true
};
