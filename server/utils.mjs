
const utils = async (supabase) => {

  const { data, error } = await supabase.storage.getBucket('participium');

  if (error) {
    console.error('Error fetching bucket:', error);
    throw error;
  }

  /**
   * Upload an image to the 'participium' bucket under reports/
   * @param {Uint8Array|Buffer|string} file_bytes
   * @param {string} file_name
   * @returns {object} upload response data
   */
  const uploadImage = async (file_bytes, file_name) => {
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('participium')
      .upload('reports/' + file_name, file_bytes, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }

    return uploadData;
  };


  return { uploadImage };
};

export default utils;