module.exports = function trackDishView(req, res, next) {
  if (!req.session) req.session = {};
  if (!req.session.recentDishes) req.session.recentDishes = [];
  const dishId = req.params.id;
  if (dishId && !req.session.recentDishes.includes(dishId)) {
    req.session.recentDishes.unshift(dishId);
    if (req.session.recentDishes.length > 10) req.session.recentDishes.pop();
  }
  next();
}; 