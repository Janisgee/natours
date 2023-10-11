const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose
  // .connect(process.env.DATABASE_LOCAL,{ // local database version
  .connect(DB, {
    // Host database version
    //Return a Promise
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    // console.log(con.connections);
    console.log('DB connection successful!');
  }); //Handle a Promise (Get access to a connection object)

// READ JSON FILE (convert object from JSON to javascript object)
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
// const reviews = JSON.parse(
//   fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
// );

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    // await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    // await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit(); //agressive way to stop an application
};

// DELECTE ALL DATA FROM DB
const deleteData = async () => {
  try {
    // await Tour.deleteMany();
    await User.deleteMany();
    // await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit(); //agressive way to stop an application
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

//Terminal
// type= node .\dev-data\data\import-dev-data.js --import
// console.log(process.argv);
// // [
//   'C:\\Program Files\\nodejs\\node.exe', => node
//   'C:\\Users\\janis\\Desktop\\udemy course\\complete-node-bootcamp-master\\course-experience\\4-natours\\starter\\dev-data\\data\\import-dev-data.js', =>.\dev-data\data\import-dev-data.js
//   '--import' =>--import
// ]
console.log(process.argv);

//Terminal
//TYPE node .\dev-data\data\import-dev-data.js --import
//TYPE node .\dev-data\data\import-dev-data.js --delete
//Then go to POSTMAN TEST it
