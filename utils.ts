/**
 * Converts an image file to a Base64 string with validation.
 * @param file The image file to convert.
 * @param maxSizeInBytes The maximum allowed file size in bytes.
 * @param allowedTypes An array of allowed MIME types (e.g., ['image/jpeg', 'image/png']).
 * @returns A promise that resolves with the Base64 Data URL string.
 * @throws An error if validation fails.
 */
export const imageFileToBase64 = (
  file: File,
  maxSizeInBytes: number = 5 * 1024 * 1024, // Default 5MB
  allowedTypes: string[] = ['image/jpeg', 'image/png']
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 1. Validate file type
    if (!allowedTypes.includes(file.type)) {
      return reject(new Error(`Format file tidak valid. Harap gunakan: ${allowedTypes.join(', ')}`));
    }

    // 2. Validate file size
    if (file.size > maxSizeInBytes) {
      const maxSizeInMB = (maxSizeInBytes / (1024 * 1024)).toFixed(1);
      return reject(new Error(`Ukuran file terlalu besar. Maksimal ${maxSizeInMB} MB.`));
    }

    // 3. Read and convert file
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(new Error('Gagal membaca file.'));
  });
};

/**
 * Escapes a string value for CSV output.
 * - Encloses the value in double quotes if it contains commas, double quotes, or newlines.
 * - Escapes any double quotes within the value by doubling them.
 * @param value The value to escape.
 * @returns The escaped string.
 */
export const escapeCsvValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  let stringValue = String(value);
  // If the string contains a comma, double quote, or newline, enclose it in double quotes.
  // Also, any double quotes within the string must be escaped by doubling them.
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    stringValue = stringValue.replace(/"/g, '""'); // Escape existing double quotes
    return `"${stringValue}"`;
  }
  return stringValue;
};

/**
 * Safely sets an item in localStorage. Handles QuotaExceededError by cleaning up
 * old backup snapshots and stale version keys automatically, and prevents throwing uncaught exceptions.
 */
export const safeLocalStorageSet = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[LocalStorage] Set item '${key}' failed, attempting cleanup...`, error);
    try {
      // Clear non-essential backup snapshots and old versions to free space
      const staleKeys = [
        'database_portalinformasi_snapshots_v1',
        'schoolPortalData_v1',
        'schoolPortalData_v2',
        'schoolPortalData_v3',
        'schoolPortalData_v4',
        'schoolPortalData_v5',
        'schoolPortalData_v6',
        'schoolPortalData_v7',
        'schoolPortalAttendanceLog_v1',
        'schoolPortalAttendanceLog_v2',
        'schoolPortalAttendanceLog_v3',
        'schoolPortalAttendanceLog_v4',
        'schoolPortalAttendanceLog_v5',
        'schoolPortalAttendanceLog_v6',
        'schoolPortalELearning_v1',
        'schoolPortalELearning_v2',
        'schoolPortalELearning_v3',
        'schoolPortalELearning_v4',
        'schoolPortalELearning_v5',
        'schoolPortalELearning_v6',
        'schoolPortalGrades_v1',
        'schoolPortalGrades_v2',
        'schoolPortalGrades_v3',
        'schoolPortalGrades_v4',
        'schoolPortalGrades_v5',
        'schoolPortalGrades_v6',
      ];
      for (const k of staleKeys) {
        if (k !== key) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem(key, value);
      return true;
    } catch (secondError) {
      console.warn(`[LocalStorage] Set item '${key}' failed after cleanup.`, secondError);
      return false;
    }
  }
};
