// Catch asynchronous error
// Wrapped our asynchronous function inside of the catchAsync function that we just created.

module.exports = (fn) => {
  //Express will of course call it as soon as someone hits the route that needs this control function. return an anonymous function
  return (req, res, next) => {
    //createTour function
    //fn = asynchronous function and it returns promise
    //.catch((err) => next(err)) ======= same as .catch(next)
    fn(req, res, next).catch((err) => next(err));
    //Catch method here will pass the error into the next function, it will then make it so that our error ends up in our global error handling middleware.
  };
};
