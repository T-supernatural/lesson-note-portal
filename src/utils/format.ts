export const formatDate = (value: string | null | undefined) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
