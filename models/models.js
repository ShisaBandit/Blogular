var mongoose = require('mongoose');

var blogSchema = mongoose.Schema({
    group:{type: Boolean, default: false},
    pet:{type:Boolean,default:false},
    owner_id: String, //has relation to the subgroup
    user:{type:mongoose.Schema.Types.ObjectId,ref:'User'},//replacing owner id
    members:[
        {type:mongoose.Schema.Types.ObjectId,ref:'User'}
    ],
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
            inStream:{type:Boolean,default:true},
            canComment:{type:Boolean,default:true},
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
            embedAnimoto: String,
            gifts:[{
                date:{type:Date,default:Date.now},
                postText:String,
                fromUser:String
            }]

        }
    ],//postType 0=text,1=pic,2=video,3=anniversary
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
    owner:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
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
});

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
    memwalls: [
        {type:mongoose.Schema.Types.ObjectId, ref: 'Blog'}
    ],
    invitessent:[
        {type:mongoose.Schema.Types.ObjectId, ref: 'User'}
    ],
    sex:Boolean, //female = true,male = false
    address: String,
    zip:String,
    city: String,
    state: String,
    Age: Number,
    dob:Date,
    avatar: String,//urllink
    lost: Number,  //codes are   0:mother,1:father
    firstAccess: {type: Boolean, default: true},
    about: String,
    notifications: [
        {
            text: String,
            viewed: {type: Boolean, default: false}
        }
    ],
    messagedUsers:[//TODO:Finish this up
        {
            user:String
        }
    ]
});
userSchema.pre('save', function (next) {
    // do stuff
    next();
});
var messageSchema = mongoose.Schema({
    to:{type:String,required:true},
    from:{type:String,required:true},
    message:String,
    hideflag:Number,//undefined show both, 1 = hide, from 2 = hide to,3=hide both
    date:{type:Date,default:Date.now()}
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
});

var singleCount = mongoose.Schema({
    totalPicCount:Number
})

var passwordRecoverySchema = mongoose.Schema({
    user_id:String,
    key:String,
    createdDate:{type:Date,default:Date.now()},
    expired:Boolean
})
var invitedUserSchema = mongoose.Schema({
    user_id:String,
    key:String,
    email:String,
    blog:{type:mongoose.Schema.Types.ObjectId, ref: 'Blog'},
    createdDate:{type:Date,default:Date.now()},
    expired:{type:Boolean,default:false}
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
var Message = mongoose.model('Message',messageSchema);
var PasswordRecovery = mongoose.model('PasswordRecovery',passwordRecoverySchema);
var InvitedUser = mongoose.model('InvitedUser',invitedUserSchema);
var SingleCount = mongoose.model('SingleCount',singleCount);

module.exports = {
    Blog: Blog,
    User: User,
    Update: Update,
    Url: Url,
    Petition: Petition,
    Workshop:Workshop,
    Message:Message,
    PasswordRecovery:PasswordRecovery,
    SingleCount:SingleCount,
    InvitedUser:InvitedUser
}