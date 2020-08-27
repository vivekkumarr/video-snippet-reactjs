import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
  } from "react-router-dom";
import MyAppComponent from '../App';
import YtIntComponent from './yt-int';
  
function RouterComponent() {
    return (
        <Router>
            <Switch>
                <Route exact path="/" component={MyAppComponent} />
                <Route path="/new-snippet" component={MyAppComponent} />
                <Route path="/yt-int" component={YtIntComponent} />
            </Switch>
        </Router>
    );
} 

export default RouterComponent;