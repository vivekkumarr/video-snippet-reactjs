import React from 'react';
import 'nouislider/distribute/nouislider.css';
import './App.css';
import NewSnippetComponent from './components/new-snippet';

function MyAppComponent() {
  return (
    <div className="appComp">
      <h1> Create New Snippet </h1>
      <NewSnippetComponent />
    </div>
  );
}

export default MyAppComponent;