import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import PostSubmit from './PostSubmit';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import authReducer from '../../redux/authReducer';
import * as apiCalls from '../../api/apiCalls';

const defaultState = {
  id: 1,
  username: 'user1',
  displayName: 'display1',
  image: 'profile1.png',
  password: 'P4ssword',
  isLoggedIn: true,
};

let store;

const setup = (state = defaultState) => {
  store = createStore(authReducer, state);
  return render(
    <Provider store={store}>
      <PostSubmit />
    </Provider>
  );
};

describe('PostSubmit', () => {
  describe('Layout', () => {
    it('has textarea', () => {
      const { container } = setup();
      const textArea = container.querySelector('textarea');
      expect(textArea).toBeInTheDocument();
    });
    it('has image', () => {
      const { container } = setup();
      const image = container.querySelector('img');
      expect(image).toBeInTheDocument();
    });
    it('has textarea', () => {
      const { container } = setup();
      const textArea = container.querySelector('textarea');
      expect(textArea.rows).toBe(1);
    });
    it('displays user image', () => {
      const { container } = setup();
      const image = container.querySelector('img');
      expect(image.src).toContain('/images/profile/' + defaultState.image);
    });
  });
  describe('Interactions', () => {
    let textArea;
    const setupFocused = () => {
      const rendered = setup();
      textArea = rendered.container.querySelector('textarea');
      fireEvent.focus(textArea);
      return rendered;
    };

    it('displays 3 rows when focused to textarea', () => {
      setupFocused();
      expect(textArea.rows).toBe(3);
    });
    it('displays postify button when focused to textarea', () => {
      const { queryByText } = setupFocused();
      const postifyButton = queryByText('Postify');
      expect(postifyButton).toBeInTheDocument();
    });
    it('displays Cancel button when focused to textarea', () => {
      const { queryByText } = setupFocused();
      const cancelButton = queryByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
    });
    it('does not display Postify button when not focused to textarea', () => {
      const { queryByText } = setup();
      const postifyButton = queryByText('Postify');
      expect(postifyButton).not.toBeInTheDocument();
    });
    it('does not display Cancel button when not focused to textarea', () => {
      const { queryByText } = setup();
      const cancelButton = queryByText('Cancel');
      expect(cancelButton).not.toBeInTheDocument();
    });
    it('returns back to unfocused state after clicking the cancel', () => {
      const { queryByText } = setupFocused();
      const cancelButton = queryByText('Cancel');
      fireEvent.click(cancelButton);
      expect(queryByText('Cancel')).not.toBeInTheDocument();
    });
    it('calls postPost with post request object when clicking Postify', () => {
      const { queryByText } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const postifyButton = queryByText('Postify');

      apiCalls.postPost = jest.fn().mockResolvedValue({});
      fireEvent.click(postifyButton);

      expect(apiCalls.postPost).toHaveBeenCalledWith({
        content: 'Test post content',
      });
    });
    it('returns back to unfocused state after successful postPost action', async () => {
      const { queryByText } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const postifyButton = queryByText('Postify');

      apiCalls.postPost = jest.fn().mockResolvedValue({});
      fireEvent.click(postifyButton);

      await waitFor(() => {
        expect(queryByText('Postify')).not.toBeInTheDocument();
      });
    });
    it('clear content after successful postPost action', async () => {
      const { queryByText } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const postifyButton = queryByText('Postify');

      apiCalls.postPost = jest.fn().mockResolvedValue({});
      fireEvent.click(postifyButton);

      await waitFor(() => {
        expect(queryByText('Test post content')).not.toBeInTheDocument();
      });
    });
    it('clears content after clicking cancel', () => {
      const { queryByText } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      fireEvent.click(queryByText('Cancel'));

      expect(queryByText('Test post content')).not.toBeInTheDocument();
    });
    it('disables Postify button when there is postPost api call', async () => {
      const { queryByText } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const postifyButton = queryByText('Postify');

      const mockFunction = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve({});
          }, 300);
        });
      });

      apiCalls.postPost = mockFunction;
      fireEvent.click(postifyButton);

      fireEvent.click(postifyButton);
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });
    it('disables Cancel button when there is postPost api call', async () => {
      const { queryByText } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const postifyButton = queryByText('Postify');

      const mockFunction = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve({});
          }, 300);
        });
      });

      apiCalls.postPost = mockFunction;
      fireEvent.click(postifyButton);

      const cancelButton = queryByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });
    it('displays spinner when there is postPost api call', async () => {
      const { queryByText } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const postifyButton = queryByText('Postify');

      const mockFunction = jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve({});
          }, 300);
        });
      });

      apiCalls.postPost = mockFunction;
      fireEvent.click(postifyButton);

      expect(queryByText('Loading...')).toBeInTheDocument();
    });
    it('enables Postify button when postPost api call fails', async () => {
      const { queryByText } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const postifyButton = queryByText('Postify');

      const mockFunction = jest.fn().mockRejectedValueOnce({
        response: {
          data: {
            validationErrors: {
              content: 'It must have minimum 10 and maximum 5000 characters',
            },
          },
        },
      });

      apiCalls.postPost = mockFunction;
      fireEvent.click(postifyButton);

      await waitFor(() => {
        expect(queryByText('Postify')).not.toBeDisabled();
      });
    });
    it('enables Cancel button when postPost api call fails', async () => {
      const { queryByText } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const postifyButton = queryByText('Postify');

      const mockFunction = jest.fn().mockRejectedValueOnce({
        response: {
          data: {
            validationErrors: {
              content: 'It must have minimum 10 and maximum 5000 characters',
            },
          },
        },
      });

      apiCalls.postPost = mockFunction;
      fireEvent.click(postifyButton);

      await waitFor(() => {
        expect(queryByText('Cancel')).not.toBeDisabled();
      });
    });
    it('enables Postify button after successful postPost action', async () => {
      const { queryByText } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const postifyButton = queryByText('Postify');

      apiCalls.postPost = jest.fn().mockResolvedValue({});
      fireEvent.click(postifyButton);
      await waitForElementToBeRemoved(postifyButton);
      fireEvent.focus(textArea);
      await waitFor(() => {
        expect(queryByText('Postify')).not.toBeDisabled();
      });
    });
    it('displays validation error for content', async () => {
      const { queryByText } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const postifyButton = queryByText('Postify');

      const mockFunction = jest.fn().mockRejectedValueOnce({
        response: {
          data: {
            validationErrors: {
              content: 'It must have minimum 10 and maximum 5000 characters',
            },
          },
        },
      });

      apiCalls.postPost = mockFunction;
      fireEvent.click(postifyButton);

      await waitFor(() => {
        expect(
          queryByText('It must have minimum 10 and maximum 5000 characters')
        ).toBeInTheDocument();
      });
    });
    it('clears validation error after clicking cancel', async () => {
      const { queryByText, findByText } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const postifyButton = queryByText('Postify');

      const mockFunction = jest.fn().mockRejectedValueOnce({
        response: {
          data: {
            validationErrors: {
              content: 'It must have minimum 10 and maximum 5000 characters',
            },
          },
        },
      });

      apiCalls.postPost = mockFunction;
      fireEvent.click(postifyButton);

      const error = await findByText(
        'It must have minimum 10 and maximum 5000 characters'
      );

      fireEvent.click(queryByText('Cancel'));

      expect(error).not.toBeInTheDocument();
    });
    it('clears validation error after content is changed', async () => {
      const { queryByText, findByText } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const postifyButton = queryByText('Postify');

      const mockFunction = jest.fn().mockRejectedValueOnce({
        response: {
          data: {
            validationErrors: {
              content: 'It must have minimum 10 and maximum 5000 characters',
            },
          },
        },
      });

      apiCalls.postPost = mockFunction;
      fireEvent.click(postifyButton);
      const error = await findByText(
        'It must have minimum 10 and maximum 5000 characters'
      );

      fireEvent.change(textArea, {
        target: { value: 'Test post content updated' },
      });

      expect(error).not.toBeInTheDocument();
    });
    it('displays file attachment input when text area focused', () => {
      const { container } = setup();
      const textArea = container.querySelector('textarea');
      fireEvent.focus(textArea);

      const uploadInput = container.querySelector('input');
      expect(uploadInput.type).toBe('file');
    });
    it('displays image component when file selected', async () => {
      apiCalls.postPostFile = jest.fn().mockResolvedValue({
        data: {
          id: 1,
          name: 'random-name.png',
        },
      });
      const { container } = setup();
      const textArea = container.querySelector('textarea');
      fireEvent.focus(textArea);

      const uploadInput = container.querySelector('input');
      expect(uploadInput.type).toBe('file');

      const file = new File(['dummy content'], 'example.png', {
        type: 'image/png',
      });
      fireEvent.change(uploadInput, { target: { files: [file] } });

      await waitFor(() => {
        const images = container.querySelectorAll('img');
        const attachmentImage = images[1];
        expect(attachmentImage.src).toContain('data:image/png;base64');
      });
    });
    it('removes selected image after clicking cancel', async () => {
      apiCalls.postPostFile = jest.fn().mockResolvedValue({
        data: {
          id: 1,
          name: 'random-name.png',
        },
      });
      const { queryByText, container } = setupFocused();

      const uploadInput = container.querySelector('input');
      expect(uploadInput.type).toBe('file');

      const file = new File(['dummy content'], 'example.png', {
        type: 'image/png',
      });
      fireEvent.change(uploadInput, { target: { files: [file] } });

      await waitFor(() => {
        const images = container.querySelectorAll('img');
        expect(images.length).toBe(2);
      });

      fireEvent.click(queryByText('Cancel'));
      fireEvent.focus(textArea);

      await waitFor(() => {
        const images = container.querySelectorAll('img');
        expect(images.length).toBe(1);
      });
    });
    it('calls postPostFile when file selected', async () => {
      apiCalls.postPostFile = jest.fn().mockResolvedValue({
        data: {
          id: 1,
          name: 'random-name.png',
        },
      });

      const { container } = setupFocused();

      const uploadInput = container.querySelector('input');
      expect(uploadInput.type).toBe('file');

      const file = new File(['dummy content'], 'example.png', {
        type: 'image/png',
      });
      fireEvent.change(uploadInput, { target: { files: [file] } });

      await waitFor(() => {
        const images = container.querySelectorAll('img');
        expect(images.length).toBe(2);
      });
      expect(apiCalls.postPostFile).toHaveBeenCalledTimes(1);
    });
    it('calls postPostFile with selected file', async () => {
      apiCalls.postPostFile = jest.fn().mockResolvedValue({
        data: {
          id: 1,
          name: 'random-name.png',
        },
      });

      const { container } = setupFocused();

      const uploadInput = container.querySelector('input');
      expect(uploadInput.type).toBe('file');

      const file = new File(['dummy content'], 'example.png', {
        type: 'image/png',
      });
      fireEvent.change(uploadInput, { target: { files: [file] } });

      await waitFor(() => {
        const images = container.querySelectorAll('img');
        expect(images.length).toBe(2);
      });

      const body = apiCalls.postPostFile.mock.calls[0][0];

      const readFile = () => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onloadend = () => {
            resolve(reader.result);
          };
          reader.readAsText(body.get('file'));
        });
      };

      const result = await readFile();

      expect(result).toBe('dummy content');
    });
    it('calls postPost with post with file attachment object when clicking Postify', async () => {
      apiCalls.postPostFile = jest.fn().mockResolvedValue({
        data: {
          id: 1,
          name: 'random-name.png',
        },
      });
      const { queryByText, container } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const uploadInput = container.querySelector('input');
      expect(uploadInput.type).toBe('file');

      const file = new File(['dummy content'], 'example.png', {
        type: 'image/png',
      });
      fireEvent.change(uploadInput, { target: { files: [file] } });

      await waitFor(() => {
        const images = container.querySelectorAll('img');
        expect(images.length).toBe(2);
      });

      const postifyButton = queryByText('Postify');

      apiCalls.postPost = jest.fn().mockResolvedValue({});
      fireEvent.click(postifyButton);

      expect(apiCalls.postPost).toHaveBeenCalledWith({
        content: 'Test post content',
        attachment: {
          id: 1,
          name: 'random-name.png',
        },
      });
    });
    it('clears image after postPost success', async () => {
      apiCalls.postPostFile = jest.fn().mockResolvedValue({
        data: {
          id: 1,
          name: 'random-name.png',
        },
      });
      const { queryByText, container } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const uploadInput = container.querySelector('input');
      expect(uploadInput.type).toBe('file');

      const file = new File(['dummy content'], 'example.png', {
        type: 'image/png',
      });
      fireEvent.change(uploadInput, { target: { files: [file] } });

      await waitFor(() => {
        const images = container.querySelectorAll('img');
        expect(images.length).toBe(2);
      });

      const postifyButton = queryByText('Postify');

      apiCalls.postPost = jest.fn().mockResolvedValue({});
      fireEvent.click(postifyButton);

      fireEvent.focus(textArea);
      await waitFor(() => {
        const images = container.querySelectorAll('img');
        expect(images.length).toBe(1);
      });
    });
    it('calls postPost without file attachment after cancelling previous file selection', async () => {
      apiCalls.postPostFile = jest.fn().mockResolvedValue({
        data: {
          id: 1,
          name: 'random-name.png',
        },
      });
      const { queryByText, container } = setupFocused();
      fireEvent.change(textArea, { target: { value: 'Test post content' } });

      const uploadInput = container.querySelector('input');
      expect(uploadInput.type).toBe('file');

      const file = new File(['dummy content'], 'example.png', {
        type: 'image/png',
      });
      fireEvent.change(uploadInput, { target: { files: [file] } });

      await waitFor(() => {
        const images = container.querySelectorAll('img');
        expect(images.length).toBe(2);
      });
      fireEvent.click(queryByText('Cancel'));
      fireEvent.focus(textArea);

      const postifyButton = queryByText('Postify');

      apiCalls.postPost = jest.fn().mockResolvedValue({});
      fireEvent.change(textArea, { target: { value: 'Test post content' } });
      fireEvent.click(postifyButton);

      expect(apiCalls.postPost).toHaveBeenCalledWith({
        content: 'Test post content',
      });
    });
  });
});

console.error = () => {};
