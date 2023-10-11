const Tour = require('../models/tourModel');
const AppError = require('./../utils/appError');
// const { CastError } = require('mongoose');
// const clone = require('clone');

//Transform weird error from MOngoose into an operational error with a friendly messaage.
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // const value = err.message.match(/(["'])(\\?.)*?\1/);
  const keyValue = err.keyValue;
  const value = keyValue.name;
  const message = `Duplicate field value: ${value}. Please use another value!`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  // Loops over the object

  const errors = Object.values(err.errors);
  const error = errors.map((el) => el.properties.message);
  const message = `Invalid input data. ${error.join('. ')}`;
  return new AppError(message, 400);
};

// This function only works in production
// A user in production tries to access our app with an invalid token.
const handleJWTError = () =>
  new AppError('Invalid tokem. Please log in again', 401);

const handlleJWTExpiredError = () =>
  new AppError('Your token has expired. Please login again!', 401);

////////////////////////////////////////////////////////////////////////////////
//In Development
const sendErrorDev = (err, res, req) => {
  //A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //B) Render Website
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    message: err.message,
  });
};

// In Production, we distinguish between operation errors, so error that we know and trust. To the CLIENT
const sendErrorProd = (err, res, req) => {
  //A) API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error:send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      // Programming or other unknown error: dont't leak error details
    } else {
      //1) Log error
      console.error('Error💥', err);

      //2) Send generic message eg, MongoDB error
      return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong',
      });
    }
  }
  //B) Render Website

  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      message: err.message,
    });

    // Programming or other unknown error: dont't leak error details
  } else {
    //1) Log error
    console.error('Error💥', err);
    //2) Send generic message eg, MongoDB error
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      message: 'Please try again later.',
    });
  }
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack); //Show us where is the error happen.
  err.statusCode = err.statusCode || 500; //Create a default status code or 500 (internal server error)
  err.status = err.status || 'error'; // 'error' if we have 500 status code, if 400 means 'fail'

  //Distingguishing between errors in development and in production

  //TO DEVELOPER
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res, req);
  } //TO CLIENT
  else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }; //Distructuring of original error
    error.name = err.name;
    error.message = err.message;
    error.code = err.statusCode;

    // console.log(process.env.NODE_ENV);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();

    if (error.name === 'TokenExpiredError') error = handlleJWTExpiredError();
    sendErrorProd(error, res, req);
  }
};
