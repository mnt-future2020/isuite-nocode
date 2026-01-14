import { resolveExpressions } from '../src/lib/expression-engine';

const context = {
    user: {
        name: 'Antigravity',
        email: 'ai@example.com',
        details: {
            age: 25
        }
    },
    trigger: {
        id: '123'
    }
};

const tests = [
    {
        name: 'Simple property',
        input: 'Hello {{ user.name }}',
        expected: 'Hello Antigravity'
    },
    {
        name: 'Nested property',
        input: 'Age is {{ user.details.age }}',
        expected: 'Age is 25'
    },
    {
        name: 'Multiple expressions',
        input: 'User {{ user.name }} ({{ user.email }})',
        expected: 'User Antigravity (ai@example.com)'
    },
    {
        name: 'Object resolution',
        input: { msg: 'ID: {{ trigger.id }}' },
        expected: { msg: 'ID: 123' }
    },
    {
        name: 'Missing path',
        input: '{{ missing.path }}',
        expected: '{{ missing.path }}'
    }
];

console.log('--- Testing Expression Engine ---');
tests.forEach(test => {
    const result = resolveExpressions(test.input, context);
    const passed = JSON.stringify(result) === JSON.stringify(test.expected);
    console.log(`${passed ? '✅' : '❌'} ${test.name}`);
    if (!passed) {
        console.log(`   Expected: ${JSON.stringify(test.expected)}`);
        console.log(`   Got:      ${JSON.stringify(result)}`);
    }
});
