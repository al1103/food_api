const express = require("express");
const router = express.Router();
const {
  handleNewMessage,
  handleImageAndPrompt,
  promptAnswer,
  chatSuggestDish,
} = require("../controllers/googleGenerativeAI");

router.post("/chat", chatSuggestDish);
router.post("/image-prompt", handleImageAndPrompt);
router.post("/promptAnswer", promptAnswer);
module.exports = router;
