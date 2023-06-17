const jwt = require('jsonwebtoken')
const models = require('../../models')
const User = models.db.user
const salt = require('../../config/auth.config').salt
const nodemailer = require('nodemailer')
const mailConfig = require('../../config/mail.config')
const uuidv4 = require('uuid/v4')
const Sequelize = require('sequelize')
const Op = Sequelize.Op;
const ErrorHandler = require('../../middlewares/error').ErrorHandler
import { Md5 } from 'ts-md5/dist/md5';

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
    password = Md5.hashStr(password);

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
    password = Md5.hashStr(password);

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
    const decoded = req.decoded;

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

    models.sequelize.transaction(transaction => {
        t = transaction
        return User.update({
            email
        }, {
            transaction: t,
            where: {
                uid: decoded.uid
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
        let reset_url = `http://localhost:4200/recovery?uid=${uid}&resetCode=${reset_code}&reset=true`
        let dont_reset_url = `http://localhost:4200/recovery?uid=${uid}&resetCode=${reset_code}&reset=false`
        let mailOption = {
            from: mailConfig.user,
            to: email,
            subject: 'Actualización de contraseña en Work flow',
            html: `
            <div style="padding: 20px; font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #8f32b3; border-radius: 10px; padding: 20px; color: white; text-align: center;">
                        <h1 style="font-size: 24px; margin: 0;">Actualización de contraseña</h1>
                    </div>
                    <div style="border: 2px solid #8f32b3; border-radius: 10px; padding: 20px; margin-top: 20px; color: #333;">
                        <p>Hola ${username},</p>
                        <p>Hemos escuchado que necesitas restablecer tu contraseña. Haz clic en el enlace de abajo y serás redirigido a un sitio seguro desde el cual puedes establecer una nueva contraseña.</p>
                        <div style="text-align: center;">
                            <a href="${reset_url}" style="background-color: #8f32b3; color: #fff; border-radius: 10px; text-decoration: none; padding: 15px; margin: 20px auto; display: inline-block;">Restablecer Contraseña</a>
                        </div>
                        <p style="font-size: 14px; color: #939393">Si no intentaste restablecer tu contraseña, <a href="${dont_reset_url}" style="color: #365FC9">haz clic aquí</a> y olvidaremos que esto sucedió.</p>
                    </div>
                </div>
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
    password = Md5.hashStr(password);

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
                        uid: user.uid
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

