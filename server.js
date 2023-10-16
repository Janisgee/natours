const mongoose = require('mongoose');
const dotenv = require('dotenv');

///---- These handler should be at very top of our code.------

// Catching Uncaught Exceptions
// All errors that occur in our synchronous code but are not handled anywhere are called uncaught exceptions.

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION!😥😥😥😥😥 Shutting down...');
  console.log('NAME', err.name, 'MESSAGE', err.message);
  process.exit(1);
});
// console.log(x);

//? if console.log at one of the middleware, it will not cause error unless some request has been make. So Express, when there is an error will automatically go to the error-handling middleware with that error. (errorController.js == module.exports function - then check if it is in production or development)

dotenv.config({ path: './config.env' });
const app = require('./app');

// console.log(process.env);
// console.log(app.get('env'));

// Configure MongoDB .connect(connection string, Object with some options)
// options =>we need to specify in order to deal with some deprecation warnings.

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose
  // .connect(process.env.DATABASE_LOCAL,{ // local database version
  .connect(DB, {
    // Host database version
    //Return a Promise
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    // console.log(con.connections);
    console.log('DB connection successful!');
    //Handle a Promise (Get access to a connection object)
  });
// .catch((err) => console.log(err.name));

//4) START SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Errors Outside Express: Unhandled Rejections
// Globally handle unhandled rejected promises
//Each time that there is an unhandled rejection somewhere in our application, the process object will emit an object called unhandled rejection.We can subscrible that event like this. process.on()
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLER REJECTION!💥 Shutting down');
  console.log(err);
  //Abrupt way of ending the program because this will just immediately abort all the requests that are currently still running or pending. if just process.exit() without .close()

  server.close(() => {
    //better way is to close the server then shut down operation.
    process.exit(1);
  });
});

// We do not use process.exit(), because the SIGTERM itself will cause the application to shut down.
//server.close() =>this will basically close the server, but before that still handle all of the pending requests. 

process.on('SIGTERM',()=>{
  console.log('👋SIGTERM RECEIVED. Shutting down gracefully.');
  server.close(()=>{
    console.log('💥Process terminated!')
  })
})