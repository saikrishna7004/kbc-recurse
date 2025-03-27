import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        type: [String],
        required: true,
        validate: [arr => arr.length === 4, 'Must have exactly 4 options']
    },
    correctOption: {
        type: Number,
        required: true,
        min: 0,
        max: 3
    },
    level: {
        type: Number,
        required: true,
        min: 1,
        max: 4
    },
    used: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);
