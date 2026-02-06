const axios = require('axios');
const config = require('../config/environment');


const isURL = (value) => {
  if (!value || typeof value !== 'string') return false;
  
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};


const isBase64 = (value) => {
  if (!value || typeof value !== 'string') return false;
  
  const base64String = value.replace(/^data:image\/[a-z]+;base64,/, '');
  
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  return base64Regex.test(base64String) && base64String.length % 4 === 0;
};

const hasDataURIPrefix = (value) => {
  if (!value || typeof value !== 'string') return false;
  return /^data:image\/[a-z]+;base64,/.test(value);
};


const extractBase64FromDataURI = (dataURI) => {
  return dataURI.replace(/^data:image\/[a-z]+;base64,/, '');
};

// data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAMAAzAMBIgACEQEDEQH/xAAaAAEAAgMBAAAAAAAAAAAAAAACAQMEBQYA/8QAORAAAgECBAQEBAMGBwEAAAAAAAECAxEEEiExBUFRYRMicYEykaGxUsHwBhRCYtHhI0Nyc6KywiT/xAAZAQEAAwEBAAAAAAAAAAAAAAABAAIEAwX/xAAjEQEBAAMAAgEEAwEAAAAAAAAAAQIDESExEhNBUWEEMkIj/9oADAMBAAIRAxEAPwDmUKJ7Kup5Hh16ZCQYoeUClCIsSgJIQUJIqkJEoixKIsSEiEhJFUShINhIKSQkRYSRUpEgoSBOEhIKiNIC8JBQkCEhhSJAkSQhAjj0NAQ8q/EbmdIkQklzJAkhIMbcxqKfMKUko9oudyUVSEJBiNJBVnhIglAhIaCu4tApIlEEoqSQkQhKwJ1IkHmICSJR5WEgRKEESBEoRCFoBcchI9p1PI3VnISDHcsVuoF5CRFlyZIVEoRERpFS8h6gclHcyKGFqVFmm/Dh1ktX6IKegu+nqebUfidvUzYUcPD4aWd8nPZeyMmnVnBWpy8P/bSh/wBbP5nO5LzG1rYptXSdutmTmSerS9TaqtVvfxqt+rqy/qWxq1ZKzq1H61G18mUuzi/02oXYlG3lQp1F56NN9Wllf00+hRU4fH/Ila/8M9NezCbJRcLGCho9UpypTyzi1Lo0eRfvRwkSiEJAEoSChICSEgpCQIRKIJQFx6t0EmFMaydWbmdKEu4Vl5NiApQkFW5jWXqwqJR7NeajG7k9klqyutUjCD1+hl4OjKlHPNf4slrr8Pb1tv8ALqyeJPKe/EX4egqVpzyzqel1H06vu9Oib1L9Z76+utw043erZfGKM+WTRjhIMV+kOzt+ZOiFVnCGFqtNqSg9t9jn228X74Vqdt7Ls2WQndJ6W6o57CKji8RVzTqpucsuWVllzO30NhgKUaVeUKc5tNS0k76qVvyO2WqRwm2t5Tk7JoyKc4vSXP5GLR0gk737mRG3Qx5RolZE6FOvT8OpDPHl1j6GnxuDlg5rXNSk/LP9czb0ZOLs9V3MmVOFajKE4KdOW8W7X9+T6Bjl8b+lcp+HMISLMXh3hq+RtuDV4Tt8S/W/cqRpl7OxzNCQUJEBIlBTEgJIkhCViI45CTIvHozyNzgaEgq3MacejBEnpSSV2eurbP3MPH11Soyk3ayer5Ek74S3kZOATr13WfwUtI95f2NvTV2rbGFw+l4VCFOStKMfMv5nq/lt7GxpJJbas5br546asfHViXLkWRQVaxb5YU3KWyV2ZbWj7MbGYqnhKbnU3XL7bXevJJNvkaqtXxOKjllU8GP4bXl8k7L0bbMTFYr94xjvdyjJxj/Lyb9eXt3LpVaWGp5mm7q2+5tx1TCftky2fK/pdgcMqGJjJTk42s3Ja3vq7I2VfA56zqYPGONm7NpK93f15mmWMxLd40Gl0lZfRsy6HEJQmlXhKm3s9vkVzxz9nHPDnGwhjMRhJqnxGFlyqxW/r+r+ptaFRO19U9UzDlxfBVMC8NxBLVeSrazXbvyKeGSlBTo5ZZY2lTbVtGZs8LZ5nHSZTvit4o9TIoSyStyZj0XenFvexajJXYeKYbxqXlW7vHtL+9vmkaCL6nVL/GouG0rWXbozm8ZBU8TNZMqklNK+1917NNex205e4pkrJQUJHdU0SQrCQBKEFEgXHISChqUfwm5wJC5BvF7RseCoXI1tW2Ix1CjL4ZTWb/StZfRM2E3aD0uaqjUT4lFuPwwqf9GdNc+6my/Z0uEblFSn8U7zl6t3ZnxMLCteRJWtFGZFmHP216/6rURxB5eH1XyyM9FltWMa2FnTlH+FpnP1ZV75lcXgtcXUcm73l99TY14JeFU5aar11MGvCWGxXiZPK3q+/M3GEx0Z4N4dwhOk5X13TN2y/wCox4SeqzqNLAWtF09f5kmRU4bTnBqi1lf8L+9zEp4fDO6tUiuWSrKKXtcupYCDkvBrzhPldp/Xf6nC/mV151kYLgsadRTlaMvxR3fvv9TdxpKMFGOnoaRYnF4GoljYKdF/5iWq79/R/N7G2oV4yUWneD2Zw2/K+eumuSeOMyKskhorQ0ZnRkYd+Zmn47DJXg1oszXtJXX/AChUfubWk/Oa79o9oy7w+jkv/THV/eK5+mrQuQIsaZs45khIFxJlSaJQUxXDgcchLYOZfhRKZvrgSGgJpDzroBGt8BpKUrcUiusZr/i3+RuqrTg9EjnsRPwcbSqvRRmrvts/oddXly2Ozwcsyg+sEZsXsajAVH4UP5bxfszaRn2MOePLW3XexemW055THUiyN7X5HGx0U8QwCrRnKmoyjJaxa0ZoamCqUJvwpSg+lRNr2a1NrX4tQoPLKd5S+GLdnL0XxP1SZS+LTup1KDjTvZ5o2+7v80jTr+pIzZ/C1hQqY2C0dOSXSovzsZFHHVYSj41KST0u7fdaGx/eOHSjapVoRlbac1B/Jmu4nUo+SGDvJ1tlFXzd11t1WheX5XlxUs+M8V0eCxtPE4GWFrJVKc1/hze8WYXDc9GdTCuW2sfnqYvCJOnSSfKbsZdGV+IOUVylf0ucLhzsdZlbJW9ozz04stizFwztSRkJmK+2iL6b86NX+0tTywhfeUPq5P8A8mzpPU0HH6+fHUqSV7Nv2ikl9ZVV7F9OPc1Nl8KoiWxXEaZprmaEgJiuHELcQExXBHHpiQExqb6I3s6RXDmb5Im4FLV0zQcWp21fU6BNrYweIQvBuy+RfVeVTOeE8BxfiUoqUvNl19VodBRneK6nC4PFTwuJWayi39Tr8JXVSEZrZrXsyn8nXy9jp/Hz7ONmmX02nTaMKE7l0Kzi+xisa+ub4hKrhsROpDy05tKaStrot+6Rl4PH/wDzTo+Vwm05J73NnjMLGvGThZ5laUZK6aNDiOHOlO8G6VuTWaK/oa8M8c5ysmWGWN7GdBUreVSiukZSivkmi2nGmlKUIqOb4pLeXq92arAYmo6rpOSkk3q13MiMa9etKCnFau0VG7snb0LfHnuq3Ls9Nj+9QppQp2lJ/DFc/wBbmz4fRlGnnne7VldcuvuYnD+GRpvxK3nk93LW/q/y+/LcQsnrsZd2cnjFo14W+ayaWkUi2LMdSLIy0uzHY0MiVVUqTm7aLZ8+hySrLE8QrVoyzQTywfVLn7ycn7md+0XEvCpxw9GTdWTcVbk+b9l9WYOBp+HTstuWhq1YfDD5X7s+zLuUjMiINyUx4OmmJMFyUwRYiUFMm5OI5BX6EoKk+p5G5nWIle/yAnbYamwJorrQzxaHmbPE9FzfEcNZtpepkcH4lKjPwqzeXbf9amyxVFSi3Y0WKo1KTll23NONxznxrPZcL2O0pVVKKlDWL2aL4zOM4ZxieHl4eIk8r7aP+h0uHxdOur05pvmr6ox7dFxrXq2yzy2cJtO8dycXHxcJUtHzZXYxY1Et3Zl8K2jTd0+Rn+PL1372cc08NiKWIm6bpvzP+NLm+Ru8BhqtJxnVUMzi23B3V3Jvf0MtxpSd3HUtzRtY6Z7rlOcc8dMl6yaU7wWbcujNdzDjVSSSYvHte8kkubeiMtxd+s2Ml1MXiXE6WBw7nKbUktctrrsu/TlzNVxLjtHBx8rcqjXlS+J90uS7v2TNLS/eOIYnxcUrWvlgr2j89335mjV/G/1n6cM9/j44szBqtjMTLFYhLM7KKV7RjyS/XNm5grKxjYaHhxS7GSmXzy7fCmMsMSK0xJnJZYhIruJSBDQrgJAuQTEkytMam+p6DOVvX5CQMzfMlMqixDSZUpDU2BJrSzMXFYVVI7GTmuToMtg51zeLwEot2WhjUpYnCyTg3ZbJ7HVTpRmjCr4Jy2NGO6eq5Za7L2MbD8enBKGIjOOvON/7myocaws9HUin/rS+9jT1uHT6GNLh8/wkuvVkZnsjrIcQotaTbXqn9mS+J0IfFNe9SC+8jko4Goto/Qthgartujl9DX+V/rbG/rftDQpXySzvpFN/e35mur8ZxeLcVQThHlJ+Z/0XyDQ4Y2/Pd+ptsNgYw1t8yf8APX6iW55+612B4ZOUs9W85S1lKTu2/VnQYegqUUkj0IqCSRapPa5wzzuftfHH4mhJlaYkzk6LUiUVqTEpAixCRWmSmBWonUCkLMCOQUZdDwEyUzfxnWrXYaUuhSmJSKlbZrdHkwXJTJYi1aiSlyRVcSkBW2PKwEyUwPSyZ+R793X4TyY1IiAsPG/w2HGlFbJEpiuFtThxiNJ+pUmJMpVlq03JvqV3EmV4i1X6C83QqTJTHhWiWpUmJMoerbPkJX5oqTEmRFiYrldyblS5FPUajPsU3En3ZvZltpLV2seTK0+7FcOFancaUntYpUhZrkKxprclPQrTJTBFqLMsihNkp92HEXEpleYSZWmVarvYVmtyq+hKZDFtyblakJMrSsQ1sVKQswIsTEmVJiTKlahJlSkJMOIsTGmUpiTDi3VxKKlJiuHC/9k=

const detectImageFormat = (buffer) => {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }
  
   return 'image/jpeg';
};
const addDataURIPrefix = (base64, contentType = 'image/jpeg') => {
  const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');
  return `data:${contentType};base64,${cleanBase64}`;
};

const bufferToBase64 = (buffer) => {
  return buffer.toString('base64');
};



const fetchImageFromURL = async (url, options = {}) => {
  
  try {
    console.log('Fetching image from URL', { url });
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
 
    });
    
    const buffer = Buffer.from(response.data);
    
    
    const contentType=detectImageFormat(buffer)

    const base64 = bufferToBase64(buffer);
    
    const dataURI = addDataURIPrefix(base64, contentType);
    
    console.log('Image fetched and converted successfully', { 
      url, 
      size: buffer.length,
      contentType 
    });
    
    return dataURI;
    
  } catch (error) {
     
    console.error('Error fetching image', { url, error: error.message });
    throw new Error(`Failed to fetch image: ${error.message}`);
  }
};


const normalizeImageField = async (rawImage, sourceType = 'Unknown') => {
  if (!rawImage) {
    console.log('No image provided', { sourceType });
    return null;
  }
  
  try {
    if (isURL(rawImage)) {
      console.log('Image is URL, fetching...', { sourceType, url: rawImage });
      return await fetchImageFromURL(rawImage);
    }
    
    if (hasDataURIPrefix(rawImage)) {
      console.log('Image already has data URI prefix', { sourceType });
      return rawImage;
    }
    
    if (isBase64(rawImage)) {
      console.log('Image is raw base64, adding prefix', { sourceType });
      return addDataURIPrefix(rawImage);
    }
    
    console.log('Invalid image format', { sourceType });
    return null;
    
  } catch (error) {
    console.log('Error normalizing image', { 
      sourceType, 
      error: error.message 
    });
 return null
  }
};

module.exports = {
  isURL,
  isBase64,
  hasDataURIPrefix,
  extractBase64FromDataURI,
  addDataURIPrefix,
  bufferToBase64,
  fetchImageFromURL,
  normalizeImageField
};