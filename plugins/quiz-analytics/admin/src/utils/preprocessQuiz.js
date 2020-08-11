import blankPersonality from './blankPersonality';
import deleteProps from './deleteProps';

function preprocessQuiz(quizObj, questionObj, results) {
    const blank = deleteProps(blankPersonality(quizObj.results_metrics),['_id', 'id', 'createdAt', 'updatedAt', '__v', '__component'])
  
    // Sort by the number within the Label field of Questions until Strapi Issue #2616 results in a feature upgrade
    // https://github.com/strapi/strapi/issues/2616 (Relation fields do no repect drag-and-drop order)
    const qIndexFromLabel = (label) => parseInt(label.match(/\d+/g)[0])
    quizObj.questions = quizObj.questions.sort((qA, qB) => (qIndexFromLabel(qA.label) < qIndexFromLabel(qB.label)) ? -1 : 1)
  
    quizObj.questions.forEach(q => { 
      //preformat question uris
      q.slug = 'q/'+q.slug
  
      // merge in answers to quiz's question data
      q.answers = questionObj.find(question => question.id === q.id).answers
  
      q.answers.forEach(a => a.answer_metrics = [{}])
  
      if (q.answer_metrics[0] && q.answer_metrics[0].__component === 'metrics.myers-briggs-answers') {
        q.answer_metrics[0] = deleteProps(q.answer_metrics[0], ['__component', '_id', 'createdAt', 'updatedAt', '__v'])
  
        Object.keys(q.answer_metrics[0]).forEach(key => {
          if (key === 'id') return
  
          q.answer_metrics[0][key].forEach((item, i, arr) => {
            const answer = q.answers.find(a => a.id === item.id)
            if (!answer.answer_metrics) {
              answer.answer_metrics = [{}]
            }
            const val = -1 + i * 2 / (arr.length - 1)
            answer.answer_metrics[0][key] = val
          })
        })
      } else if (q.answer_metrics[0] && q.answer_metrics[0].__component === 'metrics.charity') {
        q.__filter = 'does not contribute'
      }
  
      // preprocess answers
      q.answers.forEach(a => {
        // reformat image urls to include host
        //if (a.image) {
        //  a.image.url = host + a.image.url
        //}
  
        if (!a.answer_metrics[0].__component) {
          a.answer_metrics[0].__component = 'metrics.myers-briggs-answers'
        }
      })
  
      q.answer_metrics = deleteProps(q.answer_metrics, ['id'])
    })  

    // filter out any questions that don't contribute to the personality score
    quizObj.questions = quizObj.questions.filter(q => q.__filter !== 'does not contribute')

  
    //preprocess results_metrics
    const rmPropsToDelete = ['id', '_id', '__component', 'createdAt', 'updatedAt', '__v']
    quizObj.results_metrics = deleteProps(quizObj.results_metrics, rmPropsToDelete)
  
    Object.keys(quizObj.results_metrics).forEach(key => {
      quizObj.results_metrics[key].forEach((item, i, arr) => {
        const val = -1 + i * 2 / (arr.length - 1)
        item.value = val
      })
    })
  
    quizObj.results.forEach(result => {
  
      result.result_metrics = [Object.assign({}, blank)]
      Object.keys(result.result_metrics[0]).forEach(key => {
        result.result_metrics[0][key] = quizObj.results_metrics[key].find(item => item.result_name === result.result_name).value
      })
    })
  
    return cleanupQuiz(quizObj)
  }
  
  function cleanupQuiz(quizObj) {
    Object.keys(quizObj.results_metrics).forEach(key => {
      quizObj.results_metrics[key] = quizObj.results_metrics[key].map(item => {
        return {
          result_name: item.result_name,
          value: item.value,
        }
      })
    })

    quizObj.questions = quizObj.questions.map(q => {
      q.answers = q.answers.map(a => deleteProps(a, [
        '__v',
        '_id',
        'content',
        'image',
        'createdAt',
        'question',
        'updatedAt'
      ]))

      return deleteProps(q, [
        'layout',
        'image_aspect_ratio',
        'content',
        'answer_metrics',
        'answer_gap',
        'answer_width',
        'quiz',
        'updatedAt',
        'createdAt',
        '__v',
        '_id',
        '__component',
      ])
    })

    quizObj.results = quizObj.results.map(r => deleteProps(r, [
      '__v',
      '_id',
      'createdAt',
      'description',
      'image',
      'product', 'product_A', 'product_B', 'product_C', 'product_D', 'product_E',
      'quiz',
      'style_tip',
      'theme_song',
      'updatedAt',
    ]))

    return deleteProps(quizObj,
      [
        'promotions',
        '_id',
        'createdAt',
        'updatedAt',
        '__v',
        'custom_styles',
        'product_slot',
        'interstitials',
      ]
    )
  }

  export default preprocessQuiz;