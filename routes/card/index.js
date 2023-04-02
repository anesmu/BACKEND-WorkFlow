const router = require('express').Router()
const controller = require('./card.controller')

/* Get card details */
router.get("/:cid", controller.getCardDetail)

/* Get card activity */
router.get("/:cid/activity", controller.getActivityByCard)

/* Get card comments */
router.get("/:cid/comment", controller.getCommentByCard)

/* Add a new card */
router.post('/', controller.addCard)

/* Delete a card */
router.delete("/:cid", controller.deleteCard)

/* Update a card */
router.put("/:cid", controller.updateCard)

/* Move a card */
router.patch("/:cid", controller.moveCard)

module.exports = router;