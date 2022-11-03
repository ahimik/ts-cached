// eslint-disable-next-line no-undef
module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine', 'karma-typescript'],
        browsers: ['ChromeHeadlessNoSandbox'],
        reporters: ['progress', 'karma-typescript'],
        files: [
            'spec/**/*.ts',
            'src/**/*.ts'
        ],
        preprocessors: {
            '**/*.ts': 'karma-typescript'
        },
        karmaTypescriptConfig: {
            tsconfig: './tsconfig.test.json',
            reports: {
                lcovonly: {
                    "directory": "coverage",
                    "subdirectory": "lcov",
                    "filename": "coverage.xml",
                }
            }
        },
        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox']
            }
        },
        singleRun: true
    });
};
