export const isInHeader = (
  multimediaPlacement: string | undefined,
): boolean => {
  return multimediaPlacement === undefined || multimediaPlacement == "header";
};
