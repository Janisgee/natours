const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const viewRouter = require('./routes/viewRoutes');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes'); // import router
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController')

//Start express application
const app = express();

//Trust proxy
app.enable('trust proxy')

//Setting up plug engines
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
//Implement CORS for simple request [Get, Post]
app.use(cors());
// Access-Control-Allow-Origin *

// api.natours.com, front-end natours.com (allow for specific origin)
// app.use(cors({
//   orgin:'https://www.natours.com'
// }))

//Implement CORS for simple request [Put, Patch, Delete]
// Require - preflight phase. Before the real request actually happens, and let's say a delete request, the browser first does an options request in order to figure out if the actual request is safe to send. 
// We need to actually respond to that options request. And options is really just another HTTP method, so just like get, post or delete, So basically when we get one of these options requests on our server, we then need to send back the same Access-Control-Allow-Origin header. And this way the browser will then know that the actual request, and in this case the delete request, is safe to perform, and then executes the delete request itself.
// similar as app.get()
app.options('*',cors()); //Just another HTTP method, for all route
// app.options('/api/v1/tours/:id',cors()); //For specific route






// Use the build-in express middleware.(express.static(directory))
app.use(express.static(`${__dirname}/public`)); //pass the directory where we have these HTML file
//------------SET SECURITY HTTP HEADERS------------
// Middleware function to Set the NPM security http headers.
//npm package: (helmet) npm i helmet , it is a standard express development package to build an express app. it's best to use this helmet package early in the middleware stack so that these headers are really sure to be set.
// app.use(helmet());

//------------DEVELOPMENT LOGGING------------
// console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//------------LIMIT REQUESTS FROM SAME API------------
//Global middleware to implement rate limiting in order to prevent the same OP from making too many requests to our API and that will then help us preventing attacks like denial of service or brute force attacks. (NPM package called Express Rate Limit.) npm i express-rate-limit

// limiter (Global middleware function) ,rateLimit function which receives an object of options
const limiter = rateLimit({
  max: 100, //The maximum number of requests coming from one IP
  windowMs: 60 * 60 * 1000, //time window milliseconds(100 requests per hour)
  //This will do is to allow 100 requests from the same IP in one hour and if that limit is then crossed by a certain IP, they will get back an error message.
  message: 'Too many requests from this IP, please try again in an hour!', //error message
});
app.use('/api', limiter); //we only want to apply this limiter only to /api. Only access to API route.
//If too many requests, block these requests

// Middleware to pass the session checkout in secure way.
app.post('/webhook-checkout', express.raw({type:'application/json'}),bookingController.webhookCheckout);
//The reason for that is that in this handler function, when we receive the body from Stripe, the Stripe function that we're then gonna use to actually read the body needs this body in a raw form, so basically as a string and not as JSON. Again, in this route here, we need the body coming with the request to be not in JSON.

// ------------BODY PARSER, READING DATA FROM BODY INTO RQ.BODY------------
//Limit the amount of data that comes in body.
app.use(express.json({ limit: '10kb' })); //it wont accept the body if larger than 10kb

//Reading data from HTML form submit to URL body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
//Reading data from cookies
app.use(cookieParser());
// Serve the static file in express from a folder, but not from a route.  (static file meaning the files sitting in our file system, that we currently cannot access using in routes eg.overview.html, css)

//------------ DATA SANITIZATION------------
// Data sanitization means to clean all the data that comes into the application from malicious code. Code tryiing to attack our application.
// Data sanitization against NoSQL query injection (npm i express-mongo-sanitize)
//mongoSanitize() => MongoDB operators
app.use(mongoSanitize()); // prevent us the attact from
//This middleware is to look at the request body, the request query string, and also at Request.Params, and it will filter out all of the dollar signs and dots
// {
//     "email": {"$gt":""},
//     "password":"pass1234"

// }

// Data sanitization against XSS (npm i xss-clean)
//An attacker would try to insert some malicious HTML code with some JavaScript code attached to it. If that would then later be injected into our HTML site, it could really create some damage then.
app.use(xss()); //This will then clean any user input from malicious HTML code. Using this middleware, we prevent that basically by converting all these HTML symbols.

//The validator function library that we used before also has a couple of cool sanitization functions in it. However, Mongoose already has a strict schema. It will help throw an error.

//------------PREVENTING PARAMETER POLLUTION------------
// npm i hpp (HTTP Parameter pollution)[have to use by the end- it use to clean the query string.]
//White list some parameters so we can put eg, duration=5&duration=9 and sort it. Otherwise it will only look at the last request which is duration=9 and the result will not be correct.
//White list is simply an array of properties for which we actually allow duplicates in the query string.
// app.use(hpp());
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// ------------SERVING STATIC FILES------------

// app.use((req, res, next) => {
//   console.log('Hello from the middleware 😁');
//   next();
// });

// ------------TEST MIDDLEWARE (FOR TESTING)------------
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //pretend we have some route handler needs the information about when exactly the request happens.
  // console.log(x);

  // console.log(req.headers);
  // console.log(req.cookies);
  next();
});

//3) ROUTES (This is where we mount the routers)

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); // We need to use these route before declare them.
app.use('/api/v1/users', userRouter); //(sub application)
app.use('/api/v1/reviews', reviewRouter); //(sub application)
app.use('/api/v1/bookings', bookingRouter); //(sub application)

// Handle all URL with All the HTTP methdo in one route.
// Change the HTTP error message to JSON format error message
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Error handling middleware (4 arguments: error first function)
app.use(globalErrorHandler);

module.exports = app;
