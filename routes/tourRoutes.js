const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

//POST/tours/5c88fa8cf4afda39709c2955/reviews
//GET/tours/5c88fa8cf4afda39709c2955/reviews
//GET/tours/5c88fa8cf4afda39709c2955/reviews/651405133ffb18860c1a0f58
router.use('/:tourId/reviews', reviewRouter);
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview,
//   );

// router.param('id', tourController.checkID);
//tourController.aliasTopTours<--middleware
//POSTMAN:127.0.0.1:3000/api/v1/tours/top-5-cheap
// When ('/top-5-cheap')is hitted, aliasTopTours middleware runs. ->TourController.js

// Protect routes
//? Only allowing logged in users to get access to a list of all our tours. And what what means is that before running the get all tours handler.
// In order to protect routes, we're gonna to create a middleware function which is gonna run before each of these handlers
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
//Pass a year using URL parameter
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

// /tours-within/233/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
//authController.protect will effectively protect the access to this resource here from users that are not logged in.
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourPhoto,
    tourController.resizeTourPhoto,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );
//.protect-we always need to check if the user is actually logged in. The first middleware in the stack will always be the protect one.
//restrictTo()- we will then pass some user roles, which will be authorized to interact with this resource. only('admin', 'lead-guide')pass to the next one, we start running .deleteTour.

module.exports = router;
