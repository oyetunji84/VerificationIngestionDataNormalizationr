const convertYYYYMMDDtoDDMMYYYY = (dateString) => {
  if (!dateString) return null;
  
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}-${month}-${year}`;
    }
    
    return dateString;
  } catch (error) {
    return dateString;
  }
};

const convertSlashDateToDDMMYYYY = (dateString) => {
  
  try {
    return dateString.replace(/\//g, '-');
  } catch (error) {
    logger.error('Error converting slash date to DD-MM-YYYY', { dateString, error: error.message });
    return dateString;
  }
};


const validateDateFormat = (dateString, format) => {
  if (!dateString) return false;
  
  const formatPatterns = {
    'DD-MM-YYYY': /^\d{2}-\d{2}-\d{4}$/,
    'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/,
    'DD/MM/YYYY': /^\d{2}\/\d{2}\/\d{4}$/
  };
  
  const pattern = formatPatterns[format];
  if (!pattern) {
    logger.warn('Unknown date format', { format });
    return false;
  }
  
  return pattern.test(dateString);
};

const normalizeDateToStandard = (dateString, sourceFormat = null) => {
  if (!dateString) return null;
  
  try {
    if (validateDateFormat(dateString, 'DD-MM-YYYY')) {
      return dateString;
    }
    if (validateDateFormat(dateString, 'YYYY-MM-DD')) {
      return convertYYYYMMDDtoDDMMYYYY(dateString);
    }
    
    if (validateDateFormat(dateString, 'DD/MM/YYYY')) {
      return convertSlashDateToDDMMYYYY(dateString);
    }
    
    return dateString;
    
  } catch (error) {
    return dateString;
  }
};

const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;
  
  try {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
    
  } catch (error) {
    return phoneNumber;
  }
};

module.exports = {
  convertYYYYMMDDtoDDMMYYYY,
  convertSlashDateToDDMMYYYY,
  validateDateFormat,
  normalizeDateToStandard,
  getCurrentTimestamp,
  formatPhoneNumber
};