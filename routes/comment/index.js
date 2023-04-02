const router = require('express').Router()
const controller = require('./comment.controller')

/* Add a comment */
router.post("/", controller.addComment)

/* Update a comment */
router.put("/:commnet_id", controller.updateComment)

/* Delete a comment */
router.delete("/:comment_id", controller.deleteComment)

module.exports = router;



