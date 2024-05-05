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
