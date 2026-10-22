import { cnQuestions } from './cn.js'
import { cppQuestions } from './cpp.js'
import { dbmsQuestions } from './dbms.js'
import { dsaQuestions } from './dsa.js'
import { javaQuestions } from './java.js'
import { javascriptQuestions } from './javascript.js'
import { nodeQuestions } from './node.js'
import { osQuestions } from './os.js'
import { pythonQuestions } from './python.js'
import { reactQuestions } from './react.js'
import { sqlQuestions } from './sql.js'

export const questionsByTechnology = {
  cpp: cppQuestions,
  java: javaQuestions,
  python: pythonQuestions,
  javascript: javascriptQuestions,
  react: reactQuestions,
  node: nodeQuestions,
  sql: sqlQuestions,
  dbms: dbmsQuestions,
  dsa: dsaQuestions,
  os: osQuestions,
  cn: cnQuestions,
}

export const allQuestions = Object.values(questionsByTechnology).flat()

export function getQuestionsForTechnology(technologyId) {
  return questionsByTechnology[technologyId] ?? []
}

export function getQuestionById(questionId) {
  return allQuestions.find((question) => question.id === questionId) ?? null
}
