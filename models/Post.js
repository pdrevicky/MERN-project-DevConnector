const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    text: {
        type: String,
        required: true
    },
    name:{
        // User Name
        type: String
    },
    avatar:{
        // User Avatar
        type: String
    },
    likes: [{
        // Where likes come from and only one like per user
        user:{
            type: Schema.Types.ObjectId,
            ref: 'users'
        }
    }],
    comments: [
        {
            user:{
                type: Schema.Types.ObjectId,
                ref: 'users'
            },
            text:{
                type: String,
                required: true
            },
            name:{
                type: String
            },
            avatar:{
                type: String
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ],
    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = Post = mongoose.model('post', PostSchema);