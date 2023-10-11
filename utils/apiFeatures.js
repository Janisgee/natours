//create a reusable module that we can, later on, import into other controllers.
class APIFeatures {
  // 2 argument(mongoose query, queryString we get from Express)
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  //create one method for each of the functionality, starting with filter.
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // console.log(JSON.parse(queryStr));
    this.query = this.query.find(JSON.parse(queryStr));
    // let query = Tour.find(JSON.parse(queryStr));
    return this; //entire object
  }
  sort() {
    if (this.queryString.sort) {
      // console.log(this.queryString.sort); //[ 'duration', 'price' ]
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy); //req.
    } else {
      // Add a default query for sort field
      this.query = this.query.sort('-createdAt'); //the newest one appear first
    }
    return this; //entire object
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // add a default for fields
      this.query = this.query.select('-__v'); //remove something,'-'meaning excluding only this field.
    }
    return this;
    //exclude fields right from schema. eg.password, when tour created.> DO IN tourModel.js
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    // if (this.queryString.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) throw new Error('This page does not exit');
    // }
    //...Requesting the next page , Result of zero page is not exactly an error, so we can delete those...
    return this;
  }
}

module.exports = APIFeatures;
