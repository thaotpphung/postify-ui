import React from 'react';
import UserList from '../../components/UserList/UserList';
import PostSubmit from '../../components/PostSubmit/PostSubmit';
import PostFeed from '../../components/PostFeed/PostFeed';
import { connect } from 'react-redux';

class HomePage extends React.Component {
  render() {
    return (
      <div data-testid="homepage">
        <div className="row">
          <div className="col-8">
            {this.props.loggedInUser.isLoggedIn && <PostSubmit />}
            <PostFeed />
          </div>
          <div className="col-4">
            <UserList />
          </div>
        </div>
      </div>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    loggedInUser: state,
  };
};

export default connect(mapStateToProps)(HomePage);
