import { createQuestionBank } from './helpers.js'

export const nodeQuestions = createQuestionBank('node', [
  {
    topic: 'Runtime', difficulty: 'Easy', type: 'MCQ',
    question: 'What is Node.js primarily?',
    options: ['A JavaScript runtime built on the V8 engine', 'A relational database', 'A CSS framework', 'A browser rendering engine UI'], correctAnswer: 'A JavaScript runtime built on the V8 engine',
    explanation: 'Node.js runs JavaScript outside the browser and provides APIs for server and system tasks.',
    hint: 'It executes JavaScript with V8.',
  },
  {
    topic: 'Event Loop', difficulty: 'Easy', type: 'True/False',
    question: 'Node.js can handle many I/O operations without blocking the JavaScript thread while each operation waits.',
    options: ['True', 'False'], correctAnswer: 'True',
    explanation: 'Node delegates supported I/O and processes callbacks when operations complete through the event loop.',
    hint: 'Its concurrency model is optimized for I/O-bound work.',
  },
  {
    topic: 'Modules', difficulty: 'Easy', type: 'Predict Output',
    question: 'What value does this ES module export?', code: 'const port = 3000;\nexport default port;',
    options: ['3000', '"port"', 'undefined', 'A server instance'], correctAnswer: '3000',
    explanation: 'The default export is the current value of the port binding, which is 3000.',
    hint: 'Read the expression after export default.',
  },
  {
    topic: 'HTTP', difficulty: 'Medium', type: 'Find the Bug',
    question: 'Why can this handler try to send two responses?', code: 'if (!user) {\n  response.statusCode = 404;\n  response.end("Not found");\n}\nresponse.end(JSON.stringify(user));',
    options: ['Execution continues after the first response.end', '404 is not a valid status', 'JSON cannot encode objects', 'response.end requires await'], correctAnswer: 'Execution continues after the first response.end',
    explanation: 'Return after the 404 response so the success response does not execute.',
    hint: 'Ending a response does not automatically return from the function.',
  },
  {
    topic: 'File System', difficulty: 'Easy', type: 'Code Completion',
    question: 'Complete the promise-based file read.', code: 'import { readFile } from "node:fs/promises";\nconst text = await readFile("notes.txt", _____);',
    options: ['"utf8"', 'JSON', 'true', 'process'], correctAnswer: '"utf8"',
    explanation: 'Passing the utf8 encoding makes readFile resolve with text instead of a Buffer.',
    hint: 'Specify a text encoding.',
  },
  {
    topic: 'Streams', difficulty: 'Medium', type: 'Scenario Question',
    question: 'A server must send a multi-gigabyte file while keeping memory usage bounded. What should it use?',
    options: ['A readable stream piped to the response', 'readFile followed by one huge buffer', 'JSON.stringify on the whole file', 'A synchronous busy loop'], correctAnswer: 'A readable stream piped to the response',
    explanation: 'Streams process chunks incrementally and respect backpressure rather than buffering the whole file.',
    hint: 'Move the file in chunks.',
  },
  {
    topic: 'Events', difficulty: 'Medium', type: 'MCQ',
    question: 'Which core abstraction emits named events that listeners can subscribe to?',
    options: ['EventEmitter', 'URLSearchParams', 'AbortSignal only', 'TextEncoder'], correctAnswer: 'EventEmitter',
    explanation: 'EventEmitter provides on, once, off, and emit behavior used throughout Node APIs.',
    hint: 'Its name directly describes publishing events.',
  },
  {
    topic: 'Configuration', difficulty: 'Easy', type: 'Scenario Question',
    question: 'Where should a deployed Node process normally read environment-specific values such as its port?',
    options: ['process.env', 'A hard-coded value committed for every environment', 'document.cookie', 'window.location'], correctAnswer: 'process.env',
    explanation: 'process.env exposes environment variables so deployment configuration stays outside source code.',
    hint: 'The process object provides the environment map.',
  },
])
