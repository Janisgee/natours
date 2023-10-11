const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); //build-in node model(no need to instored)

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, 'Please tell us your name!'],
    },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, 'Please provide your email'],
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: { type: String, default: 'default.jpg' },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      minlength: 8,
      required: [true, 'Please provide a password'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      // maxlength: [
      //   16,
      //   'A user password must have less or equal then 16 characters',
      // ],
      // minlength: [8, 'A tour name must have less or equal then 8 characters'],
      validate: {
        //return true or false, if false => validation error.
        //***Only work on Create and SAVE.***
        validator: function (val) {
          return val === this.password;
        },
        message: 'Password confirm should be same as password', //error message
      },
    },
    passwordChangedAt: Date, //Always be changed, of course, when someone change the password.
    passwordResetToken: String,
    passwordResetExpires: Date, //Reset expires after a certain amount of time.
    active: {
      type: Boolean,
      default: true,
      select: false, //dont want anyone see this
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

//Virtual populate bookings details
// userSchema.virtual('bookings', {
//   ref: 'Booking',
//   localField: '_id',
//   foreignField: 'user',
// });

//Implement encryption in password
//Pre-save (document) middleware (Mongoose Middleware- )
userSchema.pre('save', async function (next) {
  //We have a method on all documents which we can use if a certain field has been modified.
  //Only run this function if password was actually modified.
  if (!this.isModified('password')) return next();

  //Hash the password (encryption) bcrypt
  // Get bcrypt js package (Async function).hash(data, cost parameter= how CPU intensive this operation will be =>cost of 12 is the best)
  this.password = await bcrypt.hash(this.password, 12);
  //Delete passswordConfirm field
  this.passwordConfirm = undefined; //(we dont need this persisted in data base after the validation.)
  next();
});

// A function to Update changedPasswordAt property for the user
userSchema.pre('save', async function (next) {
  //when exactly do we actually want to set the passwordChangedAt property to right now? We only want it when we actually modified the password property.
  if (!this.isModified('password') || this.isNew) return next();
  // we want to exit this middleware function right away, if the password has not been modified. Or the document is new.
  this.passwordChangedAt = Date.now() - 1000;
  // -1000 can make sure (not 100%) we create the token after the changed password timestamp be created. Make sure we have changed the password then we have the token.
  next();
});

//Query Middleware for takeaway the inactive account from output.Happen before the query.->pre,
//'/find'we want this middleware function to apply to every query that starts with find. So not just find but also stuff like find and update, find and delete, and all queries like that.
userSchema.pre(/^find/, function (next) {
  //this points to the current query
  //we only find doucments which have the active property set to true. (getAllUsers.find()) $ne meaning not equal
  this.find({ active: { $ne: false } });
  next();
});

// Create a function to check if the given password same as the one stored in document.
// Instance method (Goal of this function is to return true or false)
// Instanced method. And so therefore it is available on all the user documents.
userSchema.methods.correctPassword = async function (candidatePassword) {
  //this => point to current document
  //use bcrypt to has the candidatePassword and compare
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create a function to *Check if user changed password after the token was issued.
userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    //Only do the comparison when the passwordChangedAt exist
    // console.log(this.passwordChangedAt, JWTTimestamp);
    //2019-04-30T00:00:00.000Z 1693990810
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    console.log(changedTimestamp, JWTTimestamp);
    //1556582400000 1693990810 => so /1000 change to second and parse entire num into integer , specify base number(10)
    return JWTTimestamp < changedTimestamp;
  }
  return false; //By default : meaning user did not change the password after this token issue
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); //specify the number of characters (十六進位的)hexadecimal string
  //Just like a password, we should never store a plain reset token in the database.
  //so we ecryped it.crypto .createHash('sha256') .update(variable where token is stored).digest(store it as hexadecimal) and store it in database.
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins in millisecond

  // Then we want it to return the plain text token, as we need to send it through email
  return resetToken; //we need to send via email the unencrypted reset token.
};

const User = mongoose.model('User', userSchema);

module.exports = User;
