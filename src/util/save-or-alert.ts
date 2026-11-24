/** Runs `save`, and if it fails, logs the error and tells the user in an
 * alert instead of leaving it as an unhandled rejection they never see.
 * Returns whether it succeeded. */
export async function saveOrAlert(save: () => Promise<void>): Promise<boolean> {
  try {
    await save();
    return true;
  } catch (error) {
    console.error(error);
    alert(`Couldn't save: ${(error as Error).message}`);
    return false;
  }
}
