import blankPersonality from './blankPersonality'
import deleteProps from './deleteProps'

// Prototype of balance analytics testing
export default function analyzeQuiz(quizObj) {
    const analyticsObj = {}
  
    const questions = quizObj.questions.filter(q => q.slug.includes('q/'))
    const answerValArr = questions.map(q => q.answers.map(a => a.answer_metrics[0][Object.keys(a.answer_metrics[0])[0]]))

    const numPermutations = questions.map(q => q.answers.length)
      .reduce((acc, val) => acc * val, 1)
    const sampleRatio = .1, minSamples = 250, maxSamples = 1000;
    const randSampleSize = Math.min(Math.max(numPermutations * sampleRatio, Math.min(numPermutations, minSamples)), maxSamples);
    const actualSampleRatio = randSampleSize / numPermutations;
    console.log('randSampleSize', randSampleSize)

    analyticsObj.sampledMetrics = {
      questions: questions.length,
      answerValArr,
      expectedMean: 0,
      totalPermutations: numPermutations,
      sampleRatio: actualSampleRatio,
      ...sampleMetrics({
        answerMetricsArr: answerValArr,
        sampleSize: randSampleSize,
      }),
    }

    analyticsObj.sampledMetrics.stdDeviation = stdDeviation(analyticsObj.sampledMetrics.possibleScores)

    // analyticsObj.iterativeMetrics = iterativePermutations(
    //   questions.map(q => q.answers.map(a => deleteProps(a.answer_metrics[0], '__component'))),
    //   30,
    //   quizObj.results.map(({result_name, result_metrics}, i) => { return { result_name, result_metrics, count: 0, index: i } })
    // )
  
    return analyticsObj
}

function sampleMetrics({ answerMetricsArr, sampleSize }) {
  let permutations = []
  let scores = []
  const permutationIsUsed = permA => (permutations.length > 1) && permutations.some(permB => permB.every((val, i) => val === permA[i]))
  const questionAnswerMaxes = answerMetricsArr.map(q => q.length)
  const generatePerm = () => {
    let perm = [], k = 0
    do {
      perm = questionAnswerMaxes.map((max, i) => answerMetricsArr[i][Math.floor(Math.random()*max)])
      k++
    } while (permutationIsUsed(perm))
    return perm
  }

  for (let i=0; i<sampleSize; i++) {
    const currPerm = generatePerm()
    
    permutations = [...permutations, currPerm]
    scores = [...scores, currPerm.reduce((acc, val) => acc + val, 0) / currPerm.length] 
  }

  return { sampledPermutations: permutations, possibleScores: scores, calculatedMean: mean(scores) }
}
  
function iterativePermutations(qnaArray, numPermutations, resultArray) {
    const blank = deleteProps(blankPersonality(qnaArray[0][0]), ['__component'])
    // const heatmapObj = Object.assign({}, blank)
    const questionAnswerMaxes = qnaArray.map((q,i) => q.length)
    let questionAnswerIndices = qnaArray.map(_ => 0)


    for (let i=0; i < numPermutations; i++) {
        // run the permutation using questionAnswerIndices as our answers choices.
        const currPerm = questionAnswerIndices
          .map((aIndex, qIndex) => {
              return qnaArray[qIndex][aIndex]
          })
          .reduce((acc, val) => {
              if (val.__component === 'metrics.charity') return acc
              return sumObjectsByKeys(acc, deleteProps(val, ['__component']), qnaArray.length)
          }, blank)

        const sortedResults = resultArray.sort((a,b) => {
          const diffA =  Math.abs(personalityDistSum(currPerm, deleteProps(a.result_metrics[0], ['__component'])))
          const diffB = Math.abs(personalityDistSum(currPerm, deleteProps(b.result_metrics[0],  ['__component'])))
          return (diffA < diffB) ? -1 : 1
        })

        resultArray[sortedResults[0].index].count++

        questionAnswerIndices = incrementAnswers(questionAnswerIndices, questionAnswerMaxes)
    }

    resultArray.forEach(res => { res.weight = qnaArray.length / numPermutations * res.count })

    return resultArray
}
  
  function sumObjectsByKeys(objA, objB, avgFac) {
    return Object.fromEntries(Object.keys(objA).map(key => [key, objA[key] + objB[key] / avgFac]))
  }
  
  function mean(samples) {
    return samples.reduce((acc,val) => acc + val, 0) / samples.length
  }

  function sme(sample, sampleMean) {
    return (sample - sampleMean) ** 2
  }

  function variance(samples) {
    return (1 / (samples.length - 1)) * samples.reduce((acc, val) => acc + sme(val, mean(samples)), 0)
  }

  function stdDeviation(samples) {
    return Math.sqrt(variance(samples))
  }

  function normalCDF(x1, x2, mu, sigma) {
    const cdfBound = x => Math.pow(Math.E, (-1 * Math.pow(x - mu),2) / 2*Math.pow(sigma,2))

    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * (cdfBound(x2) - cdfBound(x1))
  }

  function incrementAnswers(curr, max) {
    let newCurr = [...curr]
    let overflow = true
    for (let i=0; i<newCurr.length; i++) {
      if (newCurr[i] + 1 >= max[i]) {
        overflow = true
        newCurr[i] = 0
      } else if (overflow) {
        newCurr[i]++
        overflow = false
      } else {
        break
      }
    }
    return newCurr
  }
  
  function personalityDistSum(mbObjA, mbObjB) {
    return Object.entries(personalityDistance(mbObjA, mbObjB))
        .map(entry => entry[1])
        .reduce((acc, val) => acc + val, 0)
  }
  
  function personalityDistance (mbObjA, mbObjB) {
    const distObj = {}
  
    Object.keys(mbObjA).forEach(key => distObj[key] = mbObjA[key] - mbObjB[key])
  
    return distObj
  }