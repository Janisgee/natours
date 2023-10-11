const Tour = require('./../models/tourModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      (new AppError('Upload fail, please upload a valid image document.'), 400),
      false,
    );
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourPhoto = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourPhoto = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  //ImageCover
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quantity: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quantity: 90 })
        .toFile(`public/img/tours/${fileName}`);

      req.body.images.push(fileName);
    }),
  );

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5'; // everything is string, so set it as a string
  req.query.sort = '-ratingsAverage, price';
  req.query.fields = 'name, price, ratingAverage, summary, difficulty';
  next();
};

// Imprement the CURD operation
//2) ROUTE HANDLERS
exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // [2 EXECUTE QUERY]
//   // Creating an instance of this API features Class that will then get stored into Features. (pass the query object, queryString coming from Express)
//   const features = new APIFeatures(Tour.find(), req.query)
//     // Each of these four methods here that we call one after another, we, basically, manipulate the query.
//     .filter() //return 'this'
//     .sort()
//     .limitFields()
//     .paginate();
//   //Each of the methods has return this, so we can chain them.
//   const tours = await features.query;
//   //query.sort().select().skip().limit()
//   //The end, we simply await the result that query so that it can come back with all the documents that were selected.

//   // [3 SEND RESPONSE]
//   res.status(200).json({
//     status: 'success',
//     result: tours.length,
//     data: { tours },
//   });
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   //Tour.findOne({_id:req.params.id})

//   if (!tour) {
//     //null is a falsy value, javascript will convert it to false.
//     //say RETURN, because we want to return this function immediately and not move on to the next line.
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

exports.updateTour = factory.updateOne(Tour);
// exports.updateTour = catchAsync(async (req, res, next) => {
//   // .findByIdAndUpdate(where do you want the data update, the new updated data, {options})
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     //The new updated document is the one that will be returned.
//     new: true,
//     //specify when update the data, will run the validator again
//     runValidators: true,
//   });

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

// Catch asynchronous error
// Wrapped our asynchronous function inside of the catchAsync function that we just created.

//createTour here should really be a function but not the result of calling a function.

exports.createTour = factory.createOne(Tour);
// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body); //(.create method return a Promise)

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   }); //200 = ok, 201= created
// });

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(204).json({
//     //204 meaning no content
//     status: 'success',
//     data: null, // usually null for [DELETE]
//   });
// });

//Aggregation Pipeline (MongoDB feature, Mongoose gives access to it)
//Aggregation Pipeline like regular query that can manipulate the data in a couple of steps
//Object inside a object inside a object.
//normal query return anaggretate object
//.find return a query
//.aggregate return an aggregate object and then only when we await it.
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    //Each of the elements will be one of stages(Object) (Most common one)
    //$match=>match is basically to select or to filter certain documents.like .filter()in mongoDB.
    //? we only want to select documents which have a ratings average greater or equal than 4.5.
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    //$group=>it allows us to group documents together,basically using accumulators.
    //we always need to specify the id as we need to specify what we want to group by.
    {
      $group: {
        // _id: '$ratingsAverage',
        _id: { $toUpper: '$difficulty' },
        // For each of the document that's gonna go through this pipeline, one will be added to this num counter.
        numTours: { $sum: 1 }, // $sum =>operator
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    // specify which field we want to sort this by and let's actually use the average price.
    { $sort: { avgPrice: 1 } }, //1 for accending, -1 for decending

    //we can also repeat stage
    // { $match: { _id: { $ne: 'EASY' } } }, //$ne=>not equal to (so result:'MEDIUM' & 'DIFFICULT')
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

//Add a router in tourRoutes
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; //2021, transform it to a number (*1)
  const plan = await Tour.aggregate([
    //$unwind =>basically deconstruct an array field from the info documents and then output one document for each element of the array. {$operator:'field'}
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), //Greater than or equal first day of year
          $lte: new Date(`${year}-12-31`), // Less than or equal last day of year
        },
      },
    },
    //$month=>Returns the month for a date as a number between 1 (January) and 12 (December).
    {
      $group: {
        _id: { $month: '$startDates' }, //Get the month of startDates
        numTourStarts: { $sum: 1 }, //Count total tours on that month
        tours: { $push: '$name' }, //display what tour on that month in array
      },
    },
    { $addFields: { month: '$_id' } }, //add fields called'month', using _id result.
    { $project: { _id: 0 } }, //0 or 1, 0=>_id not longer show up. If 1, it shows up.
    { $sort: { numTourStarts: -1 } }, //1 for accending, -1 for descending
    { $limit: 12 }, //limit the output
  ]);

  res.status(200).json({
    status: 'success',
    data: { plan },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng)
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat, lng.',
        400,
      ),
    );
  // console.log(distance, latlng, unit);
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

// router
//   .route('/tours-within/:distance/center/:latlng/unit/:unit')
//   .get(tourController.getToursWithin);

// /tours-within/233/center/-40,45/unit/mi

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  // const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng)
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat, lng.',
        400,
      ),
    );

  const distances = await Tour.aggregate([
    {
      //$geoNear - always need to be the first stage and require at least one of our field contains geospatial index
      $geoNear: {
        near: { type: 'Point', coordinates: [lng * 1, lat * 1] },
        distanceField: 'distance', //the number will come in 'meters'
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
