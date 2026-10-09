export function notFound(req, _res, next) {
  const e = new Error(`Not found: ${req.originalUrl}`);
  e.status = 404;
  next(e);
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message;
  if (err.name === 'ZodError') {
    status = 400;
    message = err.issues.map((i) => `${i.path.join('.') || 'value'}: ${i.message}`).join('; ');
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate value: already exists';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.name === 'ValidationError') {
    status = 400;
  }
  if (status >= 500) {
    if (process.env.NODE_ENV !== 'test') console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Internal server error';
  }
  res.status(status).json({ success: false, message });
}
