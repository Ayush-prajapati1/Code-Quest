import { createQuestionBank } from './helpers.js'

export const pythonQuestions = createQuestionBank('python', [
  {
    topic: 'Collections', difficulty: 'Easy', type: 'True/False',
    question: 'Python lists are mutable.',
    options: ['True', 'False'], correctAnswer: 'True',
    explanation: 'List elements can be replaced, appended, and removed without creating a new list object.',
    hint: 'Think about list.append().',
  },
  {
    topic: 'Operators', difficulty: 'Easy', type: 'Predict Output',
    question: 'What is printed?', code: 'print(7 // 2)',
    options: ['3', '3.5', '4', '2'], correctAnswer: '3',
    explanation: '// performs floor division, yielding 3 for positive operands 7 and 2.',
    hint: 'This is not the ordinary / operator.',
  },
  {
    topic: 'Functions', difficulty: 'Medium', type: 'Find the Bug',
    question: 'Why can calls to this function unexpectedly share items?', code: 'def add_item(item, items=[]):\n    items.append(item)\n    return items',
    options: ['The default list is created once and reused', 'append cannot be called in a function', 'Default values must be strings', 'The function needs global items'], correctAnswer: 'The default list is created once and reused',
    explanation: 'Use None as the default and create a fresh list inside the function when needed.',
    hint: 'Default argument expressions are evaluated when the function is defined.',
  },
  {
    topic: 'Comprehensions', difficulty: 'Easy', type: 'Code Completion',
    question: 'Complete the list comprehension that squares only even values.', code: 'squares = [number ** 2 _____]',
    options: ['for number in values if number % 2 == 0', 'if number in values for even', 'while number % 2 == 0', 'for values in number'], correctAnswer: 'for number in values if number % 2 == 0',
    explanation: 'The comprehension iterates values, filters even numbers, and evaluates the square expression.',
    hint: 'The for clause comes before the optional if filter.',
  },
  {
    topic: 'Generators', difficulty: 'Medium', type: 'Scenario Question',
    question: 'You must process a file with millions of lines without loading them all into memory. What is most appropriate?',
    options: ['Iterate lazily with a generator or file iterator', 'Build one giant list first', 'Duplicate each line in a tuple', 'Convert the file to a set before reading'], correctAnswer: 'Iterate lazily with a generator or file iterator',
    explanation: 'Lazy iteration holds only the current data needed instead of materializing the entire input.',
    hint: 'Produce values on demand.',
  },
  {
    topic: 'Dictionaries', difficulty: 'Easy', type: 'MCQ',
    question: 'Which expression reads key "theme" and returns "dark" when the key is absent?',
    options: ['settings.get("theme", "dark")', 'settings["theme", "dark"]', 'settings.find("theme")', 'get(settings.theme)'], correctAnswer: 'settings.get("theme", "dark")',
    explanation: 'dict.get accepts an optional fallback and avoids KeyError for a missing key.',
    hint: 'Use the dictionary method with a default argument.',
  },
  {
    topic: 'Identity and Equality', difficulty: 'Medium', type: 'True/False',
    question: 'The is operator should be used to test whether a value is None.',
    options: ['True', 'False'], correctAnswer: 'True',
    explanation: 'None is a singleton, so identity checks such as value is None are the idiomatic test.',
    hint: 'None represents one unique sentinel object.',
  },
  {
    topic: 'Context Managers', difficulty: 'Easy', type: 'Code Completion',
    question: 'Complete the construct that closes the file automatically.', code: '_____ open("notes.txt") as file:\n    text = file.read()',
    options: ['with', 'using', 'try', 'open'], correctAnswer: 'with',
    explanation: 'The with statement enters and exits the file context, closing it even when an error occurs.',
    hint: 'Use Python’s context-manager keyword.',
  },
])
