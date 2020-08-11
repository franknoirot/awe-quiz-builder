/**
 *
 * Initializer
 *
 */

import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import pluginId from '../../pluginId';
import { request } from 'strapi-helper-plugin';

const Initializer = ({ updatePlugin }) => {
  const ref = useRef();
  ref.current = updatePlugin;

  
  useEffect(() => {
    const getData = async () => {
      const requestURL = `${strapi.backendURL}/quizzes`;

      try {
        const data = await request(requestURL, { method: 'GET' });

        ref.current(
          pluginId,
          'quizzes',
          data,
        )

        ref.current(pluginId, 'isReady', true);
      } catch(err) {
        strapi.notification.error('quiz-analytics.error.quiz.fetch');
      }
    }

    getData();
  }, []);

  return null;
};

Initializer.propTypes = {
  updatePlugin: PropTypes.func.isRequired,
};

export default Initializer;
