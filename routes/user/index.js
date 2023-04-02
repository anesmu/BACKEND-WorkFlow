const router = require('express').Router()
const auth = require('../../middlewares/auth')
const controller = require('./user.controller')

/* Sign up */
router.post('/join', controller.join)

/* Login */
router.post('/login', controller.login)

/* Get user information */
router.get('/info', auth, controller.getInfo)

/* Update user information */
router.put('/info', auth, controller.updateInfo)

/* Verify reset code */
router.get('/reset', controller.verifyResetCode)

/* Issue reset code */
router.post('/reset', controller.issueResetCode)

/* Delete reset code */
router.delete('/reset', controller.deleteResetCode)

/* Update password */
router.put('/reset', controller.updatePassword)

/* Search for users by email */
router.get('/email/:email', auth, controller.getUserList)

module.exports = router