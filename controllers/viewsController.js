const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');

const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  //1) Get all the tours data
  const tours = await Tour.find();
  //2) Connent data into template

  //3) Render the data from 1)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1) Get tour data including reviews and guides
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with this name.', 404));
  }
  console.log('😳😳', tour);
  //2) Build template

  //3) Render the data from 1
  res.status(200).render('tour', {
    title: 'The Forest Hiker Tour',
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', { title: 'login' });
};

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', { title: 'signup' });
};

exports.getAccount = async (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  // console.log('UPDATING USER', req.body);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  console.log(updatedUser);
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});

exports.getMyBookings = async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });

  const tourIDs = bookings.map((el) => el.tour);

  const tours = await Tour.find({ _id: { $in: tourIDs } });

  console.log('books:', bookings);
  res.status(200).render('overview', {
    title: 'My bookings',
    tours,
  });
};