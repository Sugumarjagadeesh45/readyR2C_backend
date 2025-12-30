const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email',
      ],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    userId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      uppercase: true,
      sparse: true 
      // Remove index: true if you have it here
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'transgender', 'other'],
    },
    profilePicture: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    registrationComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// If you have this line, remove it to avoid duplicate indexes
// UserSchema.index({ userId: 1 });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.canLoginWithPassword = function () {
  return !!this.password;
};

module.exports = mongoose.model('User', UserSchema);



// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const UserSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       trim: true,
//     },
//     email: {
//       type: String,
//       unique: true,
//       sparse: true,
//       match: [
//         /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
//         'Please provide a valid email',
//       ],
//       trim: true,
//       lowercase: true,
//     },
//     phone: {
//       type: String,
//       required: false,
//       unique: true,
//       sparse: true,
//       trim: true,
//     },
//     password: {
//       type: String,
//       required: false,
//       minlength: [6, 'Password must be at least 6 characters'],
//       select: false,
//     },
//     userId: {
//       type: String,
//       unique: true,
//       required: true,
//       trim: true,
//       uppercase: true
//     },
//     dateOfBirth: {
//       type: Date,
//     },
//     gender: {
//       type: String,
//       enum: ['male', 'female', 'transgender', 'other'],
//     },
//     profilePicture: {
//       type: String,
//       default: '',
//     },
//     googleId: {
//       type: String,
//       unique: true,
//       sparse: true,
//     },
//     isPhoneVerified: {
//       type: Boolean,
//       default: false,
//     },
//     isEmailVerified: {
//       type: Boolean,
//       default: false,
//     },
//     registrationComplete: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// UserSchema.pre('save', async function (next) {
//   if (!this.isModified('password') || !this.password) return next();
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// UserSchema.methods.comparePassword = async function (candidatePassword) {
//   if (!this.password) return false;
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// UserSchema.methods.canLoginWithPassword = function () {
//   return !!this.password;
// };

// module.exports = mongoose.model('User', UserSchema);

