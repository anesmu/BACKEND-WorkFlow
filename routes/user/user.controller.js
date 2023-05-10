const jwt = require('jsonwebtoken')
const models = require('../../models')
const User = models.db.user
const salt = require('../../config/auth.config').salt
const nodemailer = require('nodemailer')
const mailConfig = require('../../config/mail.config')
const uuidv4 = require('uuid/v4')
const Op = models.sequelize.Op
const ErrorHandler = require('../../middlewares/error').ErrorHandler

const smtpTransport = nodemailer.createTransport({
    service: 'Outlook',
    auth: {
        user: mailConfig.user,
        pass: mailConfig.pass
    }
})

/** Sign up */
const join = (req, res) => {
    let t
    const {
        username,
        password,
        email
    } = req.body
    const create = (user) => {
        if (user) {
            throw new Error('EXIST')
        } else {
            return User.create({
                username,
                password,
                email,
                photo: username.substr(0, 1)
            }, {
                transaction: t
            })
        }
    }

    const respond = () => {
        res.json({
            message: "You have successfully signed up for a account.",
            result: true
        })
    }

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    models.sequelize.transaction(transaction => {
        t = transaction
        return User.findOne({
                transaction: t,
                where: {
                    email
                }
            })
            .then(create)
    })
    .then(respond)
    .catch(onError)
}

/** login */
const login = (req, res) => {
    let t
    const {
        email,
        password
    } = req.body
    console.log(req.body)
    const check = (user) => {
        if (!user) {
            throw new Error('NOAUTH')
        } else {
            if (user.password === password) {
                const p = new Promise((resolve, reject) => {
                    jwt.sign({
                            uid: user.uid,
                            username: user.username,
                            email: user.email
                        },
                        salt, {}, (err, token) => {
                            if (err) reject(err)
                            resolve({token, username: user.username})
                        })
                })
                return p
            } else {
                throw new Error("NOAUTH")
            }
        }
    }

    const respond = ({token, username}) => {
        res.json({
            message: "You have successfully logged in.",
            token,
            data: {username},
            result: true
        })
    }

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    models.sequelize.transaction(transaction => {
        t = transaction
        return User.findOne({
            where: {
                email
            }
        }).then(check)
    })
    .then(respond)
    .catch(onError)
}

/** Getting user information. */
const getInfo = (req, res) => {
    let t
    const decoded = req.decoded;

    const respond = (user) => {
        res.json({
            result: true,
            user
        })
    }

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    models.sequelize.transaction(transaction => {
        t = transaction
        return User.findOne({
            where: {
                uid: decoded.uid
            },
            attributes: ['uid', 'username', 'email', 'photo'],
            transaction: t
        })
    }).then(respond)
    .catch(onError)
}

/** Update user information */
const updateInfo = (req, res) => {
    let t
    const {
        email
    } = req.body

    const respond = () => {
        res.json({
            result: true,
            message: "You have successfully edited your user information."
        })
    }

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    model.sequelize.transaction(transaction => {
        t = transaction
        return User.update({
            email
        }, {
            transaction: t,
            where: {
                uid: user.uid
            }
        })
    }).then(respond)
    .catch(onError)
}

/** Verify  reset code */
const verifyResetCode = (req, res) => {
    let t
    const {
        uid,
        resetCode
    } = req.query

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    models.sequelize.transaction(transaction => {
        t = transaction
        return User.findOne({
            transaction: t,
            where: {
                uid,
                reset_code: resetCode
            }
        }).then((user) => {
            if (user) {
                return;
            } else {
                throw new Error("NOCODE")
            }
        })
    }).then(() => {
        res.json({
            result: true
        })
    }).catch(onError)
}

const deleteResetCode = (req, res) => {
    let t
    const {
        uid,
        resetCode
    } = req.query

    const deleteCode = (user) => {
        if (user) {
            return User.update({
                reset_code: null,
                reset_code_expiredate: null
            }, {
                where: {
                    uid,
                    reset_code: resetCode
                },
                transaction: t
            })
        } else {
            throw new Error("NOCODE")
        }
    }

    const respond = () => {
        res.json({
            result: true,
            message: "Successfully deleted the code."
        })
    }

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    models.sequelize.transaction(transaction => {
        t = transaction
        return User.findOne({
            transaction: t,
            where: {
                uid,
                reset_code: resetCode
            }
        }).then(deleteCode)
    }).then(respond)
    .catch(onError)
}

const issueResetCode = (req, res) => {
    let t
    const {
        email
    } = req.body

    const generateCode = (user) => {
        if (!user) {
            throw new Error("NOAUTH")
        } else {
            let date = new Date()
            let reset_code = uuidv4()
            date.setDate(date.getDate() + 1)
            return User.update({
                reset_code,
                reset_code_expiredate: date
            }, {
                where: {
                    uid: user.uid
                },
                transaction: t
            })
        }
    }

    const getUserData = () => {
        return User.findOne({
            transaction: t,
            attributes: ["uid", "username", "reset_code"],
            where: {
                email
            }
        })
    }

    const sendMail = (user) => {
        let {
            uid,
            username,
            reset_code
        } = user
        let reset_url = `http://localhost:4200/reset?uid=${uid}&resetCode=${reset_code}&reset=true`
        let dont_reset_url = `http://localhost:4200/reset?uid=${uid}&resetCode=${reset_code}&reset=false`
        let mailOption = {
            from: mailConfig.user,
            to: email,
            subject: 'Work flow Password Reset',
            html: `<div style="font: 15px 'Helvetica Neue',Arial,Helvetica;background-color: #F0F0F0; height: 420px; color: #333;">
            <table style="color: #333;padding: 0;margin: 0;width: 100%;font: 15px 'Helvetica Neue',Arial,Helvetica;">
                <tbody>
                    <tr width="100%">
                        <td>
                            <table style="border: none;padding: 0px 18px;margin: 50px auto;width: 500px;">
                                <tbody>
                                    <tr width="100%" height="57">
                                        <td style="background-color: #a4b5bf; border-top-left-radius: 4px;border-top-right-radius: 4px;text-align: center;padding: 12px 18px;"><img
                                                width="120px" src="./images/WM-icon.png" alt=""></td>
                                    </tr>
                                    <tr width="100%">
                                        <td style="background: #fff; padding: 18px; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px;">
                                            <div style="font-weight: bold;font-size: 20px;color: #333;margin: 0;">Hello ${username},</div>
                                            <p style="font-size: 15px; color: #333;">We heard you need a password reset. Click the link below
                                                and you'll be redirected to a secure site from which you can set a new password.</p>
                                            <p style="text-align: center; color: #333; font-size: 15px;"><a href="${reset_url}" target="_blank" style="background-color: #3aa54c;border-radius: 3px;text-decoration: none;color: #fff;line-height: 1.25em;font-size: 16px;font-weight: 700;padding: 10px 18px;margin: 24px auto 24px;display: block;width: 180px;">Reset Password</a></p>
                                            <p style="color: #939393">If you didn't try to reset your password, <a href="${dont_reset_url}" style="color: #365FC9">click here</a> and we'll forget this ever happened.</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>`
        }
        smtpTransport.sendMail(mailOption, function (err, info) {
            if (err) {
                console.error('Send Mail error : ', err)
                throw new Error('MAILFAIL')
            } else {
                console.log(info)
                return;
            }
        })
    }

    const respond = () => {
        res.json({
            result: true,
            message: "The code has been issued successfully. Please check your email."
        })
    }

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    models.sequelize.transaction(transaction => {
        t = transaction
        return User.findOne({
                transaction: t,
                where: {
                    email
                },
                attributes: ['uid', 'username', 'email']
            }).then(generateCode)
            .then(getUserData)
            .then(sendMail)
    })
    .then(respond)
    .catch(onError)
}

const updatePassword = (req, res) => {
    let t
    const {
        password
    } = req.body
    const {
        uid,
        resetCode
    } = req.query

    const verify = (user) => {
        if (user.reset_code == resetCode &&
            new Date(user.reset_code_expiredate) > Date.now()) return true
        else return false
    }

    const check = (user) => {
        if (!user) {
            throw new Error("NOAUTH")
        } else {
            if (verify(user)) {
                return User.update({
                    password,
                    reset_code: null,
                    reset_code_expiredate: null
                }, {
                    where: {
                        username: user.username
                    },
                    transaction: t
                })
            } else {
                throw new Error("NOCODE")
            }
        }
    }

    const respond = () => {
        res.json({
            result: true,
            message: "Password has been successfully changed. Please log in with your updated password."
        })
    }

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    models.sequelize.transaction(transaction => {
        t = transaction
        return User.findOne({
            where: {
                uid
            },
            attributes: ["uid", "username", "reset_code", "reset_code_expiredate"],
            transaction: t
        }).then(check)
    })
    .then(respond)
    .catch(onError)
}

const getUserList = (req, res) => {
    let t
    const {
        email
    } = req.params

    const respond = (user) => {
        res.json({
            result: true,
            data: user
        })
    }

    const onError = (error) => {
        console.error(error)
        res.status(400).json(ErrorHandler(error.message))
    }

    models.sequelize.transaction(transaction => {
        t = transaction
        return User.findAll({
            where: {
                email: {
                    [Op.like]: email + "%"
                }
            },
            transaction: t,
            attributes: ["uid", "email", "username", "photo"]
        })
    }).then(respond)
    .catch(onError)
}

module.exports = {
    join,
    login,
    getInfo,
    updateInfo,
    verifyResetCode,
    issueResetCode,
    deleteResetCode,
    updatePassword,
    getUserList
}

