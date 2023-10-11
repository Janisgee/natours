const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Types.ObjectId,
      ref: 'Tour',
      require: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    review: { type: String, required: [true, 'A review cannot be empty.'] },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'A review should have a rating.'],
    },
    createdAt: { type: Date, default: Date.now() },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false },
);

//set index to user and tour fields in reviewSchema
reviewSchema.index({ user: 1, tour: 1 }, { unique: true });

// Static function for calculate the average rating
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        numRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numRating,
      ratingsAverage: +stats[0].avgRating.toFixed(1),
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

//findByIdAndUpdate
//findByIdAndDelete

reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (!doc) return;
  await doc.constructor.calcAverageRatings(doc.tour);
});

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
