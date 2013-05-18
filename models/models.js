var mongoose = require('mongoose');
var _ = require('underscore');
var blogSchema = mongoose.Schema({
    owner_id: String,
    firstName: String,
    lastName: String,
    gender: Boolean,//0=female,1=male
    dob: Date,
    memorialDate:Date,
    anniverssaryDays: [
        {
            event: String,
            date: Date
        }
    ],
    profilePicWide:String,
    profilePicPortrait:String,
    subgroup:Number,//0:mothers,1:fathers,2:family,3:friends
    views: Number,
    title: String,
    author: String,
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
            signatures: [{
                user_id:String,
                signedDate:Date
            }]
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
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    console.log("connected");
});
var Blog = mongoose.model('Blog', blogSchema);
var User = mongoose.model('User', userSchema);
var Update = mongoose.model('Update', updateSchema);
   /*
//set all profiles to administrator as owner
User.findOne({username:"administrator"},function(err,users){
    console.log(users);
    Blog.find({},function(err,blogs){
        _.each(blogs,function(blog,key){
            blogs[key].owner_id = users._id;
            console.log(blogs[key]);
            blogs[key].save(function(err){
                if(err)console.log(err.message);
            })
        })
    })
})
                     //set all profiles basic data
    Blog.find({},function(err,blogs){
        _.each(blogs,function(blog,key){
            blogs[key].firstName = "FirstName";
            blogs[key].lastName = "LastName";
            blogs[key].gender = 0;
            blogs[key].dob = new Date(1977,02,07);
            blogs[key].memorialDate = new Date();

            console.log(blogs[key]);
            blogs[key].save(function(err){
                if(err)console.log(err.message);
            })
        })
    })
    */
   /*
User.findOne({username:"projectskillz"},function(err,users){
    console.log(users);

    users.profiles.push({profile:'516a329362f0af3550000009'});
    users.save(function(err){
        if(err)console.log(err.message);

    })


})
     */
module.exports = {
    Blog: Blog,
    User: User,
    Update: Update
}