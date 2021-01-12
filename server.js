const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
var nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const {
    response
} = require("express");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

// =============================================

const saltRounds = 10;

// =============================================

app.use(session({
    name: "sid",
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 100
    }
}));

var redirectlogin = (req, res, next) => {
    if (!req.session.userid) {
        res.redirect("/");
    } else {
        next()
    }
}

var redirecthome = (req, res, next) => {
    if (req.session.userid) {
        res.redirect("/main");
    } else {
        next()
    }
}

// =============================================

mongoose.connect("mongodb+srv://yashwanth:HUnjyPUWaCjmdXGX@cluster0.1tytf.mongodb.net/manage", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log(`connection to database established`)
}).catch(err => {
    console.log(`db error ${err.message}`);
    process.exit(-1)
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    tpassword: String,
    isverified: {
        type: Boolean,
        default: false
    }
});

const User = new mongoose.model("User", userSchema);

const managerSchema = new mongoose.Schema({
    id: String,
    website: String,
    username: String,
    upassword: String
});

const Manage = new mongoose.model("Manage", managerSchema);

// =============================================

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'manamwhy@gmail.com',
        pass: 'neekuenduku'
    }
});

// =============================================

var information = "";

app.get("/", redirecthome, function (req, res) {
    res.render("login", {
        information: information
    });
});

app.get("/signup", redirecthome, function (req, res) {
    res.render("signup");
});

app.get("/error",function(req,res){
    req.session.destroy(err => {
        if (err) {
            res.redirect("error");
        } else {
            res.clearCookie("sid");
            res.redirect("/");
        }
    })
    res.render("error");
});

app.get("/main", redirectlogin, function (req, res) {


    let email = req.session.userid;
    Manage.find({
        "id": email
    }, function (err, founduser) {
        if (err) {
            res.render(error);
        } else {
            res.render("main", {
                userdetails: founduser
            });
        }
    })
});

app.get("/logout", function (req, res) {
    req.session.destroy(err => {
        if (err) {
            res.redirect("error");
        } else {
            res.clearCookie("sid");
            res.redirect("/");
        }
    })
})

app.get("/delete", function (req, res) {
    let userid = req.query.userid;

    Manage.deleteOne({
        _id: userid
    }, function (err) {
        if (err) {
            res.redirect("error");
        } else {
            res.redirect("/main");
        }
    })
});

app.get("/forgot", function (req, res) {
    res.render("forgot");
});

app.get("/verify", function (req, res) {
    let email = req.query.email;
    let password = req.query.password;

    User.findOne({
        email: email
    }, function (err, founduser) {
        if (err) {
            res.redirect("error");
        } else {
            if (founduser) {
                if (founduser.isverified) {
                    information = "already registered login";
                    res.redirect("/");
                } else {
                    if (founduser.password == password) {
                        User.updateOne({
                            email: email
                        }, {
                            isverified: true
                        }, function (error) {
                            if (error) {
                                res.redirect("error");
                            } else {
                                information = "verified sucesses";
                                res.redirect("/");
                            }
                        })
                    } else {
                        information = "url was incorrect check it properly";
                        res.redirect("/");
                    }
                }
            } else {
                information = "SignUp now to acesses";
                res.redirect("/");
            }
        }
    })
});

app.get("/changepass", function (req, res) {
    let email = req.query.email;
    let password = req.query.password;

    User.findOne({
        email: email
    }, function (err, founduser) {
        if (err) {
            res.redirect("error");
        } else {
            if (founduser) {
                if (founduser.tpassword == password) {
                    User.updateOne({
                        email: email
                    }, {
                        password: password,
                        tpassword: "",
                        isverified: true
                    }, function (error) {
                        if (error) {
                            res.redirect("error");
                        } else {
                            information = "password changed sucesses";
                            res.redirect("/");
                        }
                    })
                } else {
                    information = "url was incorrect check it properly";
                    res.redirect("/");
                }
            } else {
                information = "SignUp now to acesses";
                res.redirect("/");
            }
        }
    })
});

// =============================================

app.post("/", redirecthome, function (req, res) {
    let email = req.body.email;
    let password = req.body.password;

    User.findOne({
        email: email
    }, function (err, founduser) {
        if (err) {
            res.redirect("error");
        } else {
            if (founduser) {
                if (founduser.isverified) {
                    bcrypt.compare(password, founduser.password, function (err, result) {
                        if (result == true) {
                            information = "";
                            req.session.userid = founduser.email;
                            res.redirect("/main");
                        } else {
                            information = "incorrect password";
                            res.redirect("/");
                        }
                    });
                } else {
                    information = "verify your email";
                    res.redirect("/");
                }
            } else {
                information = "not yet registered";
                res.redirect("/");
            }
        }
    })
});

app.post("/signup", redirecthome, function (req, res) {
    let email = req.body.email;
    let password = req.body.password;

    User.findOne({
        email: email
    }, function (err, founduser) {
        if (err) {
            res.redirect("error");
        } else {
            if (founduser) {
                if (founduser.isverified) {
                    information = "user already registered";
                    res.redirect("/");
                } else {
                    information = "already registered verify your email to continue";
                    res.redirect("/");
                }
            } else {
                bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
                    password = hash;

                    let link = "https://password-savers.herokuapp.com/verify?email=" + email + "&password=" + password + "";

                    var mailOptions = {
                        from: "'manamwhy@gmail.com'",
                        to: email,
                        subject: 'verification register mail',
                        html: "<div style='background: yellow;padding: 10px;'><h1>welcome</h1><p>hai</p><a href='" + link + "'><span>click me to verify your account</span></a></div>"
                    };

                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            res.redirect("error");
                        } else {
                            console.log('Email sent: ' + info.response);
                            const newUser = new User({
                                email: email,
                                password: password,
                                tpassword: ""
                            });

                            newUser.save(function (error) {
                                if (error) {
                                    res.redirect("error");
                                } else {
                                    information = "registered sucessfully verify your email to continue";
                                    res.redirect("/");
                                }
                            })
                        }
                    });
                });
            }
        }
    })
});

app.post("/forgot", function (req, res) {
    let email = req.body.email;
    let password = req.body.password1;

    User.findOne({
        email: email
    }, function (error, founduser) {
        if (error) {
            res.redirect("error");
        } else {
            if (founduser) {
                bcrypt.hash(req.body.password1, saltRounds, function (err, hash) {
                    password = hash;

                    let link = "https://password-savers.herokuapp.com/changepass?email=" + email + "&password=" + password + "";

                    var mailOptions = {
                        from: "'manamwhy@gmail.com'",
                        to: email,
                        subject: 'verification register mail',
                        html: "<div style='background: yellow;padding: 10px;'><h1>welcome</h1><p>hai</p><a href='" + link + "'><span>click me to change your account password</span></a></div>"
                    };

                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            res.redirect("error");
                        } else {
                            console.log('Email sent: ' + info.response);

                            User.updateOne({
                                email: email
                            }, {
                                tpassword: password
                            }, function (error) {
                                if (error) {
                                    res.redirect("error");
                                } else {
                                    information = "verify your mail to change password";
                                    res.redirect("/");
                                }
                            })
                        }
                    });
                });
            } else {
                information = "user not yet registered";
                res.redirect("/")
            }
        }
    })
});

app.post("/new", redirectlogin, function (req, res) {
    let url = req.body.url;
    let username = req.body.username;
    let upassword = req.body.upassword;

    const newManage = new Manage({
        id: req.session.userid,
        website: url,
        username: username,
        upassword: upassword
    });

    newManage.save(function (error) {
        if (error) {
            res.redirect("error");
        } else {
            res.redirect("/main");
        }
    })
});

// =============================================

app.listen(process.env.PORT || 3000, function () {
    console.log("http://localhost:3000/");
});