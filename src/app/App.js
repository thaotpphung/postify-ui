import React from 'react';
import { Route, Switch } from 'react-router-dom';
import HomePage from '../view/pages/HomePage/HomePage';
import LoginPage from '../view/pages/LoginPage/LoginPage';
import UserSignupPage from '../view/pages/UserSignupPage';
import UserPage from '../view/pages/UserPage/UserPage';
import TopBar from '../view/common/TopBar';

function App() {
  return (
    <div>
      <TopBar />
      <div className="container">
        <Switch>
          <Route exact path="/" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={UserSignupPage} />
          <Route path="/:username" component={UserPage} />
        </Switch>
      </div>
    </div>
  );
}

export default App;
