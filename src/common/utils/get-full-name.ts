export const getFullName = (firstName?: string, lastName?: string) => {
  if (firstName && !lastName) {
    return firstName;
  } else if (!firstName && lastName) {
    return lastName;
  } else if (firstName && lastName) {
    return `${firstName} ${lastName} `;
  }
  return null;
};

const listLastNameVietNam = [
  'nguyễn',
  'trần',
  'lê',
  'phạm',
  'hoàng',
  'huỳnh',
  'vũ',
  'võ',
  'phan',
  'trương',
  'bùi',
  'đặng',
  'đỗ',
  'ngô',
  'hồ',
  'dương',
  'đinh',
];

export const getSearchName = (search: string) => {
  const searchSplit = search.trim().split(' ');

  const results: Array<{ lastName?: string; firstName?: string }> = [];

  if (searchSplit.length === 0) {
    return results;
  }

  if (searchSplit.length === 1) {
    return listLastNameVietNam.includes(search.trim().toLowerCase())
      ? [
          {
            lastName: search.trim(),
          },
        ]
      : [{ firstName: search.trim() }];
  }

  const firstSearchSplit = searchSplit
    .slice(0, searchSplit.length - 1)
    .join(' ');
  const lastSearchSplit = searchSplit[searchSplit.length - 1];

  results.push({ firstName: firstSearchSplit, lastName: lastSearchSplit });
  results.push({ lastName: firstSearchSplit });

  return results;
};
