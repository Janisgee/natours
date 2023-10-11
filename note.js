// Mongoose also has the concept of middleware, which is document middleware.
// Just like with Express, we can use Mongoose middleware to make something happen between two events.
// Each time a new document is saved to the database, we can run a function between the save command is issued and the actual saving of the document, or also after the actual saving. And that's the reason why Mongoose middleware is also called pre and post hooks.

// There are four types of middleware in Mongoose: document, query, aggregate, and model middleware.
// Document middleware, which is middleware that can act on the currently processed document.

// Like virtual properties, we define a middleware on the schema.

//POSTMAN:Create new tour
// {
//     "name": "Test tour",
//     "duration": 1,
//     "maxGroupSize": 1,
//     "difficulty": "difficult",
//     "price": 1,
//     "summary": "Test tour",
//     "imageCover": "tour-3-cover.jpg"
//   }

// tourSchema.pre('save', function () {
//   console.log(this);
// });

// CONSOLE (this)
// {
//   ratingsAverage: 4.5,
//   ratingsQuantity: 0,
//   images: [],
//   createdAt: 2023-08-24T05:16:03.781Z,
//   startDates: [],
//   _id: 64e6e8839bfde031b09f0bcb,
//   name: 'Test tour',
//   duration: 1,
//   maxGroupSize: 1,
//   difficulty: 'difficult',
//   price: 1,
//   summary: 'Test tour',
//   imageCover: 'tour-3-cover.jpg',
//   durationWeeks: 0.14285714285714285,
//   id: '64e6e8839bfde031b09f0bcb'
// }

//USE SLUGIFY PACKAGE 'npm i slugify'
// Create a slug of each of the document.
// A slug is basically just a string that we can put in the URL, usually based on some string like the name eg.'Test tour'.

//Document middleware to manipulate documents that are currently being saved.

//Middleware running before and after a certain event. And in the case of document middleware, that event is usually the save event. And then in the middleware function itself, we have access to the 'this' keyword,which is going to point at the currently being saved document. save middleware only runs for the save and create Mongoose methods.  It's not going to run, for example, for insertManyand also not for find one and update or find by ID and update, which we already used before.They are not going to trigger this ""save"" middleware.

//------------------------------------------
//MONGOOSE QUERY MIDDLEWARE

// Mongoose query middleware (Pre-middleware for 'find')
// Query middleware allows us to run functions before or after a certain query is executed. And so let's now add a pre-find hook, so basically, a middleware that is gonna run before any find query is executed.

// POSTMAN: Create new tour
// {
//     "name": "Super Secret Tour",
//     "duration": 1,
//     "maxGroupSize": 1,
//     "difficulty": "difficult",
//     "price": 1,
//     "summary": "Test tour",
//     "imageCover": "tour-3-cover.jpg",
//     "secretTour":true
//   }

//POSTMAN-> When we hit that route using GET method, 127.0.0.1:3000/api/v1/tours

//we create a query using tour.find(), then we chain all these method to it(.filter() .sort() .limitFields() .paginate()), then we execute that query(features.query) here by using await. BUT before this query is excuted, pre('find') middleware is excuted.

//MODEL.JS
// tourSchema.pre('find', function (next) {
//   this.find({ secretTour: { $ne: true } });
//   next();
// });

//And it is executed because it is ""find"".So, we're creating a find query, and so, therefore, the find hook in middleware is then executed. Since it is query middleware, the ""this"" keyword points to the query.

//That query, we can then chain yet another find method, we then filter out the secretTourusing this filter object.

// exports.getAllTours = async (req, res) => {
//   try {
//     // [2 EXECUTE QUERY]
//     const features = new APIFeatures(Tour.find(), req.query)
//       .filter()
//       .sort()
//       .limitFields()
//       .paginate();
//     const tours = await features.query;
//     // [3 SEND RESPONSE]
//     res.status(200).json({
//       status: 'success',
//       result: tours.length,
//       data: { tours },
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };

//ONE PROBLEM:
//Middleware using 'find', it will miss the 'findOne','findOneAndDelete'. Eg. when we want to get one tour, pre(find)middleware will not do its job.

//TO FIX IT.
// /something/ => inside is regular expression
// ^ => any message start with that word eg.find
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

//so when we POSTMAN:GET 1 tour, we were trying to get a secretTour. So the tour with this ID here is secret, but we never want the secretTours to show up in any query.

// {
//     "status": "success",
//     "data": {
//         "tour": null
//     }
// }

// Check documentation in mongoose
//https://mongoosejs.com/docs/middleware.html

// Mongoose query middleware (Post-middleware for 'find')

//-----------------------------------------------
// 匯總Aggregation Middleware
//Aggregation middleware allows us to add hooks before or after an aggregation happens

//Example: getTourStats-aggregation is being used.
//POSTMAN:127.0.0.1:3000/api/v1/tours/tour-stats
//total show:10 tours.SecretTour is included.

//we have few aggregation in controller, getTourStats, getMonthlyPlan. So simply exclude it right at the model level,  add aggregation middleware there starting with a comment

// exports.getTourStats = async (req, res) => {
//   try {
//     const stats = await Tour.aggregate([
//       { $match: { ratingsAverage: { $gte: 4.5 } } },
//       {
//         $group: {
//           _id: { $toUpper: '$difficulty' },
//           numTours: { $sum: 1 },
//         },
//       },
//       { $sort: { avgPrice: 1 } },
//     ]);
//     res.status(200).json({
//       status: 'success',
//       data: { stats },
//     });
//   } catch {
//     res.status(400).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };

// tourSchema.pre('aggregate', function (next) {
//   console.log(this); //"this" point to aggregationn object
//   console.log(this.pipeline());
//   next();
// });

//------console.log
//console.log(this);
//Aggregate {
//   _pipeline: [
//     { '$match': [Object] },
//     { '$group': [Object] },
//     { '$sort': [Object] }
//   ],
//   _model: Model { Tour },
//   options: {}
// }

//console.log(this.pipeline());
//[
//   { '$match': { ratingsAverage: [Object] } },
//   {
//     '$group': {
//       _id: [Object],
//       numTours: [Object],
//       numRatings: [Object],
//       avgRating: [Object],
//       avgPrice: [Object],
//       minPrice: [Object],
//       maxPrice: [Object]
//     }
//   },
//   { '$sort': { avgPrice: 1 } }
// ]

//?? In order to filter out the secret tours, all we have to do is to add another match stage right at the beginning of this pipeline array.

//add an element at the beginning of an array "unshift"-standard javascript method to add begining of array

//this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//POSTMAN:127.0.0.1:3000/api/v1/tours/tour-stats SEND
// total have 9 tours, secretTour has been filtered.

//CHECK again console.log(this.pipeline()) - two matches.
// { '$match': { secretTour: [Object] } },
// { '$match': { ratingsAverage: [Object] } },

//Post aggregate middleware is not necessary to talk again

//Model middleware is not that import.

// -----------------------------------
// Validation
//1) Validation- Basically checking if the entered values are in the right format for each field in our document schema, and also that values have actually been entered for all of the required fields

//2)清潔Sanitization,which is to ensure that the inputted data is basically clean, so that there is no malicious code(（對電腦系統進行破壞或盜取個人資訊）惡意的) being injected into our database, or into the application itself.

//---****we remove unwanted characters, or even code, from the input data.a golden standard in back-end development. To never, ever accept input data coming from a user as it is.

//we are doing this data validation right here on the model. And that, again, is because of the fat model and thin controller philosophy, which makes the model the perfect place to perform validation.

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'], //validator
    unique: true, // Not a validator
    // [maximum string length, 'err message']validator only available on string
    maxlength: [40, 'A tour name must have less or equal then 40 characters'],
    // [minimum string length, 'err message']validator only available on string
    minlength: [10, 'A tour name must have less or equal then 10 characters'],
  },
});

//required--build-in validator
//required is actually available for all the data types. (String, Numbers, Booleans, dates, or really,whatever type you're using)

//POSTMAN:Update Tour
//127.0.0.1:3000/api/v1/tours/64e86cbc51ab4d2e58131043

// {
//     "name":"TEST"
// }

//FAIL because tourController, runValidators: true;
// const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//   new: true,
//   runValidators: true,
// });

//Example2
const tourSchema = new mongoose.Schema({
  ratingsAverage: {
    type: Number,
    default: 4.5,
    //min & max not only for number, but also work with date.
    min: [1, 'Rating must be above 1.0'],
    max: [[5, 'Rating must be below 5.0']],
  },
});
//POSTMAN: Create new tour
// {
//     "name": "Test tour Amazing",
//     "duration": 1,
//     "maxGroupSize": 1,
//     "difficulty": "difficult",
//     "price": 1,
//     "summary": "Test tour",
//     "imageCover": "tour-3-cover.jpg",
//     "ratingsAverage":6
//   }

//Fail as ratingsAverage more than 5.0

//Example 3:
//Restrict this difficulty value here to only three difficulties.So, easy, medium, and difficult.
const tourSchema = new mongoose.Schema({
  difficulty: {
    type: 'String',
    required: [true, 'A tour must have a difficulty'],
    //{create another object here , so you can put error message}
    enum: {
      // enum is only for String
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either:easy, medium or difficult',
    },
  },
});

// enum:[we can pass an array of values, that are allowed.] only for String.

//POSTMAN: Create new tour
//Fail as difficulty is not valid
// {
//     "name": "Test tour 23",
//     "duration": 1,
//     "maxGroupSize": 1,
//     "difficulty": "asdasdd",
//     "price": 1,
//     "summary": "Test tour",
//     "imageCover": "tour-3-cover.jpg",
//     "ratingsAverage":4
//   }

//Other Validator...
//String => match validator in order to check if the input matches a given regular expression.

//----------------------------------
// Custom Validator
//Sometimes the built-in validators are simply not enough. And in that case, we can also build our own custom validators.

//Validator is actually really just a simple functioncwhich should return either true or false.
//And if it returns false, then it means there is an error. And on the other hand when we return true, then the validation is correct and the input can be accepted.

//?? I want to validate is if the price discount is actually lower than the price itself.

//MODEL.js
const tourSchema = new mongoose.Schema({
  priceDiscount: {
    type: Number,
    //To specify our validator we use the validate property:calback function(value), return turn or false.
    
      validate: {
         //a real function not arrow function as have access to the ""this"" variable, which will point to the current document.
        validator: function (val) {
           //--*****""this"" keyword only points to current doc on NEW documnet creation.*****
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price', //this message can access to value. This work from internal to Mongoose, nothing do with javascript.{VALUE} = val //
      },
      //200(Discount Price)<250 Original Price [true]
      //250(Discount Price)<200 Original Price [false]=> Validation error (err message)
    },
  },
});
//--------------console---------------
//TEST POSTMAN: Create new tour
// {
//     "name": "Test Tour Price2",
//     "price": 200,
//     "priceDiscount":300,
//   }

//FAIL
// "name": "ValidationError",
//         "message": "Tour validation failed: priceDiscount: Discount price (300) should be below regular price"


//-----******Inside a validator function, that ""this"" key word is only going to point to the current document when we are creating a new document. So this function here is not going to work on update.***********


//--- CUSTOM VALIDATOR FROM LIBRARY NPM-------
//There are a couple of libraries on npm for data validation that we can simply plug in here as custom validators that we do not have to write ourselves.

//Grab one of these libraries and simply plug them into your Mongoose validators.

//1) validator -https://github.com/validatorjs/validator.js
// Validator: isAlpha / isAlphanumeric / isBoolean /isCreditCard /isCurrency / isIBAN / isInt / isLowercase
//---*(Example)* isAlpha--??I want to check if the tour name only contains letters.

//tourModel.js
// const validator = require('validator');
// 
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have less or equal then 10 characters'],
      validate: [validator.isAlpha,'Tour name must only contain characters, and no space as well'],
    }, })

    //we can specify an array an then the error message after the callback function.
  