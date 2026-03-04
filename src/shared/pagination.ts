export const paginationHelper = (query: { page: number; limit: number }) => {
  let { page = 1, limit = 10 } = query;
  page = Number(page);
  limit = Number(limit);

  const skip = (page - 1) * limit;
  const take = limit;

  return { skip, take, limit, page };
};
