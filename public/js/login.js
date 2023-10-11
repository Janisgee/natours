import axios from 'axios';

import { showAlert } from './alerts';

export const login = async function (email, password) {
  // console.log(email, password);

  try {
    //Sending a post request to backend
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    // console.log(res.data);

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');

      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    // console.log(err.response.data.message);
    showAlert('error', err.response.data.message);
  }
};

export const logout = async function () {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if (res.data.status === 'success') {
      location.reload(true); //IMPORTANT!! widow location.reload. We need to set it to true here, we will force a reload from the server and not from browser cache,otherwise it might simply load the same page from the cache which would then still have our user menu up there.
      location.assign('/');
    }
  } catch (err) {
    showAlert('error', 'Loggout fail, please try again!');
  }
};
