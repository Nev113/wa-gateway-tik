const { Router } = require("express");
const {
  sendMessage,
  sendBulkMessage,
  setSchedule,
} = require("../controllers/message_controller");
const MessageRouter = Router();

MessageRouter.all("/send-message", sendMessage);
MessageRouter.all("/send-bulk-message", sendBulkMessage);
MessageRouter.all("/set-schedule", setSchedule);

module.exports = MessageRouter;
