const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); //Give us a stripe object to work with (Only works for backend)
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
// const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  //2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    //Information about the session
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}?tour=${tour.id}&user=${
      req.user.id
    }&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tours/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    //Information about the product
    line_items: [
      {
        price_data: {
          unit_amount: tour.price * 100,
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            description: tour.summary,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });

  //3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();

  await Booking.create({
    tour,
    user,
    price,
  });

  res.redirect(req.originalUrl.split('?')[0]);

  next();
};

exports.createBooking = factory.createOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.getOneBooking = factory.getOne(Booking, { path: 'tours' });
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
