const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  enrolledCourses: [
    {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      progress: Number, // 0 - 100
      objectivesCompleted: [String],
      startedAt: Date,
      completedAt: Date,
    }
  ]
});

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
