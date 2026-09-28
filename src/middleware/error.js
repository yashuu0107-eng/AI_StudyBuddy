exports.notFound = (req, res) => res.status(404).json({ error: "Route not found" });

exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  if (err.name === "CastError" || err.name === "ValidationError") status = 400;
  res.status(status).json({ error: err.message });
};
