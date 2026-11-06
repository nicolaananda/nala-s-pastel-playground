export const PUBLIC_CONTENT_CACHE_CONTROL = 'public, max-age=60, stale-while-revalidate=300';

export const publicContentCache = (req, res, next) => {
  if (!['book', 'article'].includes(req.params.type)) return next();

  const json = res.json.bind(res);
  res.json = body => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      res.set('Cache-Control', PUBLIC_CONTENT_CACHE_CONTROL);
    }
    return json(body);
  };
  next();
};
