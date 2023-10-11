const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');
//Setting up for upload photo storage and file name
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users'); //error or null
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     const photoName = `user-${req.user.id}-${Date.now()}.${ext}`;
//     cb(null, photoName);
//   },
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else
    cb(
      (new AppError('Upload fail, please upload a valid image document.'), 400),
      false,
    );
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quantity: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});
exports.uploadUserPhoto = upload.single('photo');

//2) ROUTE HANDLERS
//User itself to update its information
exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  //1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email'); //filterObj(object that want to filter, the object want to keep eg.'name', 'email')
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, //returns the new object, the updated object instead of the old one
    runValidators: true, // we want the mongoose to validate our document
  });

  // Send back response
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

//Delete the user(actually not delete from data but marking them inactive)
exports.deleteMe = catchAsync(async (req, res, next) => {
  // .findByIdAndUpdate() only work for logged in users
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  // console.log(req.user);
  req.params.id = req.user._id;
  next();
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

//Create a query middleware to take away the inactive account from output. (Get all user) - UserModel.js
