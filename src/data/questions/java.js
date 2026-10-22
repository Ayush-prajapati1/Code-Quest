import { createQuestionBank } from './helpers.js'

export const javaQuestions = createQuestionBank('java', [
  {
    topic: 'JVM', difficulty: 'Easy', type: 'MCQ',
    question: 'What does the Java compiler normally produce from a .java source file?',
    options: ['JVM bytecode', 'Native machine code for one CPU only', 'A database table', 'JavaScript'], correctAnswer: 'JVM bytecode',
    explanation: 'javac produces bytecode in .class files, which a JVM can interpret or compile at runtime.',
    hint: 'The output is designed for the Java Virtual Machine.',
  },
  {
    topic: 'Strings', difficulty: 'Easy', type: 'True/False',
    question: 'Java String objects are immutable.',
    options: ['True', 'False'], correctAnswer: 'True',
    explanation: 'Operations that appear to change a String create a new String instead.',
    hint: 'This property makes strings safe to share and cache.',
  },
  {
    topic: 'Operators', difficulty: 'Easy', type: 'Predict Output',
    question: 'What does the code print?', code: 'int value = 9 / 4;\nSystem.out.println(value);',
    options: ['2', '2.25', '3', 'Compilation error'], correctAnswer: '2',
    explanation: 'Both operands are int values, so integer division truncates the fractional part.',
    hint: 'No floating-point operand is present.',
  },
  {
    topic: 'Strings', difficulty: 'Medium', type: 'Find the Bug',
    question: 'Why is this comparison unreliable for String content?', code: 'if (input == "yes") { /* accepted */ }',
    options: ['== compares object references; use input.equals("yes")', 'Strings cannot be compared', 'The literal must use single quotes', 'if cannot test text'], correctAnswer: '== compares object references; use input.equals("yes")',
    explanation: 'equals compares String content, while == asks whether both references point to the same object.',
    hint: 'Distinguish identity from value equality.',
  },
  {
    topic: 'Collections', difficulty: 'Easy', type: 'Code Completion',
    question: 'Complete the safe generic list declaration.', code: 'List<String> names = new _____<>();',
    options: ['ArrayList', 'String', 'Map', 'Iterator'], correctAnswer: 'ArrayList',
    explanation: 'ArrayList implements the List interface and the diamond operator infers String.',
    hint: 'Choose a concrete resizable-array implementation of List.',
  },
  {
    topic: 'Collections', difficulty: 'Medium', type: 'Scenario Question',
    question: 'You need fast average lookup of a user by a unique username. Which collection best models the data?',
    options: ['HashMap<String, User>', 'ArrayList<User> only', 'Stack<User>', 'PriorityQueue<User>'], correctAnswer: 'HashMap<String, User>',
    explanation: 'A hash map associates each username key with its user and offers average O(1) lookup.',
    hint: 'Use a key-value collection.',
  },
  {
    topic: 'Interfaces', difficulty: 'Medium', type: 'MCQ',
    question: 'Which statement about Java interfaces is correct?',
    options: ['A class can implement multiple interfaces', 'A class can extend multiple classes', 'Interfaces cannot declare methods', 'Interfaces are instantiated directly'], correctAnswer: 'A class can implement multiple interfaces',
    explanation: 'Java supports multiple inheritance of type through interfaces, but a class extends at most one class.',
    hint: 'Interfaces let one class satisfy several contracts.',
  },
  {
    topic: 'Exceptions', difficulty: 'Medium', type: 'Scenario Question',
    question: 'A file reader must always close, even if reading throws. Which Java feature is the clearest solution?',
    options: ['try-with-resources', 'A labeled break', 'A static initializer', 'Method overloading'], correctAnswer: 'try-with-resources',
    explanation: 'try-with-resources automatically closes AutoCloseable resources on normal and exceptional exits.',
    hint: 'Use the construct created for deterministic resource cleanup.',
  },
])
