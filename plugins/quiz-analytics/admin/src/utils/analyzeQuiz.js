import blankPersonality from './blankPersonality'
import deleteProps from './deleteProps'

// Prototype of balance analytics testing
export function quizStatistics(quizObj) {
    const analyticsObj = {}
  
    const questions = quizObj.questions.filter(q => q.slug.includes('q/'))
    // convert questions to array of arrays with just the first metric
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
  
    return analyticsObj
}

function sampleMetrics({ answerMetricsArr, sampleSize }) {
  let scores = []
  let permutations = []

  for (let i=0; i<sampleSize; i++) {
    const currPerm = generateValidPerm(answerMetricsArr, permutations)[0]
    
    permutations = [...permutations, currPerm]
    scores = [...scores, currPerm.reduce((acc, val) => acc + val, 0) / currPerm.length] 
  }

  return { sampledPermutations: permutations, possibleScores: scores, calculatedMean: mean(scores) }
}

function generateValidPerm(aMetricsArray, permutations) {
  const permutationIsUsed = permA => (permutations.length > 1) && permutations.some(permB => permB.every((val, i) => val === permA[i]))
  let perm, indices, k = 0
  do {
    [perm, indices] = generatePerm(aMetricsArray)
    k++
  } while (permutationIsUsed(perm))
  return [perm, indices]
}

function generatePerm(metricArray) {
  const indices = metricArray.map(q => Math.floor(Math.random()*q.length))
  return [metricArray.map((q,i) => q[indices[i]]), indices]
}
  
export function findPermutations(quizObj, maxIterations) {
  const questions = quizObj.questions.filter(q => q.slug.includes('q/'))
  const qnaArr = questions.map(q => q.answers.map(a => deleteProps(a.answer_metrics[0], '__component')))
  const resultsArr = quizObj.results.map(({result_name, result_metrics}, i) => { return { result_name, result_metrics, found: false } })
  let iterations = 0, permutations = []
  let currPerm, currPermIndices

  while (iterations < maxIterations && !resultsArr.every(result => result.found)) {
    [currPerm, currPermIndices] = generateValidPerm(qnaArr, permutations)

    permutations = [...permutations, currPerm]
    
    const permScore = permutationToScore(currPerm)
    console.log('sorting results by this score', permScore)
    const sortedResults = scoreToResults(permScore, resultsArr)
    const topResult = sortedResults[0]
    console.log(topResult.result_name, 'is top!', sortedResults)
    
    if (topResult) {
      topResult.found = true
      topResult.permutationAnswers = currPermIndices.map(index => String.fromCharCode(65 + index))
      topResult.permutationMetrics = currPerm
      topResult.permutationScore = permScore
    }

    iterations++
  }

  return {triedPermutations: permutations, resultsArr}
}

function permutationToScore(permutation) {
  const blank = blankPersonality(permutation[0])
  return permutation.reduce((acc, val) => sumObjectsByKeys(acc, val, permutation.length), blank)
}

function scoreToResults(permScore, resultsArr) {
  return resultsArr.sort((a,b) => {
    const diffA =  Math.abs(personalityDistSum(permScore, a.result_metrics[0]))
    const diffB = Math.abs(personalityDistSum(permScore, b.result_metrics[0]))
    return (diffA < diffB) ? -1 : 1
  })
}

function permutationToResults(permutation, resultsArr) {
  return scoreToResults(permutationToScore(permutation), resultsArr)
}


function iterativePermutations(qnaArray, numPermutations, resultArray) {
    const blank = deleteProps(blankPersonality(qnaArray[0][0]))
    const questionAnswerMaxes = qnaArray.map((q,i) => q.length)
    let questionAnswerIndices = qnaArray.map(_ => 0)


    for (let i=0; i < numPermutations; i++) {
        // run the permutation using questionAnswerIndices as our answers choices.
        const sortedResults = permutationToResults(questionAnswerIndices, resultArray)

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