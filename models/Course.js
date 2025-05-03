// models/Course.js
const mongoose = require('mongoose');

// Define the schema for the learning platform courses
const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lessons: [
    {
      title: String,
      duration: String,
    }
  ]
});

// Create the model for the course schema
const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
