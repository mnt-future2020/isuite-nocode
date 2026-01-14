import { switchExecutor } from '../src/features/executions/components/switch/executor';

const tests = [
    {
        name: 'Switch: Match Case 1',
        data: {
            variable: 'apple',
            cases: [
                { value: 'apple', outputHandle: 'is-apple' },
                { value: 'banana', outputHandle: 'is-banana' }
            ],
            defaultHandle: 'default'
        },
        expected: { match: true, matchedValue: 'apple', __branch: 'is-apple' }
    },
    {
        name: 'Switch: Match Case 2',
        data: {
            variable: 'banana',
            cases: [
                { value: 'apple', outputHandle: 'is-apple' },
                { value: 'banana', outputHandle: 'is-banana' }
            ],
            defaultHandle: 'default'
        },
        expected: { match: true, matchedValue: 'banana', __branch: 'is-banana' }
    },
    {
        name: 'Switch: No Match (Default)',
        data: {
            variable: 'cherry',
            cases: [
                { value: 'apple', outputHandle: 'is-apple' },
                { value: 'banana', outputHandle: 'is-banana' }
            ],
            defaultHandle: 'default'
        },
        expected: { match: false, default: true, __branch: 'default' }
    },
    {
        name: 'Switch: No Match (No Default)',
        data: {
            variable: 'dragonfruit',
            cases: [
                { value: 'apple', outputHandle: 'is-apple' },
                { value: 'banana', outputHandle: 'is-banana' }
            ]
        },
        expected: { match: false, __branch: null }
    }
];

async function runTests() {
    console.log('--- Testing Switch Executor ---');
    for (const test of tests) {
        // @ts-ignore - Mocking the params
        const result = await switchExecutor({ data: test.data, context: {} });

        // Simple equality check
        const resultStr = JSON.stringify(result);
        const expectedStr = JSON.stringify(test.expected);
        const passed = resultStr === expectedStr;

        console.log(`${passed ? '✅' : '❌'} ${test.name}`);
        if (!passed) {
            console.log(`   Expected: ${expectedStr}`);
            console.log(`   Got:      ${resultStr}`);
        }
    }
}

runTests();
