/*
 *
 * HomePage
 *
 */

import React, { memo, useState, useEffect, useRef } from 'react';
import { Select, List } from '@buffetjs/core';
import { LoadingBar } from '@buffetjs/styles';
import { Header } from '@buffetjs/custom';
// import PropTypes from 'prop-types';
import pluginId from '../../pluginId';
import Container from '../../components/Container';
import GridContainer from '../../components/GridContainer'
import { useGlobalContext } from 'strapi-helper-plugin';
import processQuiz from '../../utils/processQuiz';

const backendURL = strapi.backendURL

const HomePage = () => {
  const globalContext = useGlobalContext();
  const quizzes = globalContext.plugins[pluginId].quizzes;
  const [currQuiz, setCurrQuiz] = useState((quizzes[0]) ? quizzes[0] : 'No quizzes found!');
  const [currQuizProcessed, setCurrQuizProcessed] = useState((quizzes[0]) ? quizzes[0] : '');
  const componentIsMounted = useRef(true);
  const [quizProcessState, setQuizProcessState] = useState('not loaded');
  let resultPermRows


  useEffect(() => {
    // cleanup function to fix unmount warning for async code
    // https://dev.to/alexandrudanpop/correctly-handling-async-await-in-react-components-4h74
    return () => {
      componentIsMounted.current = false
    }
  }, [])

  useEffect(() => {
    async function process() {
      setQuizProcessState('loading')

      try {
        const quizData = await processQuiz({
          backendURL,
          id: currQuiz.id,
        })

        if (componentIsMounted.current) {
          setCurrQuizProcessed(quizData)

          setQuizProcessState('loaded')
        }
      } catch(err) {
        console.error(err)
      }
    }

    process()
  }, [currQuiz])

  return (
    <Container>
      <h1>Quiz Analytics &amp; Balancing</h1>
      <p>Select a quiz to run analytics on it.</p>
      <Select
        name="select"
        onChange={({ target: { value } }) => {
          setCurrQuiz(quizzes.find(quiz => quiz.title === value));
        }}
        options={ quizzes.map(quiz => quiz.title) }
        value={ currQuiz.title }
      />

      { (quizProcessState === 'loading') && <LoadingBar /> }
      { (quizProcessState === 'loaded') && (<>
        <Header title={{ label: 'Statistical Analysis'}} content='Based on random sampling of all possible permutations' />
        <GridContainer columns={ 3 }>
          <p><strong>Total Permutations: </strong>{ currQuizProcessed.statistics.sampledMetrics.totalPermutations }</p>
          <p><strong>Sampled Permutations: </strong>{ currQuizProcessed.statistics.sampledMetrics.sampledPermutations.length }</p>
          <p><strong>Sample Ratio: </strong>{ currQuizProcessed.statistics.sampledMetrics.sampleRatio }</p>
          <p><strong>Expected Mean: </strong>{ currQuizProcessed.statistics.sampledMetrics.expectedMean }</p>
          <p><strong>Calculated Mean: </strong>{ currQuizProcessed.statistics.sampledMetrics.calculatedMean }</p>
          <p><strong>Standard Deviation: </strong>{ currQuizProcessed.statistics.sampledMetrics.stdDeviation }</p>
        </GridContainer>
        <Header title={{ label: 'Example Result Sequences'}} content='Randomly-generated playthroughs for testing each result.'/>
        <List items={ currQuizProcessed.resultPermutations.resultsArr
            .map(({ result_name, found, permutationAnswers }) => {
              const starterObj = { result_name, found: (found) ? 'Found' : 'Not Found' }
              if (!found) { return starterObj }
              return Object.assign(starterObj, Object.fromEntries(permutationAnswers.map((perm, i) => ['Q'+(i+1), perm])))
            }).sort((a,b) => (a.result_name < b.result_name) ? -1 : 1) }/>
      </>) }
        
    </Container>
  );
};

export default memo(HomePage);
