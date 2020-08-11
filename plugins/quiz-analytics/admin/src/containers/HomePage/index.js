/*
 *
 * HomePage
 *
 */

import React, { memo, useState, useEffect, useRef } from 'react';
import { Select } from '@buffetjs/core';
import { LoadingBar } from '@buffetjs/styles';
// import PropTypes from 'prop-types';
import pluginId from '../../pluginId';
import Container from '../../components/Container';
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
        <p><strong>Total Permutations: </strong>{ currQuizProcessed.analytics.sampledMetrics.totalPermutations }</p>
        <p><strong>Sampled Permutations: </strong>{ currQuizProcessed.analytics.sampledMetrics.sampledPermutations.length }</p>
        <p><strong>Sample Ratio: </strong>{ currQuizProcessed.analytics.sampledMetrics.sampleRatio }</p>
        <p><strong>Expected Mean: </strong>{ currQuizProcessed.analytics.sampledMetrics.expectedMean }</p>
        <p><strong>Calculated Mean: </strong>{ currQuizProcessed.analytics.sampledMetrics.calculatedMean }</p>
        <p><strong>Standard Deviation: </strong>{ currQuizProcessed.analytics.sampledMetrics.stdDeviation }</p>
      </>) }
        
    </Container>
  );
};

export default memo(HomePage);
