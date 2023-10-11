class AppError extends Error {
  // Constructor method is called each time that we create a new object out of this class.
  constructor(message, statusCode) {
    super(message); //Doing this parent call, we already set the message property to our incoming message.
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'Error';
    this.isOperational = true; // All of our errors will get this property set to true.
    //Programming error or some bugs in our app will not have this.isOperational property on them.

    //.captureStackTrace(currentObject, AppError Class itself)
    Error.captureStackTrace(this, this.constructor);
    //When a new object is created, and a constructor function is called, then that function call is not gonna appear in the stack trace, and will not pollute it.
  }
}

module.exports = AppError;
