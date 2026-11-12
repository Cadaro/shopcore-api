import { test } from '@japa/runner';
import PaginationDataMapper from '#mappers/pagination_data_mapper';

test('maps pagination metadata including an empty result set', ({ assert }) => {
  assert.deepEqual(new PaginationDataMapper().map([], 2, 10, 0), {
    data: [],
    meta: { page: 2, perPage: 10, total: 0, lastPage: 0 },
  });
});
