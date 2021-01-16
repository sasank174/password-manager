const express = require("express"),
    ejs = require("ejs"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    session = require("express-session"),
    nodemailer = require("nodemailer"),
    bcrypt = require("bcrypt"),
    {
        response: response
    } = require("express"),
    {
        google: google
    } = require("googleapis"),
    app = express();
app.use(express.static("public")), app.set("view engine", "ejs"), app.use(bodyParser.urlencoded({
    extended: !0
}));
const CLIENT_ID = "444653265576-l985kkko8agot59rr8qr3ukqudjujn13.apps.googleusercontent.com",
    CLIENT_SCERET = "_DSol-1yJ8uzenqPsrcoyzSc",
    REDIRECT_URI = "https://developers.google.com/oauthplayground",
    REFRESH_TOKEN = "1//04ry1qL86WWP0CgYIARAAGAQSNwF-L9IrbK6nTxWeqczcYtiwBbpiiiyq7Z8mSTMv7RAXJ-x2lyQvzV5vErRnAW6JEWt0wVO_8zA",
    oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SCERET, REDIRECT_URI);
async function sendMail(e, r, o, i) {
    try {
        const n = await oAuth2Client.getAccessToken(),
            s = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    type: "OAuth2",
                    user: "yashwanthmadhulla@gmail.com",
                    clientId: CLIENT_ID,
                    clientSecret: CLIENT_SCERET,
                    refreshToken: REFRESH_TOKEN,
                    accessToken: n
                }
            }),
            t = {
                from: "yashwanthmadhulla@gmail.com",
                to: e,
                subject: r,
                text: o,
                html: i
            };
        return await s.sendMail(t)
    } catch (e) {
        return e
    }
}
oAuth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
});
const saltRounds = 10;
app.use(session({
    name: "sid",
    secret: "keyboard cat",
    resave: !1,
    saveUninitialized: !1,
    cookie: {
        maxAge: 6e6
    }
}));
var redirectlogin = (e, r, o) => {
        e.session.userid ? o() : r.redirect("/")
    },
    redirecthome = (e, r, o) => {
        e.session.userid ? r.redirect("/main") : o()
    };
mongoose.connect("mongodb+srv://yashwanth:HUnjyPUWaCjmdXGX@cluster0.1tytf.mongodb.net/manage", {
    useNewUrlParser: !0,
    useUnifiedTopology: !0,
    useCreateIndex: !0,
    useFindAndModify: !1
}).then(() => {
    console.log("connection to database established")
}).catch(e => {
    console.log(`db error ${e.message}`), process.exit(-1)
});
const userSchema = new mongoose.Schema({
        email: String,
        password: String,
        tpassword: String,
        isverified: {
            type: Boolean,
            default: !1
        }
    }),
    User = new mongoose.model("User", userSchema),
    managerSchema = new mongoose.Schema({
        id: String,
        website: String,
        username: String,
        upassword: String
    }),
    Manage = new mongoose.model("Manage", managerSchema);
var information = "";
app.get("/", redirecthome, function (e, r) {
    r.render("login", {
        information: information
    })
}), app.get("/signup", redirecthome, function (e, r) {
    r.render("signup")
}), app.get("/error", function (e, r) {
    e.session.destroy(e => {
        e ? r.redirect("error") : (r.clearCookie("sid"), r.redirect("/"))
    }), r.render("error")
}), app.get("/main", redirectlogin, function (e, r) {
    let o = e.session.userid;
    Manage.find({
        id: o
    }, function (e, o) {
        e ? r.render(error) : r.render("main", {
            userdetails: o
        })
    })
}), app.get("/logout", function (e, r) {
    e.session.destroy(e => {
        e ? r.redirect("error") : (r.clearCookie("sid"), r.redirect("/"))
    })
}), app.get("/delete", function (e, r) {
    let o = e.query.userid;
    Manage.deleteOne({
        _id: o
    }, function (e) {
        e ? r.redirect("error") : r.redirect("/main")
    })
}), app.get("/forgot", function (e, r) {
    r.render("forgot")
}), app.get("/verify", function (e, r) {
    let o = e.query.email,
        i = e.query.password;
    User.findOne({
        email: o
    }, function (e, n) {
        e ? r.redirect("error") : n ? n.isverified ? (information = "already registered login", r.redirect("/")) : n.password == i ? User.updateOne({
            email: o
        }, {
            isverified: !0
        }, function (e) {
            e ? r.redirect("error") : (information = "verified sucesses", r.redirect("/"))
        }) : (information = "url was incorrect check it properly", r.redirect("/")) : (information = "SignUp now to acesses", r.redirect("/"))
    })
}), app.get("/changepass", function (e, r) {
    let o = e.query.email,
        i = e.query.password;
    User.findOne({
        email: o
    }, function (e, n) {
        e ? r.redirect("error") : n ? n.tpassword == i ? User.updateOne({
            email: o
        }, {
            password: i,
            tpassword: "",
            isverified: !0
        }, function (e) {
            e ? r.redirect("error") : (information = "password changed sucesses", r.redirect("/"))
        }) : (information = "url was incorrect check it properly", r.redirect("/")) : (information = "SignUp now to acesses", r.redirect("/"))
    })
}), app.post("/", redirecthome, function (e, r) {
    let o = e.body.email,
        i = e.body.password;
    User.findOne({
        email: o
    }, function (o, n) {
        o ? r.redirect("error") : n ? n.isverified ? bcrypt.compare(i, n.password, function (o, i) {
            1 == i ? (information = "", e.session.userid = n.email, r.redirect("/main")) : (information = "incorrect password", r.redirect("/"))
        }) : (information = "verify your email", r.redirect("/")) : (information = "not yet registered", r.redirect("/"))
    })
}), app.post("/signup", redirecthome, function (e, r) {
    let o = e.body.email,
        i = e.body.password;
    User.findOne({
        email: o
    }, function (n, s) {
        n ? r.redirect("error") : s ? s.isverified ? (information = "user already registered", r.redirect("/")) : (information = "already registered verify your email to continue", r.redirect("/")) : bcrypt.hash(e.body.password, 10, function (e, n) {
            let s = "https://password-savers.herokuapp.com/verify?email=" + o + "&password=" + (i = n),
                t = o,
                a = "<div style='background: rgb(180, 248, 90);padding: 10px;'><h1>welcome</h1><h2>thank you for using our website https://password-savers.herokuapp.com/</h2><a href='" + s + "'style='text-decoration: none;background: rgb(92, 134, 250);padding: 15px;color: white;font-size: 20px;'><span>click me to verify your account</span></a><p>if the link is not working copy and paste the url in your browser</p><p>'" + s + "'</p></div>";
            new User({
                email: o,
                password: i,
                tpassword: ""
            }).save(function (e) {
                e ? r.redirect("error") : sendMail(t, "verification register mail", "verification register mail", a).then(e => "" == e.accepted[0] ? r.render("error") : (information = "registered sucessfully verify your email to continue", r.redirect("/"))).catch(e => console.log(e.message))
            })
        })
    })
}), app.post("/forgot", function (e, r) {
    let o = e.body.email,
        i = e.body.password1;
    User.findOne({
        email: o
    }, function (n, s) {
        n ? r.redirect("error") : s ? bcrypt.hash(e.body.password1, 10, function (e, n) {
            let s = "https://password-savers.herokuapp.com/changepass?email=" + o + "&password=" + (i = n),
                t = o,
                a = "<div style='background: rgb(180, 248, 90);padding: 10px;'><h1>welcome</h1><h2>thank you for using our website https://password-savers.herokuapp.com/</h2><a href='" + s + "' style='text-decoration: none;background: rgb(92, 134, 250);padding: 15px;color: white;font-size: 20px;'><span>click me to change your account password</span></a><p>if the link is not working copy and paste the url in your browser</p><p>'" + s + "'</p></div>";
            User.updateOne({
                email: o
            }, {
                tpassword: i
            }, function (e) {
                e ? r.redirect("error") : sendMail(t, "verification mail to change password", "verification mail to change password", a).then(e => "" == e.accepted[0] ? r.render("error") : (information = "verify your mail to change password", r.redirect("/"))).catch(e => console.log(e.message))
            })
        }) : (information = "user not yet registered", r.redirect("/"))
    })
}), app.post("/new", redirectlogin, function (e, r) {
    let o = e.body.url,
        i = e.body.username,
        n = e.body.upassword;
    new Manage({
        id: e.session.userid,
        website: o,
        username: i,
        upassword: n
    }).save(function (e) {
        e ? r.redirect("error") : r.redirect("/main")
    })
}), app.listen(process.env.PORT || 3e3, function () {
    console.log("http://localhost:3000/")
});