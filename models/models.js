var mongoose = require('mongoose');
var _ = require('underscore');
var blogSchema = mongoose.Schema({
    owner_id: String, //has relation to the subgroup
    firstName: String,
    lastName: String,
    gender: Boolean,//0=female,1=male
    dob: Date,
    memorialDate: Date,
    anniverssaryDays: [
        {
            event: String,
            date: Date
        }
    ],
    profilePicWide: String,
    profilePicPortrait: String,
    subgroup: Number,//0:mothers,1:fathers,2:family,3:friends
    views: Number,
    title: String,
    author: String,//author is the url TODO:Ensure that there are NEVER TWO "urls"/authors of the same string
    //if you dont it will always pick the first and cause confusion
    //TODO:ensure that no special characters are allowed in the input of this data field (url)
    text: String,
    reversed: {type: Boolean, default: false},
    comments: [
        {
            body: String,
            date: Date,
            username: String
        }
    ],
    date: { type: Date, default: Date.now },
    updateDate: {type: Date, default: Date.now},
    hidden: Boolean,
    meta: {
        votes: Number,
        favs: Number
    },
    postText: [
        {
            user_id: String,
            text: String,
            date: {type: Date, default: Date.now},
            postType: Number
        }
    ],//postType 0=text,1=pic,2=video
    titleImage: String,
    categories: [
        {
            name: String
        }
    ],
    petitions: [  //do petitions belong to users or profiles
        {
            title: String,
            text: String,
            dateStarted: {type: Date, default: Date.now},
            signatures: [
                {
                    user_id: String,
                    signedDate: Date
                }
            ]
        }
    ]

});
var userSchema = mongoose.Schema({
    username: String,
    password: String,
    admin: String,
    email: String,
    profiles: [
        {profile: String}
    ],
    city: String,
    Age: Number,
    avatar: String//urllink

});
var updateSchema = mongoose.Schema({
    lastUpdate: {type: Date, default: Date.now()}
});
var urlSchema = mongoose.Schema({
    publicFacingUrl: String,
    profileId: String
})
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    console.log("connected");
});
var Blog = mongoose.model('Blog', blogSchema);
var User = mongoose.model('User', userSchema);
var Update = mongoose.model('Update', updateSchema);
var Url = mongoose.model('Url', urlSchema);
/*
 //set all profiles to administrator as owner
 Blog.find({}, function (err, blogs) {
 _.each(blogs, function (blog, key) {
 if (key % 2 == 0) {
 User.findOne({username: "administrator"}, function (err, user) {
 blogs[key].owner_id = user._id;
 })
 } else {
 User.findOne({username: "projectskillz"}, function (err, user) {
 blogs[key].owner_id = user._id;
 })
 }
 blogs[key].owner_id = users._id;
 console.log(blogs[key]);
 blogs[key].save(function (err) {
 if (err)console.log(err.message);
 })
 })
 })
 //set all profiles basic data
 Blog.find({}, function (err, blogs) {
 _.each(blogs, function (blog, key) {
 blogs[key].firstName = "Johnny";
 blogs[key].lastName = "Angel";
 blogs[key].gender = 0;
 blogs[key].dob = new Date(1997, 05, 15);
 blogs[key].memorialDate = new Date();
 if (key % 2 == 0)
 blogs[key].subgroup = 0;
 else
 blogs[key].subgroup = 1;
 console.log(blogs[key]);
 blogs[key].save(function (err) {
 if (err)console.log(err.message);
 })
 })
 })


 User.findOne({username: "TestName"}, function (err, users) {
 console.log(users);

 users.profiles.push({profile: '516a329362f0af3550000009'});
 users.save(function (err) {
 if (err)console.log(err.message);

 })


 })
 */

module.exports = {
    Blog: Blog,
    User: User,
    Update: Update,
    Url: Url
}