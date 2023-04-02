const router = require('express').Router()
const controller = require('./list.controller')

/* Get cards belonging to a list */
router.get("/:lid", controller.getCardList)

/* Add a new list */
router.post('/', controller.addList)

/* Update the title of a list */
router.put("/:lid", controller.updateList)

/* Delete a list */
router.delete("/:lid", controller.deleteList)

/* Move a list */
router.patch("/:lid", controller.moveList)

module.exports = router