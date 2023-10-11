const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have less or equal then 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain character'],
    }, //Schema type options
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a maxium group size'],
    },
    difficulty: {
      type: 'String',
      required: [true, 'A tour must have a difficulty'],
      enum: {
        // enum is only for String
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either:easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: { type: Number, default: 0 },

    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only points to current doc on NEW documnet creation.
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: { type: Date, default: Date.now(), select: false },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    // id: false,
  },
);

tourSchema.index({ price: 1, ratingAverage: -1, slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

//Query Middleware
//Middleware to populate the user details into all /^find/ query
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v',
  });
  next();
});

//Example of Embedding the guides into tours
// tourSchema.pre('save', async function (req, res, next) {
//   const guidesPromise = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Example of Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//------------------------------------------
//DOCUMENT MIDDLEWARE:
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); //lower=>lowercase
  next(); //it will call next middleware
});

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//------------------------------------------
// QUERY MIDDLEWARE:
// 'find'hook which makes this query middleware and not document middleware.
// The 'this' keyword will now point at the current query and not at the current document. Processing a query, not processing a document.
// Use case: we can have secret tours in our database.eg, VIP tour / internal tour. we do not want the secret tours to ever appear in the result outputs.
tourSchema.pre(/^find/, function (next) {
  //'this'here is query object, we can chain all the methods that we have for queries.
  // So simply adds a find method here, and then basically select all the documents where secretTour is not true.
  //$ne => not equal
  this.find({ secretTour: { $ne: true } });

  // POSTMAN: Get all tour will only show the tour that is not secret tour. But you still can see 'secretTour': false, it is not suppose to see, but Monggse adding that because it have a default setting in out schema, so it is not in our database MongoDB Compass.
  this.start = Date.now(); //Set a random object to ""this"".
  next();
});

//Post-query middleware for 'find'
//we actually get access to all the documents that we returned from the query. 'doc'
// tourSchema.post(/^find/, function (docs, next) {
//   //this middleware is gonna run after the query has already executed. It can have access to the documents that were returned. Because that query has actually already finished at this point.
//   console.log(`Query took ${Date.now() - this.start} milliseconds!`);
//   //try to run query and see result.
//   //POSTMAN:GET ALL TOUR=>Run
//   //Query took 65 milliseconds! //from the beginning Pre-'/^find/', where we defined this,to after the query has executed, at this point in time.
//   // console.log(docs); //All tours result without secretTour
//   next();
// });

// AGGREGATION MIDDLEWARE
//tourSchema.pre so we want this to happen before the aggregation is actually executed, we use aggregation hook 'aggregate'.
// tourSchema.pre('aggregate', function (next) {
//   console.log(this); //"this" point to aggregationn object
//   //add an element at the beginning of an array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
