import vine from '@vinejs/vine';
import paginationConfig from '#config/pagination';

export const createPaginationValidator = (sortableFields: Array<string>) => {
  const sortValidator = vine.createRule((value, _options, field) => {
    if (!field.isValid) {
      return;
    }

    const match = /^([a-zA-Z][a-zA-Z0-9]*):(asc|desc)$/.exec(value as string);
    if (!match || !sortableFields.includes(match[1])) {
      field.report(
        `The sort parameter must be a sortable field (${sortableFields.join(', ')}) followed by :asc or :desc`,
        'sort',
        field
      );
    }
  });

  return vine.create(
    vine.object({
      page: vine.number().min(1).withoutDecimals().optional(),
      perPage: vine.number().min(1).max(paginationConfig.maxPerPage).withoutDecimals().optional(),
      sort: vine.string().use(sortValidator()).optional(),
    })
  );
};
