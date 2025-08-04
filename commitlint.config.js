export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            [
                'feat', // fitur baru
                'fix', // perbaikan bug
                'docs', // dokumentasi
                'style', // formatting, missing semi colons, etc; no code change
                'refactor', // refactoring production code
                'test', // adding tests, refactoring test; no production code change
                'chore', // updating build tasks, package manager configs, etc; no production code change
                'perf', // performance improvements
                'ci', // continuous integration related
                'build', // build system or external dependencies
                'revert', // reverting changes
            ],
        ],
        'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
        'subject-empty': [2, 'never'],
        'subject-full-stop': [2, 'never', '.'],
        'type-case': [2, 'always', 'lower-case'],
        'type-empty': [2, 'never'],
    },
}
