const graphql = require('graphql'); // This line should not be commented
const Course = require('../models/Course');
const Student = require('../models/Student');

const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLList,
  GraphQLID,
  GraphQLInt,
} = graphql;

// --- Define LessonType ---

const LessonType = new GraphQLObjectType({
  name: 'Lesson',
  fields: () => ({
    title: { type: GraphQLString },
    duration: { type: GraphQLString },
  }),
});

// --- Define CourseType ---

const CourseType = new GraphQLObjectType({
  name: 'Course',
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    duration: { type: GraphQLString },
    lessons: { type: new GraphQLList(LessonType) }, // Now LessonType is defined
  }),
});

// --- Define EnrolledCourseType ---

const EnrolledCourseType = new GraphQLObjectType({
  name: 'EnrolledCourse',
  fields: () => ({
    courseId: {
      type: CourseType,
      resolve(parent) {
        return Course.findById(parent.courseId); // for deep population fallback
      },
    },
    progress: { type: GraphQLInt },
    objectivesCompleted: { type: new GraphQLList(GraphQLString) },
    startedAt: { type: GraphQLString },
    completedAt: { type: GraphQLString },
  }),
});

// --- Define StudentType ---

const StudentType = new GraphQLObjectType({
  name: 'Student',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    email: { type: GraphQLString },
    enrolledCourses: { type: new GraphQLList(EnrolledCourseType) },
  }),
});

// --- Root Query ---

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    courses: {
      type: new GraphQLList(CourseType),
      resolve() {
        return Course.find();
      },
    },
    course: {
      type: CourseType,
      args: { id: { type: GraphQLID } },
      resolve(_, args) {
        return Course.findById(args.id);
      },
    },
    students: {
      type: new GraphQLList(StudentType),
      resolve() {
        return Student.find();
      },
    },
    student: {
      type: StudentType,
      args: { id: { type: GraphQLID } },
      resolve(_, args) {
        return Student.findById(args.id);
      },
    },
  },
});

// --- Mutations ---

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addCourse: {
      type: CourseType,
      args: {
        title: { type: GraphQLString },
        description: { type: GraphQLString },
        duration: { type: GraphQLString },
      },
      resolve(_, args) {
        const course = new Course({
          title: args.title,
          description: args.description,
          duration: args.duration,
        });
        return course.save();
      },
    },

    addStudent: {
      type: StudentType,
      args: {
        name: { type: GraphQLString },
        email: { type: GraphQLString },
      },
      resolve(_, args) {
        const student = new Student({
          name: args.name,
          email: args.email,
        });
        return student.save();
      },
    },

    enrollStudent: {
      type: StudentType,
      args: {
        studentId: { type: GraphQLID },
        courseId: { type: GraphQLID },
      },
      async resolve(_, { studentId, courseId }) {
        const student = await Student.findById(studentId);
        if (!student) throw new Error('Student not found');

        const alreadyEnrolled = student.enrolledCourses.some(
          (ec) => ec.courseId.toString() === courseId
        );
        if (alreadyEnrolled) {
          throw new Error('Student already enrolled in this course');
        }

        student.enrolledCourses.push({
          courseId,
          progress: 0,
          objectivesCompleted: [],
          startedAt: new Date(),
        });
        return student.save();
      },
    },

    updateProgress: {
      type: StudentType,
      args: {
        studentId: { type: GraphQLID },
        courseId: { type: GraphQLID },
        progress: { type: GraphQLInt },
        objectivesCompleted: { type: new GraphQLList(GraphQLString) },
      },
      async resolve(_, { studentId, courseId, progress, objectivesCompleted }) {
        const student = await Student.findById(studentId);
        if (!student) throw new Error('Student not found');

        const enrolled = student.enrolledCourses.find(
          (ec) => ec.courseId.toString() === courseId
        );

        if (!enrolled) throw new Error('Enrollment not found');

        enrolled.progress = progress;
        enrolled.objectivesCompleted = objectivesCompleted;

        if (progress === 100 && !enrolled.completedAt) {
          enrolled.completedAt = new Date();
        }

        return student.save();
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});
