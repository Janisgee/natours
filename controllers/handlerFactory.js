const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
      //204 meaning no content
      status: 'success',
      data: null, // usually null for [DELETE]
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // .findByIdAndUpdate(where do you want the data update, the new updated data, {options})
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      //The new updated document is the one that will be returned.
      new: true,
      //specify when update the data, will run the validator again
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // console.log(req.body);
    // console.log(typeof req.body.tour, typeof req.body.user, Model);

    const doc = await Model.create(req.body); //(.create method return a Promise)

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    }); //200 = ok, 201= created
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //To allow got nested GET reviews on tour
    let filter = {};
    // console.log('params', req.params);
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter() //return this
      .sort()
      .limitFields()
      .paginate();

    // const doc = await features.query.explain();

    const doc = await features.query;

    res.status(200).json({
      status: 'success',
      result: doc.length,
      data: { data: doc },
    });
  });
