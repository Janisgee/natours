//Node built-in promisify function from util.[util]
const { promisify } = require('util');

const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const crypto = require('crypto');

//CREATE TOKEN FOR USER SIGN UP
// 1) Sign a Jason web token and send it back to user.
//.sign({payload}, secret, {option})
//payload= an object for all the data store inside the token, secret = a string for a secret (prefect to store in config folder)
// 2)environment variable is process.env.JWT_SECRET
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
// 3)Pass in some option to show when the JWT should expire = Logging out a user after a certain period of time.
// Also define the expiration time in configuration variable.
// 4)Last send it to client

// A function to log user in and sent JWT
const createSendToken = (user, statusCode, res) => {
  // Create a function for create toke
  const token = signToken(user._id);

  const cookieOptions = {
    //expires property(config 90 convert to milliseconds)
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // secure: true, //the cookie will only be sent on an encrypted connection HTTPS. It will not work for development environment as we are not using https  but http.
    httpOnly: true, // The cookie cannot be accessed or modified in any way by the browser
  }; //brower or client will delete the cookie after it has expired, in order to prevent those cross-site scripting attacks. SO setting httpOnly to true is to basically receive the cookie, store it, and then send it automatically along with every request.

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  //Remove the password from the output.(in schema, select:false, so it doesnt show when we query for all the users. But this case, it come from creating a new document amd we see it here.)
  user.password = undefined;

  // Send a cookie res.cookie(name of cookie, the data we want to send in cookie, cptions for the cookie) Send and defind the cookies
  res.cookie('jwt', token, cookieOptions);

  //status for created
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

//1
exports.signup = catchAsync(async (req, res, next) => {
  // (Below:Not a good secruity as everyone can register as an admin into our application.)
  // [CANCELLED]const newUser = await User.create(req.body);

  //[Replace to] We only allow the data that we need to put here on into the new user.
  //## Now no one can register as an admin, if we need to add a new admin to our system, we can create a new user normally then go to MongoDB Compass and edit a role in there. from user to admin. Or we can define a special route for creating admins...
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  // console.log(url);

  createSendToken(newUser, 201, res);
});

//2  implement the route so signup handler can call

// Implement the functionality of logging users in based on a given password and email address.
exports.login = catchAsync(async (req, res, next) => {
  // Read email & passport from the body
  const { email, password } = req.body;
  // 1) Check if email or password exists
  if (!email || !password)
    return next(
      new appError('Please provide a valid email and password.', 400),
    );
  // 2) Check if user exists && password is correct
  // Select a user by its email
  // user now is not include password as it is hidden.
  //  the field (password) that is by default not selected, we need to user plus and then the name of the field. .select('+password')Then it will be back into output.
  const user = await User.findOne({ email }).select('+password');
  // console.log(user);

  //Get password compare result from userModel
  //Instanced method. And so therefore it is available on all the user documents.

  if (!user || !(await user.correctPassword(password)))
    return next(new AppError('Incorrect email or password', 401));

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);

  // 4) Create a user route for login
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'Logged out!', {
    expires: new Date(Date.now() + -10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

// Middleware of protect authorization
exports.protect = catchAsync(async (req, res, next) => {
  //1) Send a token with a request
  //Getting token and check if its there.
  //(send a token using an http header with the request)[app.js]
  // Standard for sending a token [header:Authorization, Value:Bearer sakjsdlasdlajdk(token)]
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    // console.log(token);
    // 1.5) Check if there is token exist. if not => Error
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  //2) Verification the token - we verify if someone manipulated the data or if the token has already expired.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  //handle error -invalid signature

  //3) *******Check if user still exists
  const currentUser = await User.findById(decoded.id);
  // Check if there is currentUser
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  }
  //4) check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password Please login again'),
      401,
    );
  }

  //Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//A middleware to check if user has been logged in
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET,
    );

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) return next();

    if (currentUser.changePasswordAfter(decoded.iat)) {
      return next();
    }

    res.locals.user = currentUser;
    return next();
  }
  if (req.cookies.jwt === 'Logged out!') {
    return next();
  }
  next();
});

//We want to pass in the roles, who are allowed to access the resource, we create a wrapper function and will then return the middleware function that  we actually want to create. restrictTo (pass in an arbitrary number of arguments, of roles)
exports.restrictTo = (...roles) => {
  //below function can access to roles as closure
  return (req, res, next) => {
    // This is middleware function
    //roles ['admin','lead-guide']. role='user'
    //403 - forbidden
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email }); //cause we dont know the user's id.
  if (!user) {
    //verify if the user does exist
    return next(new AppError('There is no user with that email address.', 404));
  }

  //2) Generate the random reset token (Use instant method on userModel)
  const resetToken = user.createPasswordResetToken(); // Modify the data
  // { validateBeforeSave: false } Deactivate all the validaters that we specified in our schema.
  //it fail if no { validateBeforeSave: false }.We were trying to save a document, but we do not specify all of the mandatory data. As we dont have value on the password confirm field.
  await user.save({ validateBeforeSave: false }); //Save the data (turn off the validation)

  //3) Send it to user's email
  //PATCH, because the result of this will be the modification of the password property in the user document. (user will click on this URL and do the request) (Postman:take the token as parameter)

  try {
    // await sendEmail({
    //   //async function return promise
    //   email: user.email, //req.body.email
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    //Send some response
    res
      .status(200)
      .json({ status: 'success', message: 'Token sent to email!' });
  } catch (err) {
    // Modified the data
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Save the data
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //==find the user which has this token in data base and checked if the token has not yet expired.
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired!', 400));
  }
  //==No error, set the password & passwordConfirm (just modifly but didnt saved yet)
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // == save the data,{validateBeforeSave:false} we dont need to turn off the validator as we want to validate.
  await user.save();
  //3) Update changedPasswordAt property for the user (userModel)
  //4) Log the user in, send JWT to client

  createSendToken(user, 200, res);
});

// Allowed the logged-in user to simply update his password without having to forget it.
exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user from collection
  // console.log(req);
  const user = await User.findById(req.user.id).select('+password');

  //2) Check if POSTed current password is correct
  //correctPassword(async function so await it)
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  //3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate?? Why we didnt do it as validator(this.password) is not going to work inside the schema passwordConfirm validator and two pre'save' middleware are not going to work.

  //4) Log user in, send JWT
  createSendToken(user, 200, res);

  //final - implement a route in userRoutes
  //patch('/updateMyPassword')
});
