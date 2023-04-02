const router = require("express").Router()
const controller = require("./activity.controller")

/* Save activity log */
router.post("/", controller.addActivity)

module.exports = router

