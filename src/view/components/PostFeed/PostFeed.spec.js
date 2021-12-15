import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import PostFeed from './PostFeed';
import * as apiCalls from '../../api/apiCalls';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import authReducer from '../../redux/authReducer';

const loggedInStateUser1 = {
  id: 1,
  username: 'user1',
  displayName: 'display1',
  image: 'profile1.png',
  password: 'P4ssword',
  isLoggedIn: true,
};

const originalSetInterval = window.setInterval;
const originalClearInterval = window.clearInterval;

let timedFunction;

const useFakeIntervals = () => {
  window.setInterval = (callback, interval) => {
    if (!callback.toString().startsWith('function')) {
      timedFunction = callback;
      return 111111;
    }
  };
  window.clearInterval = (id) => {
    if (id === 111111) {
      timedFunction = undefined;
    }
  };
};

const useRealIntervals = () => {
  window.setInterval = originalSetInterval;
  window.clearInterval = originalClearInterval;
};

const runTimer = () => {
  timedFunction && timedFunction();
};

const setup = (props, state = loggedInStateUser1) => {
  const store = createStore(authReducer, state);
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <PostFeed {...props} />
      </MemoryRouter>
    </Provider>
  );
};

const mockEmptyResponse = {
  data: {
    content: [],
  },
};

const mockSuccessGetNewPostsList = {
  data: [
    {
      id: 21,
      content: 'This is the newest post',
      date: 1561294668539,
      user: {
        id: 1,
        username: 'user1',
        displayName: 'display1',
        image: 'profile1.png',
      },
    },
  ],
};

const mockSuccessGetPostsMiddleOfMultiPage = {
  data: {
    content: [
      {
        id: 5,
        content: 'This post is in middle page',
        date: 1561294668539,
        user: {
          id: 1,
          username: 'user1',
          displayName: 'display1',
          image: 'profile1.png',
        },
      },
    ],
    number: 0,
    first: false,
    last: false,
    size: 5,
    totalPages: 2,
  },
};

const mockSuccessGetPostsSinglePage = {
  data: {
    content: [
      {
        id: 10,
        content: 'This is the latest post',
        date: 1561294668539,
        user: {
          id: 1,
          username: 'user1',
          displayName: 'display1',
          image: 'profile1.png',
        },
      },
    ],
    number: 0,
    first: true,
    last: true,
    size: 5,
    totalPages: 1,
  },
};

const mockSuccessGetPostsFirstOfMultiPage = {
  data: {
    content: [
      {
        id: 10,
        content: 'This is the latest post',
        date: 1561294668539,
        user: {
          id: 1,
          username: 'user1',
          displayName: 'display1',
          image: 'profile1.png',
        },
      },
      {
        id: 9,
        content: 'This is post 9',
        date: 1561294668539,
        user: {
          id: 1,
          username: 'user1',
          displayName: 'display1',
          image: 'profile1.png',
        },
      },
    ],
    number: 0,
    first: true,
    last: false,
    size: 5,
    totalPages: 2,
  },
};

const mockSuccessGetPostsLastOfMultiPage = {
  data: {
    content: [
      {
        id: 1,
        content: 'This is the oldest post',
        date: 1561294668539,
        user: {
          id: 1,
          username: 'user1',
          displayName: 'display1',
          image: 'profile1.png',
        },
      },
    ],
    number: 0,
    first: true,
    last: true,
    size: 5,
    totalPages: 2,
  },
};
describe('PostFeed', () => {
  describe('Lifecycle', () => {
    it('calls loadPosts when it is rendered', () => {
      apiCalls.loadPosts = jest.fn().mockResolvedValue(mockEmptyResponse);
      setup();
      expect(apiCalls.loadPosts).toHaveBeenCalled();
    });
    it('calls loadPosts with user parameter when it is rendered with user property', () => {
      apiCalls.loadPosts = jest.fn().mockResolvedValue(mockEmptyResponse);
      setup({ user: 'user1' });
      expect(apiCalls.loadPosts).toHaveBeenCalledWith('user1');
    });
    it('calls loadPosts without user parameter when it is rendered without user property', () => {
      apiCalls.loadPosts = jest.fn().mockResolvedValue(mockEmptyResponse);
      setup();
      const parameter = apiCalls.loadPosts.mock.calls[0][0];
      expect(parameter).toBeUndefined();
    });
    it('calls loadNewPostCount with topPost id', async () => {
      useFakeIntervals();
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      const { findByText } = setup();
      await findByText('This is the latest post');
      runTimer();
      await findByText('There is 1 new post');
      const firstParam = apiCalls.loadNewPostCount.mock.calls[0][0];
      expect(firstParam).toBe(10);
      useRealIntervals();
    });
    it('calls loadNewPostCount with topPost id and username when rendered with user property', async () => {
      useFakeIntervals();
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      const { findByText } = setup({ user: 'user1' });
      await findByText('This is the latest post');
      runTimer();
      await findByText('There is 1 new post');
      expect(apiCalls.loadNewPostCount).toHaveBeenCalledWith(10, 'user1');
      useRealIntervals();
    });
    it('displays new post count as 1 after loadNewPostCount success', async () => {
      useFakeIntervals();
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      const { findByText } = setup({ user: 'user1' });
      await findByText('This is the latest post');
      runTimer();
      const newPostCount = await findByText('There is 1 new post');
      expect(newPostCount).toBeInTheDocument();
      useRealIntervals();
    });
    it('displays new post count constantly', async () => {
      useFakeIntervals();
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      const { findByText } = setup({ user: 'user1' });
      await findByText('This is the latest post');
      runTimer();
      await findByText('There is 1 new post');
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 2 } });
      runTimer();
      const newPostCount = await findByText('There are 2 new posts');
      expect(newPostCount).toBeInTheDocument();
      useRealIntervals();
    });
    it('does not call loadNewPostCount after component is unmounted', async () => {
      useFakeIntervals();
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      const { findByText, unmount } = setup({ user: 'user1' });
      await findByText('This is the latest post');
      runTimer();
      await findByText('There is 1 new post');
      unmount();
      expect(apiCalls.loadNewPostCount).toHaveBeenCalledTimes(1);
      useRealIntervals();
    });
    it('displays new post count as 1 after loadNewPostCount success when user does not have posts initially', async () => {
      useFakeIntervals();
      apiCalls.loadPosts = jest.fn().mockResolvedValue(mockEmptyResponse);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      const { findByText } = setup({ user: 'user1' });
      await findByText('There are no posts');
      runTimer();
      const newPostCount = await findByText('There is 1 new post');
      expect(newPostCount).toBeInTheDocument();
      useRealIntervals();
    });
  });
  describe('Layout', () => {
    it('displays no post message when the response has empty page', async () => {
      apiCalls.loadPosts = jest.fn().mockResolvedValue(mockEmptyResponse);
      const { findByText } = setup();
      const message = await findByText('There are no posts');
      expect(message).toBeInTheDocument();
    });
    it('does not display no post message when the response has page of post', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsSinglePage);
      const { queryByText } = setup();
      const message = queryByText('There are no posts');
      await waitFor(() => {
        expect(message).not.toBeInTheDocument();
      });
    });
    it('displays spinner when loading the posts', async () => {
      apiCalls.loadPosts = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(mockSuccessGetPostsSinglePage);
          }, 300);
        });
      });
      const { queryByText } = setup();
      expect(queryByText('Loading...')).toBeInTheDocument();
    });
    it('displays post content', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsSinglePage);
      const { findByText } = setup();
      const postContent = await findByText('This is the latest post');
      expect(postContent).toBeInTheDocument();
    });
    it('displays Load More when there are next pages', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      const { findByText } = setup();
      const loadMore = await findByText('Load More');
      expect(loadMore).toBeInTheDocument();
    });
  });
  describe('Interactions', () => {
    it('calls loadOldPosts with post id when clicking Load More', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadOldPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsLastOfMultiPage);
      const { findByText } = setup();
      const loadMore = await findByText('Load More');
      fireEvent.click(loadMore);
      const firstParam = apiCalls.loadOldPosts.mock.calls[0][0];
      expect(firstParam).toBe(9);
    });
    it('calls loadOldPosts with post id and username when clicking Load More when rendered with user property', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadOldPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsLastOfMultiPage);
      const { findByText } = setup({ user: 'user1' });
      const loadMore = await findByText('Load More');
      fireEvent.click(loadMore);
      expect(apiCalls.loadOldPosts).toHaveBeenCalledWith(9, 'user1');
    });
    it('displays loaded old post when loadOldPosts api call success', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadOldPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsLastOfMultiPage);
      const { findByText } = setup();
      const loadMore = await findByText('Load More');
      fireEvent.click(loadMore);
      const oldPost = await findByText('This is the oldest post');
      expect(oldPost).toBeInTheDocument();
    });
    it('hides Load More when loadOldPosts api call returns last page', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadOldPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsLastOfMultiPage);
      const { findByText } = setup();
      const loadMore = await findByText('Load More');
      fireEvent.click(loadMore);
      await waitFor(() => {
        expect(loadMore).not.toBeInTheDocument();
      });
    });
    // load new posts
    it('calls loadNewPosts with post id when clicking New Post Count Card', async () => {
      useFakeIntervals();
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      apiCalls.loadNewPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetNewPostsList);
      const { findByText } = setup();
      await findByText('This is the latest post');
      runTimer();
      const newPostCount = await findByText('There is 1 new post');
      fireEvent.click(newPostCount);
      const firstParam = apiCalls.loadNewPosts.mock.calls[0][0];
      expect(firstParam).toBe(10);
      useRealIntervals();
    });
    it('calls loadNewPosts with post id and username when clicking New Post Count Card', async () => {
      useFakeIntervals();
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      apiCalls.loadNewPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetNewPostsList);
      const { findByText } = setup({ user: 'user1' });
      await findByText('This is the latest post');
      runTimer();
      const newPostCount = await findByText('There is 1 new post');
      fireEvent.click(newPostCount);
      expect(apiCalls.loadNewPosts).toHaveBeenCalledWith(10, 'user1');
      useRealIntervals();
    });
    it('displays loaded new post when loadNewPosts api call success', async () => {
      useFakeIntervals();
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      apiCalls.loadNewPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetNewPostsList);
      const { findByText } = setup({ user: 'user1' });
      await findByText('This is the latest post');
      runTimer();
      const newPostCount = await findByText('There is 1 new post');
      fireEvent.click(newPostCount);
      const newPost = await findByText('This is the newest post');

      expect(newPost).toBeInTheDocument();
      useRealIntervals();
    });
    it('hides new post count when loadNewPosts api call success', async () => {
      useFakeIntervals();
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      apiCalls.loadNewPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetNewPostsList);
      const { findByText, queryByText } = setup({ user: 'user1' });
      await findByText('This is the latest post');
      runTimer();
      const newPostCount = await findByText('There is 1 new post');
      fireEvent.click(newPostCount);
      await findByText('This is the newest post');
      expect(queryByText('There is 1 new post')).not.toBeInTheDocument();
      useRealIntervals();
    });
    it('does not allow loadOldPosts to be called when there is an active api call about it', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadOldPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsLastOfMultiPage);
      const { findByText } = setup();
      const loadMore = await findByText('Load More');
      fireEvent.click(loadMore);
      fireEvent.click(loadMore);

      expect(apiCalls.loadOldPosts).toHaveBeenCalledTimes(1);
    });
    it('replaces Load More with spinner when there is an active api call about it', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadOldPosts = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(mockSuccessGetPostsLastOfMultiPage);
          }, 300);
        });
      });
      const { queryByText, findByText } = setup();
      const loadMore = await findByText('Load More');
      fireEvent.click(loadMore);
      const spinner = await findByText('Loading...');
      expect(spinner).toBeInTheDocument();
      expect(queryByText('Load More')).not.toBeInTheDocument();
    });
    it('replaces Spinner with Load More after active api call for loadOldPosts finishes with middle page response', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadOldPosts = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(mockSuccessGetPostsMiddleOfMultiPage);
          }, 300);
        });
      });
      const { queryByText, findByText } = setup();
      const loadMore = await findByText('Load More');
      fireEvent.click(loadMore);
      await findByText('This post is in middle page');
      expect(queryByText('Loading...')).not.toBeInTheDocument();
      expect(queryByText('Load More')).toBeInTheDocument();
    });
    it('replaces Spinner with Load More after active api call for loadOldPosts finishes error', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadOldPosts = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject({ response: { data: {} } });
          }, 300);
        });
      });
      const { queryByText, findByText } = setup();
      const loadMore = await findByText('Load More');
      fireEvent.click(loadMore);
      const spinner = await findByText('Loading...');
      await waitForElementToBeRemoved(spinner);
      expect(queryByText('Loading...')).not.toBeInTheDocument();
      expect(queryByText('Load More')).toBeInTheDocument();
    });
    // loadNewPosts

    it('does not allow loadNewPosts to be called when there is an active api call about it', async () => {
      useFakeIntervals();
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      apiCalls.loadNewPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetNewPostsList);
      const { findByText } = setup({ user: 'user1' });
      await findByText('This is the latest post');
      runTimer();
      const newPostCount = await findByText('There is 1 new post');

      fireEvent.click(newPostCount);
      fireEvent.click(newPostCount);

      expect(apiCalls.loadNewPosts).toHaveBeenCalledTimes(1);
      useRealIntervals();
    });
    it('replaces There is 1 new post with spinner when there is an active api call about it', async () => {
      useFakeIntervals();
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      apiCalls.loadNewPosts = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(mockSuccessGetNewPostsList);
          }, 300);
        });
      });
      const { queryByText, findByText } = setup();
      await findByText('This is the latest post');
      runTimer();
      const newPostCount = await findByText('There is 1 new post');
      fireEvent.click(newPostCount);
      const spinner = await findByText('Loading...');
      expect(spinner).toBeInTheDocument();
      expect(queryByText('There is 1 new post')).not.toBeInTheDocument();
      useRealIntervals();
    });
    it('removes Spinner and There is 1 new post after active api call for loadNewPosts finishes with success', async () => {
      useFakeIntervals();
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      apiCalls.loadNewPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetNewPostsList);
      const { queryByText, findByText } = setup({ user: 'user1' });
      await findByText('This is the latest post');
      runTimer();
      const newPostCount = await findByText('There is 1 new post');
      fireEvent.click(newPostCount);
      await findByText('This is the newest post');
      expect(queryByText('Loading...')).not.toBeInTheDocument();
      expect(queryByText('There is 1 new post')).not.toBeInTheDocument();
      useRealIntervals();
    });
    it('replaces Spinner with There is 1 new post after active api call for loadNewPosts fails', async () => {
      useFakeIntervals();
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      apiCalls.loadNewPosts = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject({ response: { data: {} } });
          }, 300);
        });
      });
      const { queryByText, findByText } = setup();
      await findByText('This is the latest post');
      runTimer();
      const newPostCount = await findByText('There is 1 new post');
      fireEvent.click(newPostCount);
      await findByText('Loading...');
      await waitFor(() => {
        expect(queryByText('Loading...')).not.toBeInTheDocument();
        expect(queryByText('There is 1 new post')).toBeInTheDocument();
      });
      useRealIntervals();
    });
    it('displays modal when clicking delete on post', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      const { queryByTestId, container, findByText } = setup();
      await findByText('This is the latest post');
      const deleteButton = container.querySelectorAll('button')[0];
      fireEvent.click(deleteButton);

      const modalRootDiv = queryByTestId('modal-root');
      expect(modalRootDiv).toHaveClass('modal fade d-block show');
    });
    it('hides modal when clicking cancel', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      const { queryByTestId, container, queryByText, findByText } = setup();
      await findByText('This is the latest post');
      const deleteButton = container.querySelectorAll('button')[0];
      fireEvent.click(deleteButton);

      fireEvent.click(queryByText('Cancel'));

      const modalRootDiv = queryByTestId('modal-root');
      expect(modalRootDiv).not.toHaveClass('d-block show');
    });
    it('displays modal with information about the action', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });
      const { container, queryByText, findByText } = setup();
      await findByText('This is the latest post');
      const deleteButton = container.querySelectorAll('button')[0];
      fireEvent.click(deleteButton);

      const message = queryByText(
        `Are you sure to delete 'This is the latest post'?`
      );
      expect(message).toBeInTheDocument();
    });
    it('calls deletePost api with post id when delete button is clicked on modal', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });

      apiCalls.deletePost = jest.fn().mockResolvedValue({});
      const { container, queryByText, findByText } = setup();
      await findByText('This is the latest post');
      const deleteButton = container.querySelectorAll('button')[0];
      fireEvent.click(deleteButton);
      const deletePostButton = queryByText('Delete Post');
      fireEvent.click(deletePostButton);
      expect(apiCalls.deletePost).toHaveBeenCalledWith(10);
    });
    it('hides modal after successful deletePost api call', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });

      apiCalls.deletePost = jest.fn().mockResolvedValue({});
      const { container, queryByText, queryByTestId, findByText } = setup();
      await findByText('This is the latest post');
      const deleteButton = container.querySelectorAll('button')[0];
      fireEvent.click(deleteButton);
      const deletePostButton = queryByText('Delete Post');
      fireEvent.click(deletePostButton);
      await waitFor(() => {
        const modalRootDiv = queryByTestId('modal-root');
        expect(modalRootDiv).not.toHaveClass('d-block show');
      });
    });
    it('removes the deleted post from document after successful deletePost api call', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });

      apiCalls.deletePost = jest.fn().mockResolvedValue({});
      const { container, queryByText, findByText } = setup();
      await findByText('This is the latest post');
      const deleteButton = container.querySelectorAll('button')[0];
      fireEvent.click(deleteButton);
      const deletePostButton = queryByText('Delete Post');
      fireEvent.click(deletePostButton);
      await waitFor(() => {
        const deletedPostContent = queryByText('This is the latest post');
        expect(deletedPostContent).not.toBeInTheDocument();
      });
    });
    it('disables Modal Buttons when api call in progress', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });

      apiCalls.deletePost = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve({});
          }, 300);
        });
      });
      const { container, queryByText, findByText } = setup();
      await findByText('This is the latest post');
      const deleteButton = container.querySelectorAll('button')[0];
      fireEvent.click(deleteButton);
      const deletePostButton = queryByText('Delete Post');
      fireEvent.click(deletePostButton);

      expect(deletePostButton).toBeDisabled();
      expect(queryByText('Cancel')).toBeDisabled();
    });
    it('displays spinner when api call in progress', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });

      apiCalls.deletePost = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve({});
          }, 300);
        });
      });
      const { container, queryByText, findByText } = setup();
      await findByText('This is the latest post');
      const deleteButton = container.querySelectorAll('button')[0];
      fireEvent.click(deleteButton);
      const deletePostButton = queryByText('Delete Post');
      fireEvent.click(deletePostButton);
      const spinner = queryByText('Loading...');
      expect(spinner).toBeInTheDocument();
    });
    it('hides spinner when api call finishes', async () => {
      apiCalls.loadPosts = jest
        .fn()
        .mockResolvedValue(mockSuccessGetPostsFirstOfMultiPage);
      apiCalls.loadNewPostCount = jest
        .fn()
        .mockResolvedValue({ data: { count: 1 } });

      apiCalls.deletePost = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve({});
          }, 300);
        });
      });
      const { container, queryByText, findByText } = setup();
      await findByText('This is the latest post');
      const deleteButton = container.querySelectorAll('button')[0];
      fireEvent.click(deleteButton);
      const deletePostButton = queryByText('Delete Post');
      fireEvent.click(deletePostButton);
      await waitFor(() => {
        const spinner = queryByText('Loading...');
        expect(spinner).not.toBeInTheDocument();
      });
    });
  });
});

console.error = () => {};
