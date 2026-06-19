import React from 'react';

export default function Loader({ text = 'Loading...' }) {
  return <div className="loader">{text}</div>;
}
