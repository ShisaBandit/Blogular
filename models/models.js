var mongoose = require('mongoose');


var blogSchema = mongoose.Schema({
    group:{type: Boolean, default: false},
    owner_id: String, //has relation to the subgroup
    firstName: String,
    lastName: String,
    gender: Boolean,//0=female,1=male
    dob: Date,
    memorialDate: Date,
    anniverssaryDays: [
        {
            description: String,
            event: String,
            date: Date
        }
    ],
    profilePicWide: String,
    profilePicPortrait: String,
    subgroup: Number,//0:mothers,1:fathers,2:family,3:friends,4:brothers,5:sisters,6:others,7:grandchild,8:child
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
            username: String,
            event: String,
            gravatar: String,
            text: String,
            date: {type: Date, default: Date.now},
            postType: Number,
            saved: Boolean,
            comments: [
                {
                    user_id: String,
                    username: String,
                    gravatar: String,
                    text: String,
                    voteUp: Number,
                    voteDown: Number,
                    data: {type: Date, default: Date.now}

                }
            ],
            photos: [
                {
                    filename: String,
                    uploader: String
                }
            ],
            embedYouTube: String,
            embedAnimoto: String

        }
    ],//postType 0=text,1=pic,2=video
    orphanedphotos: [
        {             //TODO:Upon upload of photo generate thumbnails by other process not node
            filename: String,
            uploader: String
        }
    ],
    albums: [
        {
            name: String,
            photos: [
                {
                    filename: String
                }
            ]
        }
    ],
    titleImage: String,
    categories: [
        {
            name: String
        }
    ]

});
var petitionSchema = mongoose.Schema({
    title: {type: String, required: true},
    text: {type: String, required: true},
    dateStarted: {type: Date, default: Date.now},
    signatures: [
        {
            initals: String,
            cityState: String,
            user_id: String, //user  id ??
            signedDate: {type: Date, default: Date.now()}
        }
    ]
})
var userSchema = mongoose.Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, require: true},
    username: {type: String, required: true},
    password: {type: String, required: true},
    admin: String,
    email: {type: String, required: true},//normalize to lowercase
    gravatar: String,
    profiles: [
        {profile: String}
    ],
    address: String,
    city: String,
    state: String,
    Age: Number,
    avatar: String,//urllink
    lost: Number,  //codes are   0:mother,1:father
    firstAccess: {type: Boolean, default: true},
    about: String,
    notifications: [
        {
            text: String,
            viewed: {type: Boolean, default: false}
        }
    ]
});

/*
 * Creating workshop blog post


 * Should contain the following info

 * Name of event
 * Name of key person(s)
 * Date of event
 * Time of event
 * Location of event if applicable
 * Google+ address of event if applicable
 * Event photo
 * Event organiser contact info
 * Event details
 */
var workshopSchema = mongoose.Schema({
    eventname: String,
    keyfirstname: String,
    keylastname: String,
    eventdate: {type: Date, default: Date.now()},
    eventLocaction: String,
    hangour: String,
    photo: String,
    eventOrganizer: String,
    eventOrganizerPhone: String,
    eventOrganizerFax: String,
    eventOrganizerEmail: String,
    eventOrganizerWebsite: String,
    eventOrganizerAddress: String,
    eventDetails: String,
    googleHangoutURL: String
});


var groupTypeSchema = mongoose.Schema({
    name: String,
    code: Number
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
var Petition = mongoose.model('Petition', petitionSchema);
var Workshop = mongoose.model('Workshop',workshopSchema);
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
//populate some commments on blog  { "_id" : 516a720562f0af3550000010}
//post text   { "_id" : 519b4f4a9023298a1500000a}
/*
 Blog.findOne({_id: '516a720562f0af3550000010'},function(err,blog){
 for(var x = 0;x<10;x++){
 blog.postText[2].comments.push({text:"THIS IS TEXT TEXT", user_id : '51487fc5da6c0dc968000003'});
 }
 blog.save();

 })
 */

module.exports = {
    Blog: Blog,
    User: User,
    Update: Update,
    Url: Url,
    Petition: Petition,
    Workshop:Workshop
}