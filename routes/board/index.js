const router = require('express').Router()
const controller = require('./board.controller')

/* Get all boards */
router.get("/", controller.getBoardList)

/* Get lists of a board */
router.get('/:bid', controller.getBoard)

/* Get activity of a board */
router.get('/:bid/activity', controller.getBoardActivity)

/* Get activity of a member in a board */
router.get('/:bid/user/:uid/activity', controller.getBoardActivityByUser)

/* Add a board */
router.post("/", controller.addBoard)

/* Update a board */
router.put("/:bid", controller.updateBoard)

/* Delete a board */
router.delete("/:bid", controller.deleteBoard)

/* Get member list of a board */
router.get("/:bid/member", controller.getMemeberList)

/* Add a member to a board */
router.post("/:bid/member", controller.addMember)

/* Update a member's permission in a board */
router.put("/:bid/member/:uid", controller.updateMember)

/* Delete a member from a board */
router.delete("/:bid/member/:uid", controller.deleteMember)

module.exports = router