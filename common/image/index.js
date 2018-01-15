module.exports = {
  name: 'image',
  description: "Upload and get image's url",
  services: {
    cloudinary: {
      require: ['::cloudinary', 'config'],
      func: (cloudinary, config) => {
        cloudinary.config(config.cloudinary);
        return cloudinary;
      }
    },
    'image.upload': {
      require: ['cloudinary', '::bluebird'],
      func: (cloudinary, Promise) =>
        data => {
          const deferred = Promise.pending();
          cloudinary.uploader.upload(data, result => {
            if (result.error) {
              deferred.reject(result.error);
            } else {
              deferred.resolve(result);
            }
          });
          return deferred.promise;
        }
    },
    'image.delete': {
      require: ['cloudinary', '::bluebird'],
      func: (cloudinary, Promise) =>
        id => {
          const deferred = Promise.pending();
          cloudinary.uploader.destroy(id, result => {
            if (result.error) {
              deferred.reject(result.error);
            } else {
              deferred.resolve(result);
            }
          });
          return deferred.promise;
        }
    }
  },
  exports: ['cloudinary', 'image.upload', 'image.delete']
};
