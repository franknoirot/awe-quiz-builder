import { request } from 'strapi-helper-plugin';
import preprocessQuiz from './preprocessQuiz';
import { quizStatistics, findPermutations } from './analyzeQuiz';


async function processQuiz({ backendURL, id}) {
    const quiz =  await request(backendURL+'/quizzes/'+id, { method: 'GET' })
    const questions = await request(backendURL+'/questions?quiz_eq='+id, { method: 'GET' })
    const results = await request(backendURL+'/results?quiz_eq='+id, { method: 'GET' })
        
    const processedQuiz = preprocessQuiz(quiz, questions, results)

    processedQuiz.statistics = quizStatistics(processedQuiz)

    processedQuiz.resultPermutations = findPermutations(processedQuiz, 200)

    console.log('quiz processed!', processedQuiz)

    return processedQuiz;
}

export default processQuiz;