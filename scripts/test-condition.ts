import { conditionExecutor } from '../src/features/executions/components/condition/executor';

const tests = [
    {
        name: 'Condition: equals (success)',
        data: { variable: 'test', operator: 'equals', value: 'test' },
        expected: { conditionMet: true, __branch: 'true' }
    },
    {
        name: 'Condition: equals (fail)',
        data: { variable: 'test', operator: 'equals', value: 'other' },
        expected: { conditionMet: false, __branch: 'false' }
    },
    {
        name: 'Condition: contains (success)',
        data: { variable: 'hello world', operator: 'contains', value: 'world' },
        expected: { conditionMet: true, __branch: 'true' }
    },
    {
        name: 'Condition: greater_than (success)',
        data: { variable: '100', operator: 'greater_than', value: '50' },
        expected: { conditionMet: true, __branch: 'true' }
    }
];

async function runTests() {
    console.log('--- Testing Condition Executor ---');
    for (const test of tests) {
        // @ts-ignore
        const result = await conditionExecutor({ data: test.data, context: {} });
        const passed = JSON.stringify(result) === JSON.stringify(test.expected);
        console.log(`${passed ? '✅' : '❌'} ${test.name}`);
    }
}

runTests();
