import React from 'react';
import FeatureSection from '../features/FeatureSection';

const Welcome = ({ text }) => {
  const texts = `Welcome ${text}`;
  return (
    <FeatureSection text={texts} />
  );
};

export default Welcome;
