const usersRouter = require("./userRoutes");
const aiRoutes = require("./aiRoutes");
function routes(app) {
  app.use("/api/users", usersRouter);
  app.use("/api/ai", aiRoutes);
}

module.exports = routes;
